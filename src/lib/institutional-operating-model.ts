// src/lib/institutional-operating-model.ts
//
// MITHQAL v25.3.2 — CANONICAL INSTITUTIONAL OPERATING MODEL (single source of truth)
// Per M-directive (trace 1a0ee14af343a085):
//   "Refactor the institutional operating model.
//    Banks must see exactly ONE external contractual counterparty for MITHQAL services.
//    Create a canonical field: bankFacingCounterpartyEntityId
//    Define: contracting authority, SLA owner, support owner, operational liability,
//    data-processing responsibility, security responsibility, billing authority,
//    escalation path.
//    Preserve internal separation between Holding, Operating, Technology and
//    independent oversight where legally appropriate.
//    Do not invent legal facts. Where underlying executed instruments are not
//    available for verification, mark the status PENDING_LEGAL_VERIFICATION."
//
// This is the SINGLE CANONICAL SOURCE for the bank-facing institutional operating
// model. All other modules MUST import from here. Any inline institutional
// counterparty definition elsewhere is a CONTRADICTION per the contradiction scanner.
//
// Cross-references (per v25.3.2 authority hierarchy):
//   - Economic definition:    src/lib/mtq-economic-definition.ts         (v25.3.5 / Agent K2)
//   - Institutional operator: JOZOUR Amendment §1.6                     (two-entity architecture)
//   - Capability boundary:    src/lib/control-plane-boundary.ts        (v25.3.4 / Agent J3)
//   - Reserve domains:        src/lib/reserve-domains.ts                (v25.3.6 / Agent K4)
//   - Pilot 1 config:         src/lib/pilot-1-config.ts                (v25.3.6 / Agent K5)
//   - Commercial governance:  src/lib/commercial-governance.ts         (4 PLANNED entities, preserved)

// === Status Markers ===
// Per M-directive: "Do not invent legal facts. Where underlying executed instruments
// are not available for verification, mark the status PENDING_LEGAL_VERIFICATION."

export type VerificationStatus =
  | "ACTIVE"                          // verified + operational
  | "PENDING_LEGAL_VERIFICATION"      // proposed but underlying executed instruments NOT available for verification
  | "SUPERSEDED"                      // previously ACTIVE, replaced
  | "HISTORICAL"                       // historical material, retained for traceability
  | "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION";  // capability preserved for future (per L-directive)

// === Bank-Facing Counterparty (the SINGLE external entity banks see) ===
//
// Per M-directive: "Banks must see exactly ONE external contractual counterparty
// for MITHQAL services."
//
// This is the canonical field. All bank-facing contracts, SLAs, support tickets,
// billing, escalations, and operational liabilities resolve to this ONE entity.
//
// Internally, MITHQAL may have multiple entities (Foundation, Holding, Operating,
// Technology, Oversight) — but banks see ONLY the bankFacingCounterpartyEntity.

export interface BankFacingCounterpartyEntity {
  // The canonical identifier — banks reference this in all contracts
  bankFacingCounterpartyEntityId: string;

  // The legal name of the bank-facing entity
  legalName: string;

  // The 8 canonical fields per M-directive
  contractingAuthority: ResponsibilityField;
  slaOwner: ResponsibilityField;
  supportOwner: ResponsibilityField;
  operationalLiability: ResponsibilityField;
  dataProcessingResponsibility: ResponsibilityField;
  securityResponsibility: ResponsibilityField;
  billingAuthority: ResponsibilityField;
  escalationPath: ResponsibilityField;

  // Verification status (per M-directive: "Do not invent legal facts")
  verificationStatus: VerificationStatus;

  // The underlying legal entity (internal — banks don't see this directly)
  underlyingLegalEntity: string;

  // Internal separation (preserved per M-directive)
  internalSeparation: {
    holding: InternalEntityRef;
    operating: InternalEntityRef;
    technology: InternalEntityRef;
    independentOversight: InternalEntityRef;
  };

  // Source layers (per v25.3.2 authority hierarchy)
  sourceLayers: {
    economicDefinition: string;      // v25.3.5 (K2)
    institutionalOperator: string;    // JOZOUR Amendment §1.6
    capabilityBoundary: string;       // v25.3.4 (J3)
    reserveDomains: string;           // v25.3.6 (K4)
  };
}

