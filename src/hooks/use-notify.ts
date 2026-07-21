"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/**
 * Subscribe to the Mithqal notification mini-service (port 3003 via Caddy).
 * Returns the connection state. Reconnects automatically.
 *
 * Per project convention, the client connects with:
 *   io("/?XTransformPort=3003")
 * (path is "/", port is encoded in the XTransformPort query param).
 */
export function useNotify(onEvent?: (event: string, payload: unknown) => void) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);

  // Keep the handler ref current without mutating during render.
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // Connect to the notification mini-service (port 3003).
    // In this dev sandbox we connect directly — the Next.js App Router
    // intercepts the /socket.io/ path at port 3000, so routing through the
    // gateway would 308-redirect and break the handshake. Direct
    // cross-origin is permitted by the notify-service CORS config.
    const isBrowser = typeof window !== "undefined";
    const url = isBrowser
      ? `${window.location.protocol}//${window.location.hostname}:3003`
      : undefined;
    const socket = io(url ?? "/", {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Relay the known event to the handler.
    const relay = (payload: unknown) => {
      handlerRef.current?.("submission:new", payload);
    };
    socket.on("submission:new", relay);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("submission:new", relay);
      socket.disconnect();
    };
  }, []);

  return { connected };
}
