/**
 * MITHQAL Assurance — Drizzle Schema
 * Per MASTER BLUEPRINT §16.3 Minimum Logical Data Model
 * 11 tables with tenant isolation
 */
import { pgTable, varchar, timestamp, jsonb, integer, decimal, pgEnum, index, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const validationStatusEnum = pgEnum("validation_status", [
  "RECEIVED", "VALIDATED", "EXCEPTION_OPENED", "RESOLVED", "REPLAYED", "SAFE_HALTED", "CLOSED"
]);

export const severityEnum = pgEnum("severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const eventTypeEnum = pgEnum("event_type", [
  "RECORD_RECEIVED", "SOURCE_AUTHENTICATED", "VALIDATION_PASSED", "EXCEPTION_OPENED",
  "HUMAN_APPROVAL_RECORDED", "PROVIDER_ACKNOWLEDGEMENT_RECEIVED",
  "SETTLEMENT_CONFIRMATION_RECEIVED", "RECONCILIATION_COMPLETED",
  "EVIDENCE_CONFLICT_DETECTED", "DISPUTE_OPENED"
]);

// §16.3 Table 1: institutions / tenants
export const institutions = pgTable("institutions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 10 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  participantType: varchar("participant_type", { length: 50 }).notNull(),
  config: jsonb("config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  jurisdictionIdx: index("inst_jurisdiction_idx").on(t.jurisdiction),
}));

// §16.3 Table 2: validation_cases
export const validationCases = pgTable("validation_cases", {
  id: varchar("id", { length: 50 }).primaryKey(),
  institutionId: varchar("institution_id", { length: 50 }).notNull().references(() => institutions.id),
  sourceReference: varchar("source_reference", { length: 255 }),
  corridor: varchar("corridor", { length: 50 }),
  sourceCurrency: varchar("source_currency", { length: 3 }),
  targetCurrency: varchar("target_currency", { length: 3 }),
  amount: decimal("amount", { precision: 20, scale: 2 }),
  status: validationStatusEnum("status").notNull().default("RECEIVED"),
  policyVersion: varchar("policy_version", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  institutionIdx: index("vc_institution_idx").on(t.institutionId),
  statusIdx: index("vc_status_idx").on(t.status),
  createdIdx: index("vc_created_idx").on(t.createdAt),
}));

// §16.3 Table 3: source_snapshots
export const sourceSnapshots = pgTable("source_snapshots", {
  id: varchar("id", { length: 50 }).primaryKey(),
  validationCaseId: varchar("validation_case_id", { length: 50 }).notNull().references(() => validationCases.id),
  sourceSystem: varchar("source_system", { length: 100 }).notNull(),
  recordVersion: varchar("record_version", { length: 50 }),
  payloadRef: text("payload_ref"),
  payloadDigest: varchar("payload_digest", { length: 255 }).notNull(),
  sourceTimestamp: timestamp("source_timestamp").notNull(),
  ingestionTimestamp: timestamp("ingestion_timestamp").notNull().defaultNow(),
  accessScope: varchar("access_scope", { length: 100 }),
}, (t) => ({
  caseIdx: index("ss_case_idx").on(t.validationCaseId),
}));

