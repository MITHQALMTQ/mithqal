/**
 * MITHQAL — Inngest client re-export.
 *
 * The canonical Inngest client lives at `@/lib/inngest-client` (kept
 * intact from v26.0). This file is the import path prescribed by
 * MITHQAL-TECH-SPEC-001 §4.2.1 — API routes import from `@/inngest/client`
 * so the public path matches the spec while the implementation stays
 * in the v26.0 lib module.
 *
 * Truth state: WIRED. The client constructs without env vars (Inngest
 * surfaces a runtime warning if INNGEST_EVENT_KEY is missing) so
 * `next build` succeeds without provisioning Inngest Cloud.
 */

export { dataSourceSync, inngest } from "@/lib/inngest-client";
