// v25.0 BRICS / U.S. / Jurisdictional Neutrality Amendment
// =================================================================
// This amendment is INSERTED into the existing v25.0 architecture.
// It does NOT replace the earlier v25.0 architecture — it supplements it.
// Where these provisions conflict with older BRICS/CBDC/interoperability
// language, these provisions are NORMATIVE.
//
// 26 sections covering:
//   §1  Institutional Identity / Neutrality
//   §2  MTQ Definition (neutral cross-jurisdictional)
//   §3  BRICS Integration Principle
//   §4  BRICS Settlement Interoperability Adapter (BSIA)
//   §5  Global Monetary Interoperability Model
//   §6  Jurisdictional Settlement Gateway (JSG)
//   §7  U.S. Jurisdiction Gateway Principle
//   §8  U.S. / BRICS Compatibility
//   §9  Sanctions / Geopolitical Neutrality
//   §10 Corridor Authorization Policy
//   §11 BRICS Unit (conditional existence)
//   §12 MTQ Independence from BRICS
//   §13 Multi-Currency Settlement Model
//   §14 MTQ vs BRICS Currency Distinction
//   §15 Central-Bank Interoperability
//   §16 Economic / Geopolitical Neutrality (marketing)
//   §17 Privacy in Cross-Jurisdictional Settlement
//   §18 Privacy + U.S. / BRICS
//   §19 Policy Engine (COUNTRY_GATEWAY_POLICY)
//   §20 Technical Architecture (JSG model)
//   §21 BRICS Adapter Security
//   §22 U.S. Emergency Isolation
//   §23 Economic Resilience
//   §24 BRICS Pilot Strategy (5 phases)
//   §25 Final BRICS / U.S. Canonical Statement
//   §26 Final Design Decision
// =================================================================

// ---- §1 Institutional Identity / Neutrality ----
export const INSTITUTIONAL_NEUTRALITY = {
  canonical: "MITHQAL shall remain politically, monetarily and jurisdictionally neutral.",
  isNot: [
    "a BRICS monetary instrument",
    "a Western monetary instrument",
    "an anti-dollar mechanism",
    "a sanctions-evasion mechanism",
    "a geopolitical settlement bloc",
  ],
  mtqRole: "MTQ shall function as a neutral wholesale settlement instrument between authorized monetary systems.",
  sovereignPreservation: "MITHQAL shall not require participating jurisdictions to abandon, replace, subordinate or adopt another jurisdiction's sovereign currency, central-bank money, CBDC or monetary policy.",
  sovereignAuthority: "Sovereign currencies and CBDCs remain under the authority of their respective issuing jurisdictions.",
  mithqalRole: "MITHQAL's role is interoperability and settlement, not monetary substitution.",
} as const;

// ---- §2 MTQ Definition (Neutral Cross-Jurisdictional) ----
export const MTQ_NEUTRAL_DEFINITION = {
  canonical: "MTQ is a permissioned wholesale settlement instrument capable of settling value between authorized regulated financial institutions and, where explicitly authorized, central banks or sovereign monetary authorities.",
  isNot: [
    "a BRICS currency",
    "a U.S. currency",
    "a replacement reserve currency",
    "a CBDC",
    "a sovereign liability",
    "a geopolitical settlement instrument",
    "a mechanism for bypassing sanctions or capital controls",
  ],
  principle: "MTQ sits between monetary systems, not instead of monetary systems.",
} as const;

// ---- §3 BRICS Integration Principle ----
export const BRICS_INTEGRATION_PRINCIPLE = {
  rule1: "MITHQAL shall not seek to replace or compete with any formally established BRICS monetary or settlement instrument.",
  rule2: "If a competent BRICS authority formally establishes a BRICS unit of account, settlement instrument, CBDC interoperability standard, or other official monetary/financial instrument, MITHQAL may support that instrument through a jurisdictionally controlled interoperability adapter, subject to applicable law and institutional authorization.",
  rule3: "MITHQAL shall not assume that any privately proposed, unofficial or externally branded 'BRICS Unit' constitutes an official BRICS monetary instrument.",
  rule4: "Any future BRICS instrument shall be treated as an external authorized settlement asset/interface unless and until formally recognized by the competent institutions.",
  criticalRule: "MITHQAL shall integrate with BRICS where authorized; MITHQAL shall not become the BRICS monetary system.",
} as const;

