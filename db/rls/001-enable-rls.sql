-- ===========================================================================
-- MITHQAL Assurance — Enable Row-Level Security on all 11 business tables.
-- FULL-PLATFORM-BUILD deliverable.
--
-- Per §6.5 + §6.6 every business table MUST enforce RLS so a tenant
-- cannot read another tenant's rows. RLS is enabled here; the
-- per-table policies are defined in 002-tenant-policies.sql.
--
-- Truth state: WIRED, NOT APPLIED to production yet (per gap-register
-- §6.5). The pilot uses pilot-permissive auth (see src/lib/api-auth.ts);
-- when G2 (bank design partner) passes, the application connects as
-- a per-institution role and RLS policies enforce tenant isolation.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. institutions
-- ---------------------------------------------------------------------------
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions FORCE ROW LEVEL SECURITY;
-- The institutions table is the tenant-lookup table; the per-institution
-- role can read its own row. A separate `mithqal_admin` role bypasses RLS
-- (declared via BYPASSRLS in the role definition) for cross-tenant queries.

-- ---------------------------------------------------------------------------
-- 2. validation_cases
-- ---------------------------------------------------------------------------
ALTER TABLE validation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_cases FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. source_snapshots
-- ---------------------------------------------------------------------------
ALTER TABLE source_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_snapshots FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. evidence_events
-- ---------------------------------------------------------------------------
ALTER TABLE evidence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_events FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. exceptions
-- ---------------------------------------------------------------------------
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 6. policy_versions
-- ---------------------------------------------------------------------------
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions FORCE ROW LEVEL SECURITY;
-- The policy_versions table is shared across tenants (a policy version
-- applies to every institution). The policy is defined in 002 to allow
-- SELECT for every authenticated role but restricts writes to the
-- mithqal_admin role.

-- ---------------------------------------------------------------------------
-- 7. policy_decisions
-- ---------------------------------------------------------------------------
ALTER TABLE policy_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_decisions FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 8. reconciliation_cases
-- ---------------------------------------------------------------------------
ALTER TABLE reconciliation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_cases FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 9. idempotency_records
-- ---------------------------------------------------------------------------
ALTER TABLE idempotency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_records FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 10. outbox_events
-- ---------------------------------------------------------------------------
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
-- The outbox_events table is consumed by the Inngest dispatcher which
-- runs as the mithqal_admin role (BYPASSRLS). Per-tenant SELECTs are
-- restricted to rows whose payload->>'institutionId' matches the
-- current institution.

-- ---------------------------------------------------------------------------
-- 11. access_audit_events
-- ---------------------------------------------------------------------------
ALTER TABLE access_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_audit_events FORCE ROW LEVEL SECURITY;
