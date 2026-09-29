"use client";

import { useEffect, useState } from "react";

interface LivePrice {
  goldUsd: number;
  silverUsd: number;
  timestamp: string;
  source?: "websocket" | "polling";
}

interface UseLivePricesResult {
  prices: LivePrice | null;
  connected: boolean;
  transport: "websocket" | "polling" | "none";
}

// R7 — WebSocket live price updates hook (v25.8)
//
// Connects to a WebSocket mini-service for live gold/silver prices.
// Falls back to /api/oracle polling if the WS service is not provisioned.
//
// Provisioning: operator must run the WS mini-service at
// `mini-services/live-prices-service/` on port 3033 (future work —
// NOT provisioned in v25.8). When it's up, this hook automatically
// upgrades from polling to push notifications.
//
// Per IMPL-RECOMMENDATIONS R7 (MEDIUM priority UX debt from v25.4 audit).
//
// Caddy gateway note (per project rules): all WS connections go through
// the same external port. The path is `/` and the port is encoded in the
// `XTransformPort` query parameter so Caddy can forward correctly.
// We construct the URL as:
//   `${wsProto}//${host}/?XTransformPort=3033`
// Caddy strips the query and forwards to port 3033 as a WS upgrade.

export function useLivePrices(): UseLivePricesResult {
  const [prices, setPrices] = useState<LivePrice | null>(null);
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState<"websocket" | "polling" | "none">("none");

  useEffect(() => {
    // Build the WS URL. The Caddy gateway routes by ?XTransformPort.
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/?XTransformPort=3033`;

    let ws: WebSocket | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    // Helper: poll /api/oracle every 30s as a fallback.
    const startPolling = () => {
      if (pollInterval) return;
      setTransport("polling");
      const poll = async () => {
        try {
          const res = await fetch("/api/oracle");
          const data = await res.json();
          if (cancelled) return;
          if (typeof data.goldUsd === "number" && typeof data.silverUsd === "number") {
            setPrices({
              goldUsd: data.goldUsd,
              silverUsd: data.silverUsd,
              timestamp:
                data.lastUpdated && data.lastUpdated.GOLD
                  ? new Date(Number(data.lastUpdated.GOLD) * 1000).toISOString()
                  : new Date().toISOString(),
              source: "polling",
            });
            setConnected(true);
          }
        } catch {
          // Silent — keep prior prices; will retry next interval.
          if (!cancelled) setConnected(false);
        }
      };
      // Fire immediately + on a 30s cadence.
      void poll();
      pollInterval = setInterval(poll, 30_000);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // Try WebSocket first. If the connection fails (e.g. service not
    // provisioned), the onerror/onclose handlers fall back to polling.
    try {
      ws = new WebSocket(wsUrl);
      // 6s handshake timeout — if WS doesn't open in 6s, fall back to polling.
      const handshakeTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          try { ws.close(); } catch { /* noop */ }
        }
      }, 6_000);

      ws.onopen = () => {
        clearTimeout(handshakeTimeout);
        if (cancelled) return;
        setConnected(true);
        setTransport("websocket");
        // Once WS is up, stop polling (we'll receive push updates).
        stopPolling();
      };

      ws.onclose = () => {
        clearTimeout(handshakeTimeout);
        if (cancelled) return;
        setConnected(false);
        // If we never got WS working, fall back to polling.
        if (transport !== "polling") {
          startPolling();
        }
      };

      ws.onerror = () => {
        clearTimeout(handshakeTimeout);
        if (cancelled) return;
        setConnected(false);
        // The onclose handler will fire next and trigger the polling fallback.
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        try {
          const data = JSON.parse(event.data);
          if (typeof data.goldUsd === "number" && typeof data.silverUsd === "number") {
            setPrices({
              goldUsd: data.goldUsd,
              silverUsd: data.silverUsd,
              timestamp: data.timestamp || new Date().toISOString(),
              source: "websocket",
            });
            setConnected(true);
            setTransport("websocket");
          }
        } catch {
          // Malformed payload — ignore, the next push will retry.
        }
      };
    } catch {
      // WebSocket constructor threw (rare — typically bad URL).
      // Fall back to polling immediately.
      startPolling();
    }

    return () => {
      cancelled = true;
      if (ws) {
        try { ws.close(); } catch { /* noop */ }
      }
      stopPolling();
    };
  }, []);

  return { prices, connected, transport };
}
