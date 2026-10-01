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

/**
 * proofsPublishSync — daily constitutional Proof-of-Reserves attestation.
 *
 * CR-2026-029 (v25.3.22): triggered by an Inngest cron at 00:00 UTC daily
 * (`"0 0 * * *"`), invoking the SAME logic as `POST /api/proofs/publish`
 * rather than re-implementing the 7-proof computation inline. The publish
 * route is the canonical writer of the `ProofAttestation` table — duplicating
 * the logic here would create drift risk. The Inngest cron makes a signed
 * `fetch()` POST to the deployed route, passing `CRON_SECRET` as the Bearer
 * token (the same secret Vercel Cron uses). This keeps the writer surface
 * at exactly one site.
 *
 * Honest-state: this function REPLACES (does not duplicate) the Vercel-Cron
 * schedule documented in `vercel.json` for `/api/proofs/publish`. Both
 * schedules are mutually exclusive in practice — operators should disable
 * the Vercel Cron entry once Inngest is the active scheduler. The route
 * itself stays unchanged.
 *
 * Graceful degradation:
 *   - If `CRON_SECRET` is not set → step returns `{ ok: false, reason:
 *     "CRON_SECRET unset" }` (no fetch attempted; the publish route would
 *     reject with 500 anyway).
 *   - If `VERCEL_URL` and `NEXT_PUBLIC_SITE_URL` are both unset (local dev
 *     without Vercel env) → step falls back to `http://localhost:3000`
 *     so the cron can be smoke-tested locally.
 *   - If the publish route returns non-2xx → step throws and Inngest
 *     retries with exponential backoff (default policy).
 */
export const proofsPublishSync = inngest.createFunction(
  {
    id: "proofs-publish-sync",
    name: "Daily PoR Publish Sync",
    triggers: [{ cron: "0 0 * * *" }], // 00:00 UTC daily
  },
  async ({ step }) => {
    return await step.run("invoke-proofs-publish", async () => {
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret) {
        return { ok: false, reason: "CRON_SECRET unset — publish route is gated on this secret" };
      }

      // Construct the public URL of the deployed app. `VERCEL_URL` is set
      // automatically by Vercel for production + preview deployments.
      // `NEXT_PUBLIC_SITE_URL` is the canonical public URL (set in the
      // Vercel project env vars). Local dev falls back to localhost.
      const host =
        process.env.NEXT_PUBLIC_SITE_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const url = `${host.replace(/\/$/, "")}/api/proofs/publish`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(60_000), // 60s — publish route does ~7 DB writes
      });

      if (!res.ok) {
        // Surface the upstream error so Inngest's run dashboard shows it.
        const body = await res.text().catch(() => "<unread>");
        throw new Error(`proofs/publish ${res.status}: ${body}`);
      }

      const json = (await res.json()) as {
        ok?: boolean;
        date?: string;
        monetary?: { porHash?: string };
      };
      return {
        ok: true,
        date: json.date,
        porHash: json.monetary?.porHash,
      };
    });
  }
);

/**
 * marketDataSync — daily refresh of the real-market-data snapshot.
 *
 * CR-2026-029 (v25.3.22): triggered by an Inngest cron at 06:00 UTC daily
 * (`"0 6 * * *"`), this function refreshes the full COFER / SWIFT / BIS /
 * VIX / credit-spread snapshot by calling `fetchRealMarketData()` directly
 * (NOT through an HTTP round-trip — the function is server-side and the
 * lib is already bundled). The 06:00 UTC time aligns with the IMF COFER
 * publication window (most central-bank daily snapshots are fresh by 06Z).
 *
 * The `dataSourceSync` function (above) is the on-demand variant —
 * triggered by the `sync/data-sources` event when an operator clicks
 * "Refresh data sources" in the dashboard. This is the scheduled twin.
 *
 * Failures auto-retry via Inngest's default exponential-backoff policy.
 */
export const marketDataSync = inngest.createFunction(
  {
    id: "market-data-sync",
    name: "Daily Market Data Sync",
    triggers: [{ cron: "0 6 * * *" }], // 06:00 UTC daily
  },
  async ({ step }) => {
    return await step.run("fetch-real-market-data", async () => {
      const { fetchRealMarketData } = await import("@/lib/real-market-feeds");
      const data = await fetchRealMarketData();
      return {
        vix: data.vix,
        gold: data.goldUsd,
        silver: data.silverUsd,
        creditSpreadBaaAaa: data.creditSpreadBaaAaa,
        treasury10yr: data.treasury10yr,
        timestamp: data.timestamp,
        sources: data.sources,
        honestState: data.honestState,
      };
    });
  }
);