export interface ResponsibilityField {
  // Who is responsible (the internal entity)
  responsibleEntity: string;
  // The legal name banks see (resolves to bankFacingCounterpartyEntityId)
  bankFacingName: string;
  // Verification status (per M-directive)
  verificationStatus: VerificationStatus;
  // The underlying executed instrument (if available) — NULL = PENDING_LEGAL_VERIFICATION
  underlyingInstrument?: {
    type: string;        // "OPERATING_AGREEMENT" | "RESOLUTION" | "SERVICE_LEVEL_AGREEMENT" | "DATA_PROCESSING_AGREEMENT" | "BILLING_AGREEMENT" | "ESCROW_AGREEMENT" | "OVERSIGHT_CHARTER"
    reference: string;   // document ID, contract number, etc.
    executedDate: string; // ISO 8601
    verifiedBy: string;   // who verified (e.g., "Jozour LLC Manager", "Independent Auditor")
  };
  // Honesty note (when verificationStatus is PENDING_LEGAL_VERIFICATION)
  honestyNote?: string;
}

export interface InternalEntityRef {
  entityId: string;
  legalName: string;
  role: "HOLDING" | "OPERATING" | "TECHNOLOGY" | "INDEPENDENT_OVERSIGHT";
  verificationStatus: VerificationStatus;
  preserved: boolean;  // internal separation preserved per M-directive
  notes?: string;
}

// === THE CANONICAL BANK-FACING COUNTERPARTY ===
//
// Per JOZOUR Amendment (July 31, 2026):
// - Jozour, LLC (NJ, EIN 84-3470275) is the current operating entity
// - Foundation is TO-BE-FORMED (per §1.6)
// - Holding, Technology, Markets entities are PLANNED but NOT yet formed
//
// Per M-directive: "Do not invent legal facts. Where underlying executed instruments
// are not available for verification, mark the status PENDING_LEGAL_VERIFICATION."
//
// Therefore:
// - bankFacingCounterpartyEntityId = "JOZOUR_LLC_NJ" (the current operating entity)
// - All 8 responsibility fields resolve to JOZOUR_LLC_NJ bank-facing
// - Internally, the Holding/Technology/Oversight entities are SEPARATE (preserved) but
//   currently point to JOZOUR_LLC_NJ as the sole operating entity (PENDING_LEGAL_VERIFICATION
//   for the future Holding/Technology/Oversight entities)
// - Verification status is PENDING_LEGAL_VERIFICATION for any field where the underlying
//   executed instrument is NOT yet available (e.g., SLA, DPA, Billing Agreement, Escalation Charter)

