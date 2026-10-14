-- ===========================================================================
-- MITHQAL Assurance — Tenant isolation RLS policies.
-- FULL-PLATFORM-BUILD deliverable.
--
-- Per §6.6 every business table enforces tenant isolation: a
-- connecting role identified as `institution:<id>` can read + write
-- only rows belonging to its own institution. The policies below
-- express that contract.
--
-- Truth state: WIRED, NOT APPLIED to production yet (per gap-register
-- §6.6). When G2 (bank design partner) passes, the application
-- connects via the per-institution role (configured in
-- `institutions.config.role_name`) and these policies enforce the
-- isolation contract.
--
-- Role model:
--   mithqal_admin            — BYPASSRLS; cross-tenant reads + writes.
--   mithqal_institution_<id> — restricted to its own institution's rows.
--
-- The current_institution_id() SQL function reads the role name
-- (e.g. `mithqal_institution_inst-demo-bank-us`) and extracts the
-- institution id. The function returns NULL when the connecting role
-- is not an institution role; the policy then enforces `false` (no
-- rows visible) — fail-closed defaults.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Helper function — extract the institution id from the current role.
-- Returns NULL when the connecting role is not an institution role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_institution_id() RETURNS varchar AS $$
DECLARE
  role_name text;
  inst_id   varchar;
BEGIN
  role_name := current_user;
  -- Role names follow the convention `mithqal_institution_<id>`.
  -- The institution id may contain hyphens (e.g. inst-demo-bank-us).
  IF role_name LIKE 'mithqal_institution_%' THEN
    inst_id := substring(role_name FROM 'mithqal_institution_(.*)');
    RETURN inst_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ---------------------------------------------------------------------------
-- 1. institutions — an institution role can read its own row.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS institutions_tenant_select ON institutions;
CREATE POLICY institutions_tenant_select ON institutions
  FOR SELECT
  USING (id = current_institution_id() OR current_institution_id() IS NULL AND false);

DROP POLICY IF EXISTS institutions_tenant_update ON institutions;
CREATE POLICY institutions_tenant_update ON institutions
  FOR UPDATE
  USING (id = current_institution_id());

-- ---------------------------------------------------------------------------
-- 2. validation_cases — institution_id is the tenant column.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS validation_cases_tenant_select ON validation_cases;
CREATE POLICY validation_cases_tenant_select ON validation_cases
  FOR SELECT
  USING (institution_id = current_institution_id());

DROP POLICY IF EXISTS validation_cases_tenant_insert ON validation_cases;
CREATE POLICY validation_cases_tenant_insert ON validation_cases
  FOR INSERT
  WITH CHECK (institution_id = current_institution_id());

DROP POLICY IF EXISTS validation_cases_tenant_update ON validation_cases;
CREATE POLICY validation_cases_tenant_update ON validation_cases
  FOR UPDATE
  USING (institution_id = current_institution_id());

-- ---------------------------------------------------------------------------
-- 3. source_snapshots — join via validation_cases.institution_id.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS source_snapshots_tenant_select ON source_snapshots;
CREATE POLICY source_snapshots_tenant_select ON source_snapshots
  FOR SELECT
  USING (
    validation_case_id IN (
      SELECT id FROM validation_cases WHERE institution_id = current_institution_id()
    )
  );