// ---- §4 BRICS Settlement Interoperability Adapter (BSIA) ----
export interface BRICSAdapterConfig {
  adapterId: string;
  version: string;
  status: "ACTIVE" | "SUSPENDED" | "DISABLED" | "PENDING_AUTHORIZATION";
  authorizedBRICSInstruments: string[];  // only officially recognized
  jurisdictionControls: string[];
  policyVersion: string;
  transactionLimits: {
    maxPerTransaction: number;
    dailyLimit: number;
  };
  emergencyDisablement: boolean;
  auditTrail: boolean;
}

export const BSIA_PROPERTIES = {
  name: "BRICS Settlement Interoperability Adapter (BSIA)",
  purpose: "Provide a controlled interface between MITHQAL's neutral MTQ settlement core and officially authorized BRICS payment/settlement instruments.",
  flow: "BRICS Unit / Authorized BRICS Instrument ↔ MTQ ↔ Participating Bank / CBDC",
  must: [
    "modular",
    "optional",
    "jurisdiction-controlled",
    "policy-controlled",
    "auditable",
    "replaceable",
    "independent of MTQ's constitutional identity",
  ],
  architecturalRule: "The BRICS adapter is not part of MTQ's monetary identity. If BRICS changes its architecture, the adapter may be replaced without changing MTQ's constitutional identity.",
} as const;

// ---- §5 Global Monetary Interoperability Model ----
export const GLOBAL_INTEROP_MODEL = {
  name: "Neutral Multi-Jurisdictional Interoperability Model",
  architecture: `
                    MITHQAL
              NEUTRAL MTQ SETTLEMENT CORE
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
        U.S. JSG        BRICS JSG        Japan JSG
           │                │                │
           ▼                ▼                ▼
      U.S. Banks       BRICS Banks      Japanese Banks
           │                │                │
           ▼                ▼                ▼
     USD / CBDC       BRICS Assets*     JPY / CBDC

  * Only formally authorized instruments.`,
  canonicalRule: "MITHQAL Core is neutral. Access to MITHQAL Core is jurisdictionally controlled.",
} as const;

// ---- §6 Jurisdictional Settlement Gateway (JSG) ----
export interface JurisdictionalSettlementGateway {
  jsgId: string;                    // e.g., "US-JSG", "JP-JSG", "BRICS-JSG"
  jurisdiction: string;
  status: "ACTIVE" | "SUSPENDED" | "ISOLATED" | "PENDING";
  enforces: JSGEnforcement[];
}

export interface JSGEnforcement {
  rule: string;
  value: string;
  active: boolean;
}

export const JSG_ENFORCEMENT_RULES = [
  "permitted institutions",
  "permitted counterparties",
  "permitted currencies",
  "permitted CBDCs",
  "permitted settlement assets",
  "permitted BRICS instruments",
  "sanctions",
  "AML/CFT requirements",
  "transaction limits",
  "disclosure rules",
  "data residency",
  "privacy rules",
  "capital controls",
  "corridor restrictions",
  "licensing requirements",
  "central-bank authorization",
  "prohibited transaction classes",
] as const;

