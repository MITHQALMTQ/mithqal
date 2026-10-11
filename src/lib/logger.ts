/**
 * MITHQAL — Pino structured logger (MITHQAL-TECH-SPEC-001 §2.2).
 *
 * Pino is the project's only structured-logging layer. The logger is
 * configured with `pino-pretty` in development for readable console
 * output and raw JSON in production for ingestion by Vercel / Sentry.
 *
 * Truth state: WIRED. No telemetry is shipped until Vercel + Sentry
 * env vars (SENTRY_DSN, OTEL_EXPORTER_OTLP_ENDPOINT) are provisioned —
 * the logger degrades gracefully to console-only.
 */

import pino, { type Logger } from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Build the appropriate destination stream for the runtime.
 * - dev: pino-pretty for colourised, human-readable output.
 * - prod: stdout JSON (default pino destination).
 */
function createLogger(): Logger {
  const baseConfig = {
    name: "mithqal",
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    // Redact known secret env-var keys if they ever leak into log
    // payloads — defence in depth, not a substitute for discipline.
    redact: {
      paths: [
        "DATABASE_URL",
        "NEXTAUTH_SECRET",
        "JWT_SECRET",
        "INNGEST_EVENT_KEY",
        "INNGEST_SIGNING_KEY",
        "ADMIN_PASSWORD_HASH",
        "OPERATOR_TOTP_SECRET",
        "*.DATABASE_URL",
        "*.NEXTAUTH_SECRET",
        "*.INNGEST_SIGNING_KEY",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
    // Stable service context for downstream ingestion.
    base: {
      service: "mithqal-control-plane",
      version: "v1.0.0",
      env: process.env.NODE_ENV ?? "development",
    },
    // Use Date.now only in prod; in dev we let pino-pretty handle it.
    timestamp: isDev ? false : pino.stdTimeFunctions.isoTime,
  };

  if (isDev) {
    // Lazy-load pino-pretty so prod bundles stay lean.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pretty = require("pino-pretty");
    return pino(baseConfig, pretty({ colorize: true, translateTime: "HH:MM:ss" }));
  }

  return pino(baseConfig);
}

export const logger: Logger = createLogger();

/**
 * Convenience child logger for a specific request / operation context.
 * Use in API routes to attach a correlation id:
 *   const log = logger.child({ requestId, instructionId });
 */
export function createRequestLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}