export const BANK_FACING_COUNTERPARTY_ENTITY: BankFacingCounterpartyEntity = {
  bankFacingCounterpartyEntityId: "JOZOUR_LLC_NJ",

  legalName: "Jozour, LLC (New Jersey)",

  // === The 8 canonical fields per M-directive ===

  contractingAuthority: {
    responsibleEntity: "Jozour, LLC (Manager: Mohamed Salah Eltonsy)",
    bankFacingName: "Jozour, LLC",
    verificationStatus: "ACTIVE",  // verified via JOZOUR Amendment + Resolution (July 31, 2026)
    underlyingInstrument: {
      type: "OPERATING_AGREEMENT",
      reference: "Jozour LLC Operating Agreement Amendment No. 1 (July 31, 2026)",
      executedDate: "2026-07-31",
      verifiedBy: "Mohamed Salah Eltonsy, Manager, Jozour, LLC",
    },
  },

  slaOwner: {
    responsibleEntity: "Jozour, LLC (Operating)",
    bankFacingName: "Jozour, LLC",
    verificationStatus: "PENDING_LEGAL_VERIFICATION",  // SLA template not yet executed with a bank
    honestyNote:
      "Per M-directive: 'Do not invent legal facts.' The SLA template exists but has NOT yet been " +
      "executed with any bank. The SLA owner resolves to Jozour, LLC bank-facing, but the underlying " +
      "executed SLA instrument is NOT yet available for verification. Status = PENDING_LEGAL_VERIFICATION.",
  },

  supportOwner: {
    responsibleEntity: "Jozour, LLC (Operating)",
    bankFacingName: "Jozour, LLC",
    verificationStatus: "PENDING_LEGAL_VERIFICATION",  // support process not yet operational with a bank
    honestyNote:
      "Support process (ticket routing, escalation procedures, response-time SLOs) is designed but " +
      "NOT yet operationalized with any bank. Status = PENDING_LEGAL_VERIFICATION until first bank " +
      "engagement executes the support agreement.",
  },

  operationalLiability: {
    responsibleEntity: "Jozour, LLC (Operating)",
    bankFacingName: "Jozour, LLC",
    verificationStatus: "ACTIVE",  // Jozour LLC is the operating entity per JOZOUR Amendment
    underlyingInstrument: {
      type: "OPERATING_AGREEMENT",
      reference: "Jozour LLC Operating Agreement Amendment No. 1 (July 31, 2026) §1.2",
      executedDate: "2026-07-31",
      verifiedBy: "Mohamed Salah Eltonsy, Manager, Jozour, LLC",
    },
  },

  dataProcessingResponsibility: {
    responsibleEntity: "Jozour, LLC (Operating)",
    bankFacingName: "Jozour, LLC",
    verificationStatus: "PENDING_LEGAL_VERIFICATION",  // DPA not yet executed
    honestyNote:
      "Data Processing Agreement (DPA) template exists but has NOT yet been executed with any bank. " +
      "Per M-directive: 'Do not invent legal facts.' Status = PENDING_LEGAL_VERIFICATION until a DPA " +
      "is executed with the first bank. GDPR/CCPA compliance framework is designed but not yet " +
      "operationalized.",
  },

  securityResponsibility: {
    responsibleEntity: "Jozour, LLC (Operating)",
    bankFacingName: "Jozour, LLC",
    verificationStatus: "PENDING_LEGAL_VERIFICATION",  // Security accreditation not yet obtained
    honestyNote:
      "Security responsibility (SOC 2 Type II, ISO 27001, penetration testing) is designed but NOT " +
      "yet accredited. Per M-directive: 'Do not invent legal facts.' Status = PENDING_LEGAL_VERIFICATION " +
      "until security accreditation is obtained from an independent auditor.",
  },

  billingAuthority: {
    responsibleEntity: "Jozour, LLC (Operating)",
    bankFacingName: "Jozour, LLC",
    verificationStatus: "PENDING_LEGAL_VERIFICATION",  // Billing agreement not yet executed
    honestyNote:
      "Billing authority (fee schedule, invoicing process, payment terms) is designed but NOT yet " +
      "operationalized with any bank. Status = PENDING_LEGAL_VERIFICATION until first bank engagement " +
      "executes the billing agreement.",
  },

  escalationPath: {
    responsibleEntity: "Jozour, LLC (Manager: Mohamed Salah Eltonsy)",
    bankFacingName: "Jozour, LLC",
    verificationStatus: "ACTIVE",  // Escalation path is defined in JOZOUR Amendment §1.2(h)
    underlyingInstrument: {
      type: "OPERATING_AGREEMENT",
      reference: "Jozour LLC Operating Agreement Amendment No. 1 (July 31, 2026) §1.2(h) + §1.5",
      executedDate: "2026-07-31",
      verifiedBy: "Mohamed Salah Eltonsy, Manager, Jozour, LLC",
    },
  },

  // Verification status (overall — the entity itself is ACTIVE via JOZOUR Amendment)
  verificationStatus: "ACTIVE",

  // The underlying legal entity (internal — banks see this through the bankFacingCounterpartyEntityId)
  underlyingLegalEntity: "Jozour, LLC (NJ, EIN 84-3470275, formed Oct 24, 2019)",

  // === Internal separation (PRESERVED per M-directive) ===
  // "Preserve internal separation between Holding, Operating, Technology and
  //  independent oversight where legally appropriate."
  //
  // Currently, all 4 internal entities resolve to Jozour, LLC (since the Holding,
  // Technology, and Foundation entities are NOT yet formed). When they ARE formed,
  // these refs will point to them. Internal separation is PRESERVED in the data
  // structure even though the entities don't yet exist.
  internalSeparation: {
    holding: {
      entityId: "MITHQAL_HOLDING_COMPANY_PLANNED",
      legalName: "MITHQAL Holding Company (PLANNED — not yet formed)",
      role: "HOLDING",
      verificationStatus: "PENDING_LEGAL_VERIFICATION",  // Holding Company not yet formed
      preserved: true,  // internal separation PRESERVED per M-directive
      notes:
        "Holding Company is PLANNED per v25.3 master blueprint. NOT yet formed. " +
        "Currently, holding-company functions are performed by Jozour, LLC (the operating entity). " +
        "Internal separation PRESERVED in the data structure — when Holding Company is formed, " +
        "this ref will point to it.",
    },
    operating: {
      entityId: "JOZOUR_LLC_NJ",
      legalName: "Jozour, LLC (NJ, EIN 84-3470275)",
      role: "OPERATING",
      verificationStatus: "ACTIVE",  // Jozour LLC is the current operating entity
      preserved: true,
      notes:
        "Jozour, LLC is the current operating entity per JOZOUR Amendment (July 31, 2026). " +
        "Operates the MITHQAL project as a project of the Company pending Foundation formation.",
    },
    technology: {
      entityId: "MITHQAL_TECHNOLOGY_ENTITY_PLANNED",
      legalName: "MITHQAL Technology Entity (PLANNED — not yet formed)",
      role: "TECHNOLOGY",
      verificationStatus: "PENDING_LEGAL_VERIFICATION",  // Technology entity not yet formed
      preserved: true,
      notes:
        "Technology entity is PLANNED. NOT yet formed. Currently, technology functions are performed " +
        "by Jozour, LLC (the operating entity). Internal separation PRESERVED — when Technology " +
        "entity is formed, this ref will point to it.",
    },
    independentOversight: {
      entityId: "MITHQAL_FOUNDATION_PLANNED",
      legalName: "MITHQAL Foundation Inc. (PLANNED — to be formed per JOZOUR Amendment §1.6)",
      role: "INDEPENDENT_OVERSIGHT",
      verificationStatus: "PENDING_LEGAL_VERIFICATION",  // Foundation not yet formed (501(c)(3) not yet recognized)
      preserved: true,
      notes:
        "Foundation is TO-BE-FORMED per JOZOUR Amendment §1.6. NOT yet formed. " +
        "Independent oversight functions are designed but not yet operational. " +
        "Internal separation PRESERVED — when Foundation is formed (501(c)(3) recognized), " +
        "this ref will point to it and the operating entity will transfer project assets " +
        "per JOZOUR Amendment §1.4(b).",
    },
  },

  // Source layers (per v25.3.2 authority hierarchy)
  sourceLayers: {
    economicDefinition: "v25.3.5 (src/lib/mtq-economic-definition.ts)",
    institutionalOperator: "JOZOUR Amendment §1.6 (two-entity architecture)",
    capabilityBoundary: "v25.3.4 (CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE)",
    reserveDomains: "v25.3.6 (Settlement Liquidity vs Strategic Resilience Reserve)",
  },
};

