/**
 * MITHQAL — Drizzle ORM schema (MITHQAL-TECH-SPEC-001 §4.1)
 *
 * System of record for the MITHQAL control plane. All monetary state
 * writes flow through this schema. The v26.0 lib modules (mtq-gate,
 * eligible-backing, finality-state-machine, reconciliation-tolerance,
 * external-claim-register, db-authoritative, pilot-a-scenarios,
 * prisma-canonical, gate-definitions) remain the authoritative policy
 * engine; this schema is the durable persistence layer beneath them.
 *
 * Truth state: DESIGN-STAGE. Schema is defined; migrations are NOT
 * applied against production (productionAuthorized = false). All
 * inserts are MTQ-disabled (mtq-gate returns mtqDisabled=true).
 */

import { relations } from "drizzle-orm";
import {
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// ──────────────────────────────────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────────────────────────────────

/**
 * Instruction lifecycle status — mirrors the §4.4 finality state machine
 * F0..F7 plus the policy/route/exception branches.
 */
export const statusEnum = pgEnum("mtq_status", [
  "RECEIVED", // F0 — instruction accepted, awaiting validation
  "VALIDATED", // F0' — schema + institution validation passed
  "POLICY_APPROVED", // F0'' — policy gate cleared (MTQ-disabled in pilot)
  "POLICY_BLOCKED", // policy gate held; routed to exceptions
  "ROUTE_SELECTED", // route chosen (RTGS / SWIFT / ISO 20022 / CBDC)
  "FINALITY_F0", // accepted
  "FINALITY_F1", // bank funding final
  "FINALITY_F2", // FX leg final
  "FINALITY_F3", // rail debited
  "FINALITY_F4", // rail credited
  "FINALITY_F5", // creditor bank confirmed
  "FINALITY_F6", // external rail final (sovereign money moved)
  "FINALITY_F7", // settlement closed
  "SETTLED", // terminal success
  "EXCEPTION", // requires operator intervention
  "SAFE_HALTED", // emergency halt — manual review required
]);

/**
 * Exception severity, per §4.4 reconciliation tolerance matrix.
 */
export const severityEnum = pgEnum("mtq_severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

/**
 * Outbox delivery status (transactional outbox pattern, §4.2.1).
 */
export const outboxStatusEnum = pgEnum("mtq_outbox_status", [
  "PENDING",
  "DELIVERED",
  "FAILED",
  "DEAD_LETTERED",
]);

/**
 * Reconciliation case status — operator-resolvable cases.
 */
export const reconciliationStatusEnum = pgEnum("mtq_recon_status", [
  "OPEN",
  "INVESTIGATING",
  "TOLERATED",
  "RESOLVED",
  "ESCALATED",
]);

/**
 * Discrepancy classification (§reconciliation-tolerance).
 */
export const discrepancyClassEnum = pgEnum("mtq_discrepancy_class", [
  "NONE",
  "TIMING",
  "AMOUNT",
  "CURRENCY",
  "COUNTERPARTY",
  "RAIL",
  "POLICY",
  "UNKNOWN",
]);

// ──────────────────────────────────────────────────────────────────────────
// Institutions
// ──────────────────────────────────────────────────────────────────────────

export const institutions = pgTable(
  "institutions",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    legalName: varchar("legal_name", { length: 255 }).notNull(),
    jurisdiction: varchar("jurisdiction", { length: 10 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    participantType: varchar("participant_type", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("institutions_jurisdiction_idx").on(table.jurisdiction),
    index("institutions_status_idx").on(table.status),
  ],
);

// ──────────────────────────────────────────────────────────────────────────
// Instructions
// ──────────────────────────────────────────────────────────────────────────

export const instructions = pgTable(
  "instructions",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    institutionId: varchar("institution_id", { length: 50 })
      .notNull()
      .references(() => institutions.id),
    corridor: varchar("corridor", { length: 50 }).notNull(),
    sourceCurrency: varchar("source_currency", { length: 3 }).notNull(),
    targetCurrency: varchar("target_currency", { length: 3 }).notNull(),
    amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
    debtorName: varchar("debtor_name", { length: 255 }).notNull(),
    creditorName: varchar("creditor_name", { length: 255 }).notNull(),
    purpose: varchar("purpose", { length: 50 }).notNull(),
    status: statusEnum("status").notNull().default("RECEIVED"),
    policyVersion: varchar("policy_version", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("instructions_institution_idx").on(table.institutionId),
    index("instructions_corridor_idx").on(table.corridor),
    index("instructions_status_idx").on(table.status),
    index("instructions_created_at_idx").on(table.createdAt),
  ],
);

// ──────────────────────────────────────────────────────────────────────────
// Evidence — every state transition carries an evidence hash
// ──────────────────────────────────────────────────────────────────────────

export const evidence = pgTable(
  "evidence",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    instructionId: varchar("instruction_id", { length: 50 })
      .notNull()
      .references(() => instructions.id),
    type: varchar("type", { length: 50 }).notNull(),
    source: varchar("source", { length: 100 }).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull().defaultNow(),
    hash: varchar("hash", { length: 255 }).notNull(),
    scope: varchar("scope", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
  },
  (table) => [
    index("evidence_instruction_idx").on(table.instructionId),
    index("evidence_type_idx").on(table.type),
    index("evidence_hash_idx").on(table.hash),
  ],
);

// ──────────────────────────────────────────────────────────────────────────
// Exceptions
// ──────────────────────────────────────────────────────────────────────────

export const exceptions = pgTable(
  "exceptions",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    instructionId: varchar("instruction_id", { length: 50 })
      .notNull()
      .references(() => instructions.id),
    code: varchar("code", { length: 50 }).notNull(),
    severity: severityEnum("severity").notNull(),
    owner: varchar("owner", { length: 100 }),
    requiredEvidence: jsonb("required_evidence").$type<string[]>(),
    clock: timestamp("clock", { withTimezone: true }),
    status: varchar("status", { length: 20 }).notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("exceptions_instruction_idx").on(table.instructionId),
    index("exceptions_status_idx").on(table.status),
    index("exceptions_severity_idx").on(table.severity),
  ],
);

// ──────────────────────────────────────────────────────────────────────────
// Policy decisions
// ──────────────────────────────────────────────────────────────────────────

export const policyDecisions = pgTable(
  "policy_decisions",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    instructionId: varchar("instruction_id", { length: 50 })
      .notNull()
      .references(() => instructions.id),
    policyVersion: varchar("policy_version", { length: 20 }).notNull(),
    decision: varchar("decision", { length: 20 }).notNull(),
    reasonCodes: jsonb("reason_codes").$type<string[]>(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull().defaultNow(),
    actor: varchar("actor", { length: 100 }).notNull(),
  },
  (table) => [index("policy_decisions_instruction_idx").on(table.instructionId)],
);

// ──────────────────────────────────────────────────────────────────────────
// Outbox — transactional outbox pattern (§4.2.1)
// ──────────────────────────────────────────────────────────────────────────

export const outbox = pgTable(
  "outbox",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
    aggregateId: varchar("aggregate_id", { length: 50 }).notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    payload: jsonb("payload").notNull(),
    status: outboxStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    retryCount: integer("retry_count").notNull().default(0),
  },
  (table) => [
    index("outbox_status_idx").on(table.status),
    index("outbox_created_at_idx").on(table.createdAt),
    index("outbox_aggregate_idx").on(table.aggregateType, table.aggregateId),
  ],
);

// ──────────────────────────────────────────────────────────────────────────
// Reconciliation cases
// ──────────────────────────────────────────────────────────────────────────

export const reconciliationCases = pgTable(
  "reconciliation_cases",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    sourceSet: varchar("source_set", { length: 100 }).notNull(),
    cutoff: timestamp("cutoff", { withTimezone: true }).notNull(),
    expected: jsonb("expected").notNull(),
    actual: jsonb("actual"),
    discrepancyClass: discrepancyClassEnum("discrepancy_class").notNull().default("NONE"),
    tolerancePolicyVersion: varchar("tolerance_policy_version", { length: 20 }).notNull(),
    severity: severityEnum("severity").notNull().default("LOW"),
    owner: varchar("owner", { length: 100 }),
    status: reconciliationStatusEnum("status").notNull().default("OPEN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("recon_status_idx").on(table.status),
    index("recon_severity_idx").on(table.severity),
    index("recon_source_set_idx").on(table.sourceSet),
  ],
);

// ──────────────────────────────────────────────────────────────────────────
// Relations — enables Drizzle's `db.query.instructions.findFirst({ with: ... })`
// ──────────────────────────────────────────────────────────────────────────

export const institutionsRelations = relations(institutions, ({ many }) => ({
  instructions: many(instructions),
}));

export const instructionsRelations = relations(instructions, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [instructions.institutionId],
    references: [institutions.id],
  }),
  evidence: many(evidence),
  exceptions: many(exceptions),
  policyDecisions: many(policyDecisions),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  instruction: one(instructions, {
    fields: [evidence.instructionId],
    references: [instructions.id],
  }),
}));

export const exceptionsRelations = relations(exceptions, ({ one }) => ({
  instruction: one(instructions, {
    fields: [exceptions.instructionId],
    references: [instructions.id],
  }),
}));

export const policyDecisionsRelations = relations(policyDecisions, ({ one }) => ({
  instruction: one(instructions, {
    fields: [policyDecisions.instructionId],
    references: [instructions.id],
  }),
}));

// ──────────────────────────────────────────────────────────────────────────
// Type exports — used by API routes and TanStack Query hooks
// ──────────────────────────────────────────────────────────────────────────

export type Institution = typeof institutions.$inferSelect;
export type Instruction = typeof instructions.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
export type Exception = typeof exceptions.$inferSelect;
export type PolicyDecision = typeof policyDecisions.$inferSelect;
export type OutboxEvent = typeof outbox.$inferSelect;
export type ReconciliationCase = typeof reconciliationCases.$inferSelect;