// §16.3 Table 4: evidence_events (append-only)
export const evidenceEvents = pgTable("evidence_events", {
  id: varchar("id", { length: 50 }).primaryKey(),
  institutionId: varchar("institution_id", { length: 50 }).notNull(),
  validationCaseId: varchar("validation_case_id", { length: 50 }).references(() => validationCases.id),
  eventType: eventTypeEnum("event_type").notNull(),
  actorSource: varchar("actor_source", { length: 100 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  signatureState: varchar("signature_state", { length: 20 }).default("UNVERIFIED"),
  priorEventHash: varchar("prior_event_hash", { length: 255 }),
  details: jsonb("details"),
}, (t) => ({
  caseIdx: index("ee_case_idx").on(t.validationCaseId),
  typeIdx: index("ee_type_idx").on(t.eventType),
  instIdx: index("ee_inst_idx").on(t.institutionId),
}));

// §16.3 Table 5: exceptions
export const exceptions = pgTable("exceptions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  validationCaseId: varchar("validation_case_id", { length: 50 }).notNull().references(() => validationCases.id),
  code: varchar("code", { length: 50 }).notNull(),
  severity: severityEnum("severity").notNull(),
  owner: varchar("owner", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("OPEN"),
  requiredEvidence: jsonb("required_evidence"),
  reasonCode: varchar("reason_code", { length: 50 }),
  recommendedAction: text("recommended_action"),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (t) => ({
  caseIdx: index("ex_case_idx").on(t.validationCaseId),
  statusIdx: index("ex_status_idx").on(t.status),
  severityIdx: index("ex_severity_idx").on(t.severity),
}));

// §16.3 Table 6: policy_versions
export const policyVersions = pgTable("policy_versions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  contentDigest: varchar("content_digest", { length: 255 }).notNull(),
  approvalRecord: jsonb("approval_record"),
  status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
}, (t) => ({
  statusIdx: index("pv_status_idx").on(t.status),
}));

// §16.3 Table 7: policy_decisions
export const policyDecisions = pgTable("policy_decisions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  validationCaseId: varchar("validation_case_id", { length: 50 }).notNull().references(() => validationCases.id),
  policyVersionId: varchar("policy_version_id", { length: 50 }).references(() => policyVersions.id),
  decision: varchar("decision", { length: 20 }).notNull(),
  inputSnapshotId: varchar("input_snapshot_id", { length: 50 }),
  reasonCodes: jsonb("reason_codes"),
  output: jsonb("output"),
  actor: varchar("actor", { length: 100 }).notNull(),
  evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
}, (t) => ({
  caseIdx: index("pd_case_idx").on(t.validationCaseId),
}));

// §16.3 Table 8: reconciliation_cases
export const reconciliationCases = pgTable("reconciliation_cases", {
  id: varchar("id", { length: 50 }).primaryKey(),
  validationCaseId: varchar("validation_case_id", { length: 50 }).references(() => validationCases.id),
  sources: jsonb("sources").notNull(),
  expectedValue: text("expected_value").notNull(),
  actualValue: text("actual_value").notNull(),
  discrepancyClass: varchar("discrepancy_class", { length: 50 }).notNull(),
  tolerancePolicy: varchar("tolerance_policy", { length: 50 }),
  resolution: text("resolution"),
  status: varchar("status", { length: 20 }).notNull().default("OPEN"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
}, (t) => ({
  caseIdx: index("rc_case_idx").on(t.validationCaseId),
  statusIdx: index("rc_status_idx").on(t.status),
}));

// §16.3 Table 9: idempotency_records
export const idempotencyRecords = pgTable("idempotency_records", {
  id: varchar("id", { length: 50 }).primaryKey(),
  institutionId: varchar("institution_id", { length: 50 }).notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
  requestDigest: varchar("request_digest", { length: 255 }).notNull(),
  outcome: jsonb("outcome"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  keyIdx: index("ir_key_idx").on(t.idempotencyKey),
  instIdx: index("ir_inst_idx").on(t.institutionId),
}));

// §16.3 Table 10: outbox_events
export const outboxEvents = pgTable("outbox_events", {
  id: varchar("id", { length: 50 }).primaryKey(),
  aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
  aggregateId: varchar("aggregate_id", { length: 50 }).notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
}, (t) => ({
  statusIdx: index("ob_status_idx").on(t.status),
  createdIdx: index("ob_created_idx").on(t.createdAt),
}));

// §16.3 Table 11: access_audit_events
export const accessAuditEvents = pgTable("access_audit_events", {
  id: varchar("id", { length: 50 }).primaryKey(),
  institutionId: varchar("institution_id", { length: 50 }).notNull(),
  actor: varchar("actor", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  resource: varchar("resource", { length: 255 }),
  result: varchar("result", { length: 20 }).notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (t) => ({
  instIdx: index("aa_inst_idx").on(t.institutionId),
  actionIdx: index("aa_action_idx").on(t.action),
}));

// Relations
export const validationCasesRelations = relations(validationCases, ({ many }) => ({
  sourceSnapshots: many(sourceSnapshots),
  evidenceEvents: many(evidenceEvents),
  exceptions: many(exceptions),
  policyDecisions: many(policyDecisions),
  reconciliationCases: many(reconciliationCases),
}));

export const exceptionsRelations = relations(exceptions, ({ one }) => ({
  validationCase: one(validationCases, { fields: [exceptions.validationCaseId], references: [validationCases.id] }),
}));

export type Institution = typeof institutions.$inferSelect;
export type ValidationCase = typeof validationCases.$inferSelect;
export type EvidenceEvent = typeof evidenceEvents.$inferSelect;
export type Exception = typeof exceptions.$inferSelect;
