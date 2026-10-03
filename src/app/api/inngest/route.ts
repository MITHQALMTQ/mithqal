import { serve } from "inngest/next";
import { inngest, dataSourceSync } from "@/lib/inngest-client";

export const dynamic = "force-dynamic";

/**
 * Inngest route — the public endpoint Inngest Cloud polls to discover
 * registered functions and to invoke them on event.
 *
 *   GET  → register functions (Inngest Cloud calls this on deploy + on
 *          every sync cycle to learn what this app can run).
 *   POST → invoke a specific function for a given event/run.
 *   PUT  → update a running function (used by Inngest Cloud to push
 *          step transitions).
 *
 * The `dynamic = "force-dynamic"` export is required: the route is
 * stateful and per-request signed, so it must never be cached by the
 * Next.js static-asset pipeline.
 *
 * Registered functions:
 *   - dataSourceSync — refreshes the real-market-data snapshot.
 *
 * To add more functions, import them from `@/lib/inngest-client` and
 * append them to the `functions` array below. Do NOT register the
 * same function twice — Inngest Cloud will reject the sync.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dataSourceSync],
});