export const KNOWN_JSGS: JurisdictionalSettlementGateway[] = [
  { jsgId: "US-JSG", jurisdiction: "US", status: "ACTIVE", enforces: [] },
  { jsgId: "JP-JSG", jurisdiction: "JP", status: "ACTIVE", enforces: [] },
  { jsgId: "AE-JSG", jurisdiction: "AE", status: "ACTIVE", enforces: [] },
  { jsgId: "IN-JSG", jurisdiction: "IN", status: "ACTIVE", enforces: [] },
  { jsgId: "BR-JSG", jurisdiction: "BR", status: "ACTIVE", enforces: [] },
  { jsgId: "EU-JSG", jurisdiction: "EU", status: "ACTIVE", enforces: [] },
  { jsgId: "SG-JSG", jurisdiction: "SG", status: "ACTIVE", enforces: [] },
  { jsgId: "HK-JSG", jurisdiction: "HK", status: "ACTIVE", enforces: [] },
  { jsgId: "BRICS-JSG", jurisdiction: "BRICS", status: "PENDING", enforces: [] }, // pending formal BRICS authorization
];

// ---- §7 U.S. Jurisdiction Gateway Principle ----
export const US_GATEWAY_PRINCIPLE = {
  rule: "U.S. participation in MITHQAL shall be governed exclusively through the U.S. jurisdictional settlement gateway and applicable U.S. law.",
  permittedInteractions: [
    "authorized institutions",
    "permitted jurisdictions",
    "permitted settlement instruments",
    "permitted CBDCs",
    "permitted transaction categories",
    "permitted BRICS-related instruments, where applicable",
  ],
  noOverride: "No MITHQAL architecture, MTQ transaction, BRICS adapter or cross-border routing mechanism may override U.S. sanctions, AML/CFT requirements, banking law, payment regulation, capital controls or other applicable U.S. requirements.",
  mandatoryPrinciple: "Technical interoperability does not create legal authorization.",
} as const;

// ---- §8 U.S. / BRICS Compatibility ----
export const US_BRICS_COMPATIBILITY = {
  principle: "MITHQAL shall not assume that U.S. institutions may access all BRICS instruments, jurisdictions, banks or CBDCs.",
  conditions: [
    "the U.S. transaction is legally permitted",
    "the counterparty is authorized",
    "the relevant instrument is permitted",
    "sanctions requirements are satisfied",
    "applicable U.S. regulatory requirements are satisfied",
    "the relevant counterpart jurisdiction permits the transaction",
    "the MITHQAL policy engine returns ALLOWED",
  ],
  blockRule: "Where any requirement fails: SETTLEMENT = BLOCK. No technical path may circumvent the block.",
} as const;

// ---- §9 Sanctions / Geopolitical Neutrality ----
export const SANCTIONS_NEUTRALITY = {
  immutable: "MITHQAL neutrality shall never be interpreted as sanctions neutrality.",
  principle: "MITHQAL may be politically neutral, but it must remain legally compliant.",
  rules: [
    "neutrality does not override sanctions",
    "neutrality does not override AML/CFT",
    "neutrality does not override capital controls",
    "neutrality does not permit prohibited transactions",
    "neutrality does not permit circumvention through MTQ",
    "neutrality does not permit indirect routing around jurisdictional restrictions",
  ],
  canonicalStatement: "Neutral infrastructure is not law-free infrastructure.",
} as const;

// ---- §10 Corridor Authorization Policy ----
export type CorridorPolicyState = "ALLOWED" | "CONDITIONAL" | "RESTRICTED" | "PROHIBITED" | "UNKNOWN";

export const CORRIDOR_AUTHORIZATION = {
  rule: "UNKNOWN = BLOCK",
  principle: "A corridor is evaluated independently of the existence of a technical connection.",
  implication: "Technical connectivity ≠ legal permission",
} as const;

export function checkCorridorPolicy(
  originJurisdiction: string,
  destJurisdiction: string,
  originInstrument: string,
  destInstrument: string,
): CorridorPolicyState {
  // Simplified check — in production this would query the full policy engine
  const prohibited = ["CN"]; // China geo-fenced
  if (prohibited.includes(originJurisdiction) || prohibited.includes(destJurisdiction)) {
    return "PROHIBITED";
  }
  // Unknown jurisdictions → UNKNOWN → BLOCK
  const known = ["US", "EU", "AE", "SG", "JP", "GB", "HK", "IN", "BR"];
  if (!known.includes(originJurisdiction) || !known.includes(destJurisdiction)) {
    return "UNKNOWN";
  }
  return "ALLOWED";
}

