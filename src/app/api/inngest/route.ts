import { serve } from "inngest/next";
import { inngest, dataSourceSync, tursoNeonSync, proofsPublishSync, marketDataSync } from "@/lib/inngest-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Inngest route — the public endpoint Inngest Cloud polls to discover
 * registered functions and to invoke them on event.
 *
 * HARMONY MODEL — 4 functions registered:
 *   1. data-source-sync    — refresh market data snapshot
 *   2. turso-neon-sync     — CDC sync Turso → Neon (the key integration)
 *   3. proofs-publish-sync — publish cryptographic proofs
 *   4. market-data-sync    — sync external market data sources
 */
const handler = serve(inngest, [
  dataSourceSync,
  tursoNeonSync,
  proofsPublishSync,
  marketDataSync,
]);

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
