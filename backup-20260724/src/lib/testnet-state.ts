import { PrismaClient } from "@prisma/client";
import {
  computeState,
  type FullState,
  type OperationRow,
} from "@/lib/testnet-engine";

/**
 * MTQ testnet — Prisma client (testnet-scoped).
 *
 * We keep a SEPARATE client from the global `db` singleton in `@/lib/db`.
 * Why: the global singleton is created at first-import time and survives
 * hot-reloads via `globalThis`. If the dev server was started BEFORE a
 * `prisma generate` that added a new model (e.g. `TestnetOperation`), the
 * cached instance won't expose it. Keeping a dedicated client here means
 * we always instantiate from the freshly-generated PrismaClient class.
 */
const globalForTestnet = globalThis as unknown as {
  testnetPrisma?: PrismaClient;
};

function getDb(): PrismaClient {
  if (!globalForTestnet.testnetPrisma) {
    globalForTestnet.testnetPrisma = new PrismaClient({
      log: ["error", "warn"],
    });
  }
  return globalForTestnet.testnetPrisma;
}

/**
 * Read all operations, replay the ledger, and derive the full dashboard
 * state (KPIs, tiers, PoR, last 25 operations newest-first).
 *
 * Shared by GET /api/testnet and the post-mutation responses from
 * mint / redeem / seed.
 */
export async function fetchFullState(): Promise<FullState> {
  const db = getDb();
  const rows = await db.testnetOperation.findMany({
    orderBy: { createdAt: "asc" },
  });

  const ops: OperationRow[] = rows.map((r) => ({
    id: r.id,
    type: r.type as "mint" | "redeem",
    amountUsd: r.amountUsd,
    mtq: r.mtq,
    participant: r.participant,
    nav: r.nav,
    reserveRatio: r.reserveRatio,
    porHash: r.porHash,
    createdAt: r.createdAt,
  }));

  const derived = computeState(ops);

  // last 25, newest first
  const recent = ops.slice(-25).reverse();

  return { ...derived, operations: recent };
}