// ---- §11 BRICS Unit (Conditional) ----
export const BRICS_UNIT_POLICY = {
  correctLanguage: "BRICS Unit, if and when formally established and authorized by competent BRICS institutions.",
  neverSay: "The BRICS Unit is an existing official currency.",
  ifExists: "BRICS Unit → BRICS Settlement Adapter → MTQ → Authorized Bank / CBDC / Local Currency",
  ifNotExists: "MITHQAL remains fully functional without it.",
  principle: "This is essential for technological and geopolitical independence.",
} as const;

// ---- §12 MTQ Independence from BRICS ----
export const MTQ_BRICS_INDEPENDENCE = {
  rule: "MTQ shall remain independently functional regardless of whether a BRICS unit, BRICS CBDC framework, BRICS payment system or BRICS monetary instrument exists.",
  asymmetry: {
    ifBRICSSucceeds: "MITHQAL can connect.",
    ifBRICSChanges: "MITHQAL adapts.",
    ifBRICSNeverCreated: "MITHQAL still works through national currencies, bank money and CBDCs.",
  },
  requirement: "This is a formal architectural requirement.",
} as const;

// ---- §13 Multi-Currency Settlement Model ----
export const MULTI_CURRENCY_SETTLEMENT = {
  flows: [
    "USD → MTQ → JPY",
    "INR → MTQ → AED",
    "BRL → MTQ → INR",
    "BRICS Unit* → MTQ → Local Currency / CBDC (*only if officially authorized)",
  ],
  principle: "MTQ provides settlement interoperability without requiring bilateral monetary unification.",
} as const;

// ---- §14 MTQ vs BRICS Currency Distinction ----
export const MTQ_VS_BRICS_DISTINCTION = {
  bricsCurrency: "A common currency attempts to establish a common monetary unit.",
  mtq: "MTQ does not seek to establish a common monetary policy, sovereign currency, central bank or political monetary bloc. MTQ instead provides a common neutral settlement layer through which otherwise separate monetary systems can exchange settlement value under their respective laws.",
  mustAppearIn: [
    "executive summary",
    "institutional architecture",
    "BRICS strategy",
    "central-bank section",
    "regulatory section",
    "investor/partner materials",
  ],
} as const;

// ---- §15 Central-Bank Interoperability ----
export const CB_INTEROP = {
  rule: "A central bank may participate in MITHQAL only through a formally authorized jurisdictional gateway. Direct central-bank participation is not assumed.",
  supports: [
    "bank-to-bank settlement",
    "bank-to-wholesale-CBDC settlement",
    "wholesale-CBDC-to-wholesale-CBDC settlement",
    "central-bank-connected settlement",
    "future officially authorized BRICS settlement instruments",
  ],
} as const;

// ---- §16 Economic / Geopolitical Neutrality (Marketing) ----
export const MARKETING_NEUTRALITY = {
  shallNotBeMarketedAs: [
    "de-dollarization infrastructure",
    "anti-Western infrastructure",
    "BRICS monetary infrastructure",
    "sanctions-evasion infrastructure",
    "an alternative geopolitical financial bloc",
  ],
  shallBeMarketedAs: "neutral cross-border settlement infrastructure capable of serving multiple monetary systems under their respective laws.",
  note: "This is a critical communications control.",
} as const;

// ---- §17 Privacy in Cross-Jurisdictional Settlement ----
export const CROSS_JURISDICTIONAL_PRIVACY = {
  rule: "MITHQAL shall not require universal disclosure of underlying customer identity merely because a cross-border settlement occurs.",
  customerIdentityLocation: "Customer identity shall remain primarily within the customer's regulated institution, subject to applicable law.",
  mithqalUses: [
    "minimum-necessary institutional data",
    "cryptographic attestations",
    "privacy-preserving credentials",
    "selective disclosure where technically and legally appropriate",
  ],
  authorizedAccess: "Authorized authorities shall retain access to information to the extent required by applicable law.",
} as const;

