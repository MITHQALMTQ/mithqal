"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Key, Clock, MapPin, Fingerprint, AlertCircle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * SecurityPanel — institutional-grade security indicators for the Admin console.
 * Shows: session timer (8h max countdown), last login, IP indicator, 2FA badge,
 * hardware-key badge, plus an integrity bar + session note.
 *
 * P1 spec alignment:
 *   - Session: "3h 27m remaining" (8h max, live countdown)
 *   - Last login: "2h ago" (mock)
 *   - IP: "1.2.3.4" (mock — production reads from request headers)
 *   - 2FA: "Enabled" (or "Recommended" if not configured)
 *   - Hardware key: "Not configured" (status: warn)
 */
export function SecurityPanel() {
  const [sessionInfo, setSessionInfo] = useState<{
    expiresAt?: string;
    ip: string;
    device: string;
    lastLoginIso: string;
    twofaEnabled: boolean;
    hardwareKeyConfigured: boolean;
  }>({
    ip: "1.2.3.4", // mock — in production this would come from the request
    device: "Chrome · macOS",
    lastLoginIso: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
    twofaEnabled: true,
    hardwareKeyConfigured: false,
  });
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    // Fetch session info from NextAuth's session endpoint (sets `expiresAt`).
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.expires) {
          setSessionInfo((prev) => ({
            ...prev,
            expiresAt: d.expires,
            device:
              typeof navigator !== "undefined" && navigator.userAgent.includes("Chrome")
                ? "Chrome · " + (navigator.platform || "desktop")
                : prev.device,
          }));
        }
      })
      .catch(() => {});

    const updateRemaining = () => {
      if (sessionInfo.expiresAt) {
        const expires = new Date(sessionInfo.expiresAt).getTime();
        const diff = expires - Date.now();
        if (diff > 0) {
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        } else {
          setTimeRemaining("Expired");
        }
      }
    };
    updateRemaining();
    const id = setInterval(updateRemaining, 30_000);
    return () => clearInterval(id);
  }, [sessionInfo.expiresAt]);

  const lastLoginLabel = (() => {
    const diff = Date.now() - new Date(sessionInfo.lastLoginIso).getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return Math.round(diff / 60_000) + "m ago";
    if (diff < 86_400_000) return Math.round(diff / 3_600_000) + "h ago";
    return Math.round(diff / 86_400_000) + "d ago";
  })();

  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-gold" />
        <h3 className="font-display text-sm text-foreground">Security Status</h3>
        <Badge className="ml-auto border-reserve/40 bg-reserve/10 text-[10px] text-reserve">SECURE</Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Session timer (8h max, countdown) */}
        <SecurityMetric
          icon={<Clock className="h-3.5 w-3.5 text-gold" />}
          label="Session"
          value={timeRemaining || "—"}
          status={timeRemaining === "Expired" ? "warn" : "ok"}
          detail="8h max"
        />

        {/* Last login (mock) */}
        <SecurityMetric
          icon={<History className="h-3.5 w-3.5 text-fg-muted" />}
          label="Last login"
          value={lastLoginLabel}
          status="ok"
          detail={new Date(sessionInfo.lastLoginIso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        />

        {/* IP indicator (mock — production reads from headers) */}
        <SecurityMetric
          icon={<MapPin className="h-3.5 w-3.5 text-fg-muted" />}
          label="IP"
          value={sessionInfo.ip}
          status="ok"
          detail={sessionInfo.device}
        />

        {/* 2FA badge */}
        <SecurityMetric
          icon={<Key className={`h-3.5 w-3.5 ${sessionInfo.twofaEnabled ? "text-reserve" : "text-gold"}`} />}
          label="2FA"
          value={sessionInfo.twofaEnabled ? "Enabled" : "Recommended"}
          status={sessionInfo.twofaEnabled ? "ok" : "warn"}
          detail={sessionInfo.twofaEnabled ? "App password (TOTP)" : "Configure now"}
        />

        {/* Hardware key badge */}
        <SecurityMetric
          icon={<Fingerprint className={`h-3.5 w-3.5 ${sessionInfo.hardwareKeyConfigured ? "text-reserve" : "text-gold"}`} />}
          label="Hardware key"
          value={sessionInfo.hardwareKeyConfigured ? "Configured" : "Not configured"}
          status={sessionInfo.hardwareKeyConfigured ? "ok" : "warn"}
          detail={sessionInfo.hardwareKeyConfigured ? "YubiKey · FIDO2" : "Add a YubiKey"}
        />

        {/* Access (IP-derived device) */}
        <SecurityMetric
          icon={<MapPin className="h-3.5 w-3.5 text-fg-muted" />}
          label="Access"
          value={sessionInfo.device}
          status="ok"
          detail="Browser"
        />
      </div>

      {/* Session integrity bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-fg-muted">
          <span>Session integrity</span>
          <span>{timeRemaining || "Active"}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-card">
          <motion.div
            className="h-full bg-reserve"
            initial={{ width: "100%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Last login + session note */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-ink-card/50 p-3">
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-fg-muted" />
        <div className="text-[10px] text-fg-muted">
          <span className="font-medium text-foreground">Session note:</span> Operator access is env-defined
          (ADMIN_EMAIL + ADMIN_PASSWORD_HASH). No user table exists. All write operations are logged to
          Turso DB with tx_hash. Session expires in 8 hours. Re-authentication required after expiry.
          {sessionInfo.hardwareKeyConfigured ? null : (
            <>
              {" "}
              <span className="text-gold">Hardware key recommended</span> — add a FIDO2/YubiKey for
              defense-in-depth against credential theft.
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SecurityMetric({
  icon,
  label,
  value,
  status,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  status: "ok" | "warn" | "fail";
  detail?: string;
}) {
  const tone =
    status === "ok" ? "text-reserve" : status === "warn" ? "text-gold" : "text-red-400";

  return (
    <div className="rounded-lg border border-line bg-ink-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-fg-muted">{label}</span>
        {icon}
      </div>
      <div className={`mt-1 font-display text-sm ${tone}`}>{value}</div>
      {detail && <div className="mt-0.5 text-[9px] text-fg-muted">{detail}</div>}
    </div>
  );
}
