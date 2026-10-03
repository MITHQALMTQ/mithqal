import { Inngest } from "inngest";

/**
 * Mithqal Inngest client — durable background-job layer.
 *
 * Inngest is the reliability layer for the Mithqal Brain data-source sync
 * pipeline and other long-running background jobs (oracle refresh,
 * reserve reconciliation, anomaly sweeps). The Turso database layer
 * (src/lib/db.ts) is the system of record for live state; Inngest
 * owns the *schedule* and *retry semantics* for jobs that fan out
 * from that state.
 *
 * Configuration (Vercel project env vars):
 *   INNGEST_EVENT_KEY    — signed event-send key (Inngest dashboard).
 *   INNGEST_SIGNING_KEY   — webhook signing key for /api/inngest.
 *
 * Both env vars are optional at module-load time — Inngest will surface
 * a warning and refuse to send events until they are set, but the
 * client itself constructs fine without them (so `bunx next build`
 * does not fail when the dashboard hasn't been provisioned yet).
 *
 * The route handler at `src/app/api/inngest/route.ts` re-exports
 * `serve()` with this client. Inngest Cloud polls that route to
 * discover registered functions and to invoke them on event.
 *
 * Constitutional compliance:
 *   - Inngest functions are READ-ONLY with respect to monetary state.
 *     They refresh oracle data, run reconciliation reports, and emit
 *     advisory signals — they NEVER mint, weight, or alter NAV.
 *   - The deterministic v19 monetary engine remains the sole writer.
 */

export const inngest = new Inngest({
  id: "mithqal",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

/**
 * Data-source sync function — refreshes the real-market-data snapshot.
 *
 * Triggered by the `sync/data-sources` event, which is emitted on a
 * fixed schedule (configured in the Inngest dashboard, or via an
 * external cron POSTing to /api/inngest). The single step,
 * `fetch-market-data`, delegates to `fetchRealMarketData()` from
 * `src/lib/real-market-feeds.ts` and returns the headline metrics
 * (VIX, gold spot, timestamp) so they are visible in the Inngest
 * run dashboard.
 *
 * Failures are automatically retried by Inngest with exponential
 * backoff (default policy) — no explicit retry config needed here.
 *
 * NOTE on API shape: Inngest v4 (`inngest@^4.21.0`, the version
 * installed here) consolidated the legacy 3-argument
 * `createFunction(options, trigger, handler)` shape into a single
 * 2-argument `createFunction(options, handler)` shape where the
 * trigger is part of the `options` object (as `triggers`). The
 * original task spec wrote the call in the legacy 3-arg form — this
 * file uses the modern 2-arg form so it passes typecheck against the
 * installed package. Behaviour is identical: trigger on
 * `sync/data-sources`, run `fetch-market-data` step.
 */
export const dataSourceSync = inngest.createFunction(
  {
    id: "data-source-sync",
    name: "Data Source Sync",
    triggers: [{ event: "sync/data-sources" }],
  },
  async ({ event, step }) => {
    await step.run("fetch-market-data", async () => {
      const { fetchRealMarketData } = await import("@/lib/real-market-feeds");
      const data = await fetchRealMarketData();
      return {
        vix: data.vix,
        gold: data.goldUsd,
        timestamp: data.timestamp,
      };
    });
  }
);