// ---- §18 Privacy + U.S. / BRICS ----
export const PRIVACY_US_BRICS = {
  rule: "A transaction involving a BRICS jurisdiction shall not cause MITHQAL to automatically expose underlying corporate or customer information to another jurisdiction.",
  governedBy: [
    "applicable law",
    "data-sharing agreements",
    "institutional authorization",
    "regulatory authority",
    "selective disclosure policy",
  ],
  principle: "Technical settlement connectivity shall not automatically imply unrestricted data connectivity.",
  importance: "This is important for U.S., EU, UAE, China, India and other data-sovereignty environments.",
} as const;

// ---- §19 Policy Engine (COUNTRY_GATEWAY_POLICY) ----
export interface CountryGatewayPolicyInput {
  originJurisdiction: string;
  destinationJurisdiction: string;
  originInstitution: string;
  destinationInstitution: string;
  originInstrument: string;
  destinationInstrument: string;
  settlementAsset: string;
  cbdc?: string;
  bricsInstrument?: string;
  customerPurposeClass: string;
  transactionType: string;
  sanctionsState: string;
  amlState: string;
  disclosureState: string;
  legalStatus: string;
  authorizationState: string;
}

export type CountryGatewayPolicyOutput = "ALLOWED" | "CONDITIONAL" | "RESTRICTED" | "PROHIBITED" | "UNKNOWN";

export function evaluateCountryGatewayPolicy(input: CountryGatewayPolicyInput): CountryGatewayPolicyOutput {
  // Sanctions check
  if (input.sanctionsState === "BLOCKED") return "PROHIBITED";
  // AML check
  if (input.amlState === "BLOCKED") return "PROHIBITED";
  // Geo-fence
  const prohibited = ["CN"];
  if (prohibited.includes(input.originJurisdiction) || prohibited.includes(input.destinationJurisdiction)) {
    return "PROHIBITED";
  }
  // Unknown jurisdiction
  const known = ["US", "EU", "AE", "SG", "JP", "GB", "HK", "IN", "BR"];
  if (!known.includes(input.originJurisdiction) || !known.includes(input.destinationJurisdiction)) {
    return "UNKNOWN"; // BLOCK
  }
  // BRICS instrument check
  if (input.bricsInstrument && input.authorizationState !== "AUTHORIZED") {
    return "PROHIBITED";
  }
  // Legal status
  if (input.legalStatus === "PROHIBITED") return "PROHIBITED";
  if (input.legalStatus === "UNKNOWN") return "UNKNOWN";
  // Default
  return "ALLOWED";
}

// ---- §20 Technical Architecture (JSG Model) ----
export const TECHNICAL_ARCHITECTURE_JSG = `
                    MITHQAL CORE
              ┌─────────────────────┐
              │ MTQ Settlement      │
              │ Issuance Engine     │
              │ Reserve Engine      │
              │ Finality            │
              │ Audit               │
              │ Privacy             │
              └─────────┬───────────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
      U.S. JSG       BRICS JSG       OTHER JSG
        │               │                │
        ▼               ▼                ▼
      Banks        BRICS Banks       Banks/CBDCs
        │               │                │
      USD/CBDC    BRICS Instruments   Local/CBDC

No jurisdiction connects directly to the unrestricted MTQ core
without passing through its policy gateway.`;

// ---- §21 BRICS Adapter Security ----
export const BRICS_ADAPTER_SECURITY = {
  must: [
    "independent authorization",
    "version control",
    "policy control",
    "transaction limits",
    "jurisdiction controls",
    "cryptographic authentication",
    "emergency disablement",
    "audit trail",
    "upgrade governance",
    "no bypass path into MTQ core",
  ],
  criticalRequirement: "Disabling the BRICS adapter must not disable MTQ itself. This preserves MTQ's neutrality and operational independence.",
} as const;

