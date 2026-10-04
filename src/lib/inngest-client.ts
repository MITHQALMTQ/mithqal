import { Inngest } from "inngest";

/**
 * Mithqal Inngest client — durable background-job layer.
 *
 * Inngest is the reliability layer for the Mithqal Brain data-source sync
 * pipeline and other long-running background jobs (oracle refresh,
 * reserve reconciliation, anomaly sweeps, Turso→Neon CDC sync). The Turso
 * database layer (src/lib/db.ts) is the system of record for live state;
 * Inngest owns the *schedule* and *retry semantics* for jobs that fan out
 * from that state.
 *
 * Architecture (HARMONY MODEL):
 *   GitHub (push) → Vercel (deploy) → Application
 *                                        ↓
 *                                  Turso (primary DB — fast writes)
 *                                        ↓ (Inngest CDC sync event)
 *                                  Neon (analytics replica + evidence archive)
 *
 * Inngest orchestrates:
 *   1. dataSourceSync    — refresh market data snapshot (daily)
 *   2. tursoNeonSync     — CDC sync from Turso to Neon (hourly)
 *   3. proofsPublishSync — publish cryptographic proofs (daily)
 *   4. marketDataSync    — sync market data from external sources (daily 06:00)
 *
 * Constitutional compliance:
 *   - Inngest functions are READ-ONLY with respect to monetary state.
 *   - They NEVER mint, weight, or alter NAV.
 *   - The deterministic v19 monetary engine remains the sole writer.
 *
 * BUILD_MODE = FROZEN — this is an integration layer, NOT new architecture.
 */

export const inngest = new Inngest({
  id: "mithqal",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

/**
 * 1. Data Source Sync — refreshes real-market-data snapshot.
 * Triggered by `sync/data-sources` event (daily via Vercel cron or Inngest schedule).
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
 * 2. Turso → Neon CDC Sync — keeps Neon analytics replica in sync with Turso primary.
 * Triggered by `sync/turso-neon` event (hourly recommended).
 *
 * This is the key HARMONY function:
 *   - Turso (primary, edge-deployed) → fast writes/reads
 *   - Neon (analytics replica) → heavy queries offloaded + durable archive
 */
export const tursoNeonSync = inngest.createFunction(
  {
    id: "turso-neon-sync",
    name: "Turso → Neon CDC Sync",
    triggers: [{ event: "sync/turso-neon" }, { cron: "0 * * * *" }],
  },
  async ({ event, step }) => {
    const result = await step.run("sync-tables", async () => {
      const { syncAllTablesToNeon } = await import("@/lib/turso-neon-sync");
      return await syncAllTablesToNeon();
    });
    return result;
  }
);

/**
 * 3. Proofs Publish Sync — publishes cryptographic proofs.
 * Triggered by `sync/proofs-publish` event (daily at 00:00 UTC).
 */
export const proofsPublishSync = inngest.createFunction(
  {
    id: "proofs-publish-sync",
    name: "Proofs Publish Sync",
    triggers: [{ event: "sync/proofs-publish" }, { cron: "0 0 * * *" }],
  },
  async ({ event, step }) => {
    const result = await step.run("publish-proofs", async () => {
      // Delegate to the proofs endpoint
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret) {
        return { ok: false, reason: "CRON_SECRET not set" };
      }
      const response = await fetch(`${siteUrl}/api/proofs/publish`, {
        method: "POST",
        headers: { "x-cron-secret": cronSecret },
      });
      return { ok: response.ok, status: response.status };
    });
    return result;
  }
);

/**
 * 4. Market Data Sync — syncs market data from external sources (FRED, etc.).
 * Triggered by `sync/market-data` event (daily at 06:00 UTC).
 */
export const marketDataSync = inngest.createFunction(
  {
    id: "market-data-sync",
    name: "Market Data Sync",
    triggers: [{ event: "sync/market-data" }, { cron: "0 6 * * *" }],
  },
  async ({ event, step }) => {
    const result = await step.run("fetch-market-data", async () => {
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
      };
    });
    return result;
  }
);

/** All registered Inngest functions (for the route handler to serve). */
export const allFunctions = [dataSourceSync, tursoNeonSync, proofsPublishSync, marketDataSync];