DROP POLICY IF EXISTS source_snapshots_tenant_insert ON source_snapshots;
CREATE POLICY source_snapshots_tenant_insert ON source_snapshots
  FOR INSERT
  WITH CHECK (
    validation_case_id IN (
      SELECT id FROM validation_cases WHERE institution_id = current_institution_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. evidence_events — institution_id is the tenant column.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS evidence_events_tenant_select ON evidence_events;
CREATE POLICY evidence_events_tenant_select ON evidence_events
  FOR SELECT
  USING (institution_id = current_institution_id());

DROP POLICY IF EXISTS evidence_events_tenant_insert ON evidence_events;
CREATE POLICY evidence_events_tenant_insert ON evidence_events
  FOR INSERT
  WITH CHECK (institution_id = current_institution_id());

-- ---------------------------------------------------------------------------
-- 5. exceptions — join via validation_cases.institution_id.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS exceptions_tenant_select ON exceptions;
CREATE POLICY exceptions_tenant_select ON exceptions
  FOR SELECT
  USING (
    validation_case_id IN (
      SELECT id FROM validation_cases WHERE institution_id = current_institution_id()
    )
  );

DROP POLICY IF EXISTS exceptions_tenant_insert ON exceptions;
CREATE POLICY exceptions_tenant_insert ON exceptions
  FOR INSERT
  WITH CHECK (
    validation_case_id IN (
      SELECT id FROM validation_cases WHERE institution_id = current_institution_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. policy_versions — shared across tenants (read-only for institutions).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_versions_tenant_select ON policy_versions;
CREATE POLICY policy_versions_tenant_select ON policy_versions
  FOR SELECT
  USING (true);  -- every institution role can read the active policy versions.

-- Writes are admin-only (no per-tenant policy defined).

-- ---------------------------------------------------------------------------
-- 7. policy_decisions — join via validation_cases.institution_id.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_decisions_tenant_select ON policy_decisions;
CREATE POLICY policy_decisions_tenant_select ON policy_decisions
  FOR SELECT
  USING (
    validation_case_id IN (
      SELECT id FROM validation_cases WHERE institution_id = current_institution_id()
    )
  );

DROP POLICY IF EXISTS policy_decisions_tenant_insert ON policy_decisions;
CREATE POLICY policy_decisions_tenant_insert ON policy_decisions
  FOR INSERT
  WITH CHECK (
    validation_case_id IN (
      SELECT id FROM validation_cases WHERE institution_id = current_institution_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 8. reconciliation_cases — join via validation_cases.institution_id.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS reconciliation_cases_tenant_select ON reconciliation_cases;
CREATE POLICY reconciliation_cases_tenant_select ON reconciliation_cases
  FOR SELECT
  USING (
    validation_case_id IN (
      SELECT id FROM validation_cases WHERE institution_id = current_institution_id()
    )
  );

DROP POLICY IF EXISTS reconciliation_cases_tenant_insert ON reconciliation_cases;
CREATE POLICY reconciliation_cases_tenant_insert ON reconciliation_cases
  FOR INSERT
  WITH CHECK (
    validation_case_id IN (
      SELECT id FROM validation_cases WHERE institution_id = current_institution_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 9. idempotency_records — institution_id is the tenant column.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS idempotency_records_tenant_select ON idempotency_records;
CREATE POLICY idempotency_records_tenant_select ON idempotency_records
  FOR SELECT
  USING (institution_id = current_institution_id());

DROP POLICY IF EXISTS idempotency_records_tenant_insert ON idempotency_records;
CREATE POLICY idempotency_records_tenant_insert ON idempotency_records
  FOR INSERT
  WITH CHECK (institution_id = current_institution_id());

-- ---------------------------------------------------------------------------
-- 10. outbox_events — tenant via payload->>'institutionId'.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS outbox_events_tenant_select ON outbox_events;
CREATE POLICY outbox_events_tenant_select ON outbox_events
  FOR SELECT
  USING (payload->>'institutionId' = current_institution_id());

DROP POLICY IF EXISTS outbox_events_tenant_insert ON outbox_events;
CREATE POLICY outbox_events_tenant_insert ON outbox_events
  FOR INSERT
  WITH CHECK (payload->>'institutionId' = current_institution_id());

-- ---------------------------------------------------------------------------
-- 11. access_audit_events — institution_id is the tenant column.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS access_audit_events_tenant_select ON access_audit_events;
CREATE POLICY access_audit_events_tenant_select ON access_audit_events
  FOR SELECT
  USING (institution_id = current_institution_id());

DROP POLICY IF EXISTS access_audit_events_tenant_insert ON access_audit_events;
CREATE POLICY access_audit_events_tenant_insert ON access_audit_events
  FOR INSERT
  WITH CHECK (institution_id = current_institution_id());