// ---- §22 U.S. Emergency Isolation ----
export const JURISDICTIONAL_EMERGENCY_ISOLATION = {
  capability: "If U.S. law, regulator instruction or system risk requires suspension: U.S. JSG → ISOLATED, while Japan JSG → ACTIVE, UAE JSG → ACTIVE, India JSG → ACTIVE, Other permitted JSGs → ACTIVE (subject to their own laws).",
  principle: "Any jurisdiction can isolate its own gateway without collapsing the entire MITHQAL network.",
  advantage: "This is much stronger than a globally centralized block/unblock switch.",
} as const;

// ---- §23 Economic Resilience ----
export const ECONOMIC_RESILIENCE = {
  rule: "The MITHQAL network shall be designed so that jurisdictional isolation does not automatically create global settlement failure.",
  principle: "A prohibited or suspended jurisdiction shall be isolated through its gateway while permitted corridors continue operating where legally and technically possible.",
  outcome: "This creates geopolitical and operational resilience.",
} as const;

// ---- §24 BRICS Pilot Strategy (5 Phases) ----
export const BRICS_PILOT_STRATEGY = [
  { phase: 1, name: "Non-BRICS / Cross-Currency Pilot", flow: "Bank → MTQ → Bank" },
  { phase: 2, name: "BRICS National-Currency Corridor", flow: "INR → MTQ → AED (or another legally approved corridor)" },
  { phase: 3, name: "CBDC Corridor", flow: "CBDC A → MTQ → CBDC B" },
  { phase: 4, name: "Official BRICS Instrument", flow: "BRICS Unit → MTQ → Local Currency / CBDC (if formally created)" },
  { phase: 5, name: "Multilateral Network", flow: "Multiple BRICS and non-BRICS jurisdictions" },
];

// ---- §25 Final BRICS / U.S. Canonical Statement ----
export const FINAL_BRICS_US_STATEMENT = "MITHQAL is not a BRICS monetary instrument and is not an alternative geopolitical monetary bloc. MTQ is a neutral wholesale settlement instrument capable of connecting authorized banks, sovereign monetary systems, local currencies, wholesale CBDCs, and—if formally established and authorized—a future BRICS unit of account or settlement instrument. Each jurisdiction retains complete authority over what institutions, assets, currencies, transactions and information may pass through its jurisdictional settlement gateway. Technical interoperability does not create legal authorization. MITHQAL shall never be used to circumvent sanctions, capital controls, AML/CFT requirements or other applicable law.";

// ---- §26 Final Design Decision ----
export const FINAL_DESIGN_DECISION = {
  architecture: `
                  SOVEREIGN / MONETARY SYSTEMS
                              │
              ┌───────────────┼────────────────┐
              │               │                │
             USA            BRICS            JAPAN
              │               │                │
          U.S. JSG         BRICS JSG         JP JSG
              │               │                │
           U.S. Banks      BRICS Banks      JP Banks
              │               │                │
              └───────────────┼────────────────┘
                              │
                              ▼
                    MITHQAL MTQ CORE
                    NEUTRAL SETTLEMENT
                              │
                 ┌────────────┴────────────┐
                 │                         │
            CBDC Adapter             BRICS Adapter
                 │                         │
                 ▼                         ▼
         Authorized CBDCs          Officially Authorized
                                   BRICS Instruments`,
  threeRules: [
    "MTQ is not BRICS money.",
    "MTQ is not U.S. money.",
    "MTQ is the neutral settlement layer between authorized monetary systems.",
  ],
  cooRecommendation: "Pursue BRICS interoperability through the jurisdictional-gateway model rather than putting BRICS directly into the MTQ core. This gives: BRICS compatibility without becoming a BRICS political instrument; U.S. compatibility without assuming U.S. authorization for BRICS transactions; CBDC compatibility without becoming a CBDC; Local-currency compatibility without requiring monetary union; Neutrality without becoming lawless.",
  keyAsymmetry: "If BRICS succeeds, MITHQAL has a role. If BRICS changes direction, MITHQAL still has a role. If the U.S. restricts a particular corridor, the U.S. gateway can isolate it without destroying the global MITHQAL network.",
} as const;