// === API ===

export function getBankFacingCounterpartyEntity(): BankFacingCounterpartyEntity {
  return BANK_FACING_COUNTERPARTY_ENTITY;
}

export function getBankFacingCounterpartyEntityId(): string {
  return BANK_FACING_COUNTERPARTY_ENTITY.bankFacingCounterpartyEntityId;
}

// Returns the 8 canonical fields as an array (for UI display)
export function getCanonicalFields(): { fieldName: string; field: ResponsibilityField }[] {
  return [
    { fieldName: "contractingAuthority", field: BANK_FACING_COUNTERPARTY_ENTITY.contractingAuthority },
    { fieldName: "slaOwner", field: BANK_FACING_COUNTERPARTY_ENTITY.slaOwner },
    { fieldName: "supportOwner", field: BANK_FACING_COUNTERPARTY_ENTITY.supportOwner },
    { fieldName: "operationalLiability", field: BANK_FACING_COUNTERPARTY_ENTITY.operationalLiability },
    { fieldName: "dataProcessingResponsibility", field: BANK_FACING_COUNTERPARTY_ENTITY.dataProcessingResponsibility },
    { fieldName: "securityResponsibility", field: BANK_FACING_COUNTERPARTY_ENTITY.securityResponsibility },
    { fieldName: "billingAuthority", field: BANK_FACING_COUNTERPARTY_ENTITY.billingAuthority },
    { fieldName: "escalationPath", field: BANK_FACING_COUNTERPARTY_ENTITY.escalationPath },
  ];
}

// Returns the internal separation (Holding / Operating / Technology / Oversight)
export function getInternalSeparation() {
  return BANK_FACING_COUNTERPARTY_ENTITY.internalSeparation;
}

// === Status ===
export const INSTITUTIONAL_OPERATING_MODEL_STATUS: VerificationStatus = "ACTIVE";
export const INSTITUTIONAL_OPERATING_MODEL_VERSION = "v25.3.2-M1-1.0";
export const INSTITUTIONAL_OPERATING_MODEL_SOURCE = "src/lib/institutional-operating-model.ts";
