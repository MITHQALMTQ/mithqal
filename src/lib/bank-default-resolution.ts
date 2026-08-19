// ============================================================================
// §V25.2 — §48 BANK DEFAULT & RESOLUTION FRAMEWORK
// ============================================================================
// This module implements §48 of the master directive: the eight-state bank
// default and resolution lifecycle for participating MTQ-issuing banks.
//
// SCOPE:
//   §48 defines what happens to MTQ (and to MTQ holders) when a participating
//   bank weakens, defaults, becomes insolvent, enters resolution, or exits the
//   MITHQAL system. It is the contractual and legal framework that any MTQ
//   holder, receiving bank, regulator, or resolution authority can rely upon
//   to answer the eleven canonical questions (see CONTRACTUAL_QUESTIONS).
//
// CRITICAL PRINCIPLE (stated repeatedly throughout):
//   MITHQAL IS NOT THE FINANCIAL GUARANTOR.
//
//   MITHQAL operates the protocol, verifies backing, applies constitutional
//   rules, calculates issuance capacity, authorizes issuance, reconciles,
//   and monitors systemic risk. MITHQAL does NOT guarantee the solvency of
//   participating banks, does NOT indemnify holders against bank default, and
//   does NOT step into the shoes of a bank's resolution authority.
//
//   The holder's counterparty is the issuing bank, not MITHQAL. The holder's
//   ultimate source of recovery is (a) the bank's Protected Backing Cell,
//   which is earmarked/segregated from the bank's general estate, and
//   (b) any residual claim against the bank's estate in resolution.
//
// EIGHT-STATE LIFECYCLE:
//   ACTIVE → RESTRICTED → LIQUIDITY_STRESS → SUSPENDED → DEFAULT →
//   INSOLVENT → RESOLUTION → EXIT
//
//   Each state is fully specified across nine behavioral dimensions:
//     1. newIssuance
//     2. existingTransfer
//     3. redemption
//     4. backingStatus
//     5. liquidity
//     6. customerTreatment
//     7. receivingBankTreatment
//     8. reconciliation
//     9. resolutionProcedure
//
// HONEST STATE (per §74):
//   - bankDefaultStateModelDesigned   = true   (the model is designed)
//   - bankDefaultOperationalWorkflow   = true   (operational workflow specified)
//   - bankDefaultContractValidated     = false  (no real bank contract signed)
//   - bankDefaultLegalValidated        = false  (no jurisdictional legal sign-off)
//   - bankDefaultProductionReady       = false  (not production-authorized)
//
//   The framework is SPECIFIED, not contracted. No real bank has signed the
//   contractual annex that codifies these obligations. No real jurisdiction
//   has validated the legal segregation of the Protected Backing Cell. The
//   framework is a design-time and operational-workflow specification, ready
//   to be put in front of banks, regulators, and resolution authorities, but
//   not yet live.
// ============================================================================

export const MODULE_ID = "v25.2-bank-default-resolution-1.0";
export const SPEC_VERSION = "v25.2 §48 — Bank Default & Resolution Framework";
export const DIRECTIVE_SECTION = 48;

/**
 * The NON-NEGOTIABLE controlling principle of this entire module.
 * Stated explicitly so it cannot be overlooked by any consumer.
 */
export const PRINCIPLE = "MITHQAL is NOT the financial guarantor" as const;

// ============================================================================
// SECTION 1 — Eight-state lifecycle type
// ============================================================================

/**
 * The eight bank default / resolution lifecycle states, in degradation order.
 *
 * ACTIVE           — Bank is healthy; full MTQ issuance, transfer, redemption.
 * RESTRICTED       — Bank capital adequacy breached; issuance throttled.
 * LIQUIDITY_STRESS — Bank LCR < 1.0; issuance suspended, redemption queue.
 * SUSPENDED        — Regulatory action; bank operations frozen at source.
 * DEFAULT          — Bank has defaulted on payment obligations.
 * INSOLVENT        — Bankruptcy declared; liabilities exceed assets.
 * RESOLUTION       — Resolution authority executing resolution tools.
 * EXIT             — Bank wound down / exited the MITHQAL system.
 *
 * Forward-only is the default; recovery requires explicit regulatory/legal
 * action and is OUT OF SCOPE for this engine (only forward transitions are
 * modeled here).
 */
export type BankDefaultState =
  | "ACTIVE"
  | "RESTRICTED"
  | "LIQUIDITY_STRESS"
  | "SUSPENDED"
  | "DEFAULT"
  | "INSOLVENT"
  | "RESOLUTION"
  | "EXIT";

/** Ordered list of lifecycle states (degradation direction). */
export const BANK_LIFECYCLE_ORDER: BankDefaultState[] = [
  "ACTIVE",
  "RESTRICTED",
  "LIQUIDITY_STRESS",
  "SUSPENDED",
  "DEFAULT",
  "INSOLVENT",
  "RESOLUTION",
  "EXIT",
];

// ============================================================================
// SECTION 2 — Per-state behavioral configuration
// ============================================================================

/**
 * The nine behavioral dimensions defined per §48 for each lifecycle state.
 *
 * Each dimension is a structured string that answers the corresponding
 * question for the given state. Strings are used (not enums) because the
 * answers are contractual prose, not discrete flags.
 */
export interface BankStateConfig {
  /** Lifecycle state this config pertains to. */
  state: BankDefaultState;

  /**
   * 1. New issuance behavior.
   * Can the bank issue NEW MTQ against its Protected Backing Cell?
   */
  newIssuance: string;

  /**
   * 2. Existing MTQ transfer behavior.
   * Can already-issued MTQ (held in wallets / with other banks) transfer
   * on-chain or be re-deposited? Note: MITHQAL is chain-neutral; on-chain
   * transfers cannot be halted by MITHQAL.
   */
  existingTransfer: string;

  /**
   * 3. Redemption behavior.
   * Can holders redeem MTQ for fiat/asset through THIS bank?
   */
  redemption: string;

  /**
   * 4. Backing status.
   * State of the Protected Backing Cell earmarked against the bank's issued
   * MTQ. Always either fully-backed (ACTIVE/RESTRICTED/LIQUIDITY_STRESS),
   * preserved (SUSPENDED), protected/sequestered (DEFAULT/INSOLVENT),
   * transferred-to-resolved-entity (RESOLUTION), or returned (EXIT).
   */
  backingStatus: string;

  /** 5. Liquidity status of the bank (LCR, redemption buffer, etc.). */
  liquidity: string;

  /** 6. Customer (MTQ holder) treatment at this state. */
  customerTreatment: string;

  /**
   * 7. Receiving-bank treatment.
   * How a different participating bank treats incoming MTQ that originated
   * from / passed through this bank. Driven by chain-neutrality + enhanced
   * reconciliation. The receiving bank is never obligated to make holders
   * whole for the originating bank's failure.
   */
  receivingBankTreatment: string;

  /** 8. Reconciliation procedure (with MITHQAL, custodians, regulators). */
  reconciliation: string;

  /** 9. Resolution procedure active at this state. */
  resolutionProcedure: string;
}

// ----------------------------------------------------------------------------
// BANK_STATE_CONFIGS — fully populated for all 8 states
// ----------------------------------------------------------------------------

export const BANK_STATE_CONFIGS: Record<BankDefaultState, BankStateConfig> = {
  ACTIVE: {
    state: "ACTIVE",
    newIssuance:
      "ALLOWED — bank may issue new MTQ up to its verified issuance " +
      "capacity (backed 1:1+ by its Protected Backing Cell at the 130% " +
      "strategic target). MITHQAL verifies backing and authorizes issuance.",
    existingTransfer:
      "ALLOWED — on-chain MTQ transfers freely between wallets and " +
      "participating banks. MITHQAL is chain-neutral and does not gate " +
      "transfers between healthy institutions.",
    redemption:
      "ALLOWED — holders may redeem MTQ through the issuing bank on the " +
      "normal redemption queue per the redemption-continuity framework. " +
      "Bank honors redemptions in fiat / asset at par.",
    backingStatus:
      "FULLY_BACKED — Protected Backing Cell holds ≥ 100% of issued MTQ " +
      "liability (target 130% strategic). Cell is earmarked and segregated " +
      "from the bank's general estate under banking law.",
    liquidity:
      "ADEQUATE — bank LCR ≥ 1.0, redemption buffer ≥ 2% of reserves, " +
      "MTQ redemption continuity state = NORMAL.",
    customerTreatment:
      "Normal banking services. Holders can deposit, transfer, redeem. " +
      "No special communication required beyond routine disclosures.",
    receivingBankTreatment:
      "Accept incoming MTQ without restriction. Standard daily " +
      "reconciliation applies. No enhanced monitoring.",
    reconciliation:
      "Daily reconciliation per bank-onboarding spec. MITHQAL verifies " +
      "the Protected Backing Cell balance against on-chain supply S_bank.",
    resolutionProcedure:
      "None — preventive monitoring only. MITHQAL monitors capital " +
      "adequacy, LCR, and redemption-continuity state continuously.",
  },

  RESTRICTED: {
    state: "RESTRICTED",
    newIssuance:
      "CONDITIONAL — issuance capacity throttled to ≤ 40% of verified " +
      "capacity. New issuance requires enhanced MITHQAL review and " +
      "evidence of full backing.",
    existingTransfer:
      "ALLOWED — on-chain MTQ continues to transfer freely. Existing " +
      "supply is unaffected by the bank's capital position; chain " +
      "neutrality is preserved.",
    redemption:
      "ALLOWED — redemptions continue normally. The bank's capital " +
      "weakness does not (yet) impact its ability to honor redemptions.",
    backingStatus:
      "FULLY_BACKED — Protected Backing Cell still holds ≥ 100% of " +
      "issued MTQ. The bank's weakness is on its capital side, not on " +
      "the backing side. Cell segregation preserved.",
    liquidity:
      "MONITORING — bank LCR still ≥ 1.0 but trending. Redemption " +
      "continuity state = ELEVATED. Enhanced surveillance by MITHQAL.",
    customerTreatment:
      "Normal services but with proactive disclosure. Bank must publish " +
      "a capital restoration plan. Holders may begin to migrate to other " +
      "participating banks if they choose; no penalty.",
    receivingBankTreatment:
      "Accept incoming MTQ. Begin concentration monitoring: track " +
      "incoming MTQ volume from the restricted bank against per-bank " +
      "exposure limits. No restriction on acceptance.",
    reconciliation:
      "Enhanced reconciliation — twice daily. MITHQAL verifies backing " +
      "and capital restoration progress. Bank reports daily on capital " +
      "ratios, large exposures, and large redemption requests.",
    resolutionProcedure:
      "Corrective action plan agreed with bank's regulator (NOT MITHQAL). " +
      "MITHQAL coordinates with the regulator on issuance-capacity " +
      "throttling but does NOT become the bank's supervisor.",
  },

  LIQUIDITY_STRESS: {
    state: "LIQUIDITY_STRESS",
    newIssuance:
      "SUSPENDED — no new issuance. The bank's Protected Backing Cell is " +
      "preserved for existing supply only; no new MTQ may be created " +
      "against it while the bank is in liquidity stress.",
    existingTransfer:
      "ALLOWED — on-chain MTQ continues to transfer. Chain neutrality " +
      "preserved. Holders may move MTQ to other banks or wallets.",
    redemption:
      "THROTTLED — redemption queue activated per the redemption-" +
      "continuity framework (DEFENSIVE/STRESS state). Large redemptions " +
      "require pre-notification. Equal-treatment queue enforced.",
    backingStatus:
      "FULLY_BACKED — Protected Backing Cell holds ≥ 100% of issued " +
      "MTQ. This is a LIQUIDITY problem, not a SOLVENCY problem: the " +
      "backing exists but the bank cannot immediately convert it to " +
      "settlement currency at par.",
    liquidity:
      "STRESSED — bank LCR < 1.0. Redemption continuity state = STRESS. " +
      "Bank draws on its front-line HQLA; emergency liquidity facility " +
      "(central bank, NOT MITHQAL) may be invoked.",
    customerTreatment:
      "Transparent communication. Holders informed of redemption queue " +
      "and estimated settlement times. No new issuance. Holders may " +
      "freely transfer MTQ to other participating banks for normal " +
      "redemption service.",
    receivingBankTreatment:
      "Accept incoming MTQ. Flag for enhanced concentration monitoring. " +
      "Coordinate with MITHQAL on whether the receiving bank should " +
      "stand ready to provide redemption service for migrating holders.",
    reconciliation:
      "Hourly reconciliation. MITHQAL tracks redemption queue depth, " +
      "front-line HQLA drawdown, and Protected Backing Cell integrity " +
      "in near-real-time.",
    resolutionProcedure:
      "Emergency liquidity facility engaged with the bank's central " +
      "bank / lender of last resort (NOT MITHQAL — MITHQAL is not the " +
      "financial guarantor). If liquidity cannot be restored, transition " +
      "to SUSPENDED on regulatory action.",
  },

  SUSPENDED: {
    state: "SUSPENDED",
    newIssuance:
      "PROHIBITED — no new issuance. The bank's MTQ issuance gateway is " +
      "suspended at the source by regulatory action.",
    existingTransfer:
      "CHAIN_NEUTRAL — the bank cannot process new transfers through " +
      "ITS gateway, but on-chain MTQ continues to transfer between other " +
      "wallets and participating banks. MITHQAL cannot and does not halt " +
      "on-chain transfers; chain neutrality is absolute.",
    redemption:
      "SUSPENDED_AT_SOURCE — the suspended bank cannot process " +
      "redemptions through its gateway. Holders may redeem by transferring " +
      "their MTQ to a different participating bank (chain transfer) and " +
      "redeeming there, subject to that bank's reconciliation.",
    backingStatus:
      "PRESERVED — Protected Backing Cell is preserved and locked. " +
      "Backing is not impaired; the bank's operational status is " +
      "suspended, not its balance sheet.",
    liquidity:
      "LOCKED — bank liquidity operations frozen by regulatory action. " +
      "Cell-side backing remains intact and verified by MITHQAL.",
    customerTreatment:
      "Notification issued by the regulator and by MITHQAL. Holders may " +
      "continue to hold, transfer to other banks, or redeem via other " +
      "participating banks. No loss of MTQ value or backing occurs.",
    receivingBankTreatment:
      "Accept incoming MTQ (chain neutrality). Perform full snapshot " +
      "reconciliation against the suspended bank's last verified state. " +
      "Receiving bank honors normal redemption service for migrating " +
      "holders, drawing on the suspended bank's Protected Backing Cell " +
      "via the cross-bank reconciliation protocol (NOT on the receiving " +
      "bank's own balance sheet).",
    reconciliation:
      "Full snapshot reconciliation. MITHQAL captures the suspended " +
      "bank's on-chain supply S_bank, Protected Backing Cell balance, " +
      "and outstanding redemption queue. Snapshot is shared with the " +
      "regulator and any acquiring bank.",
    resolutionProcedure:
      "Regulatory intervention. The regulator (NOT MITHQAL) decides " +
      "whether to (a) lift the suspension and restore ACTIVE status " +
      "(after corrective action), (b) declare payment default, or " +
      "(c) move directly to insolvency / resolution. MITHQAL coordinates " +
      "data sharing but does NOT make the regulatory decision.",
  },

  DEFAULT: {
    state: "DEFAULT",
    newIssuance:
      "PROHIBITED — no new issuance. The bank has defaulted on payment " +
      "obligations; MITHQAL has revoked issuance authorization.",
    existingTransfer:
      "CHAIN_NEUTRAL — on-chain MTQ continues to transfer. MITHQAL " +
      "cannot halt chain transfers. Existing supply remains valid; the " +
      "MTQ itself is not in default — only the bank is.",
    redemption:
      "CLAIM_FROZEN_AT_DEFAULTING_BANK — the defaulting bank cannot " +
      "process redemptions. Holders may transfer MTQ to other " +
      "participating banks for redemption, drawing on the Protected " +
      "Backing Cell via cross-bank reconciliation. Any unredeemed " +
      "balance becomes a holder claim against the defaulting bank's " +
      "estate (see contractual question 3).",
    backingStatus:
      "PROTECTED_BACKING_HELD — the Protected Backing Cell is " +
      "segregated / earmarked from the bank's general estate under " +
      "banking law. The cell is held for the benefit of MTQ holders " +
      "and is NOT available to the bank's general creditors. MITHQAL " +
      "verifies cell integrity continuously.",
    liquidity:
      "ZERO — the bank cannot meet payment obligations in normal " +
      "course. Liquidity is exhausted at the bank level; the cell-side " +
      "backing remains.",
    customerTreatment:
      "Holders informed of default and of their claim path: (a) " +
      "transfer MTQ to another participating bank and redeem via the " +
      "cross-bank reconciliation protocol against the Protected " +
      "Backing Cell, or (b) file a claim in the bank's resolution " +
      "proceeding. MITHQAL provides the reconciliation data holders " +
      "need; MITHQAL does NOT indemnify holders.",
    receivingBankTreatment:
      "Accept incoming MTQ (chain neutrality). Perform forensic " +
      "reconciliation per the forensic-rr-reconciliation spec against " +
      "the defaulting bank's snapshot. Receiving bank may redeem " +
      "incoming MTQ against the Protected Backing Cell via the " +
      "cross-bank reconciliation protocol — the receiving bank is NOT " +
      "required to advance its own funds to make holders whole.",
    reconciliation:
      "Forensic reconciliation per forensic-rr-reconciliation.ts. MITHQAL " +
      "produces a definitive on-chain-vs-backing reconciliation: S_bank " +
      "(on-chain supply) vs Protected Backing Cell (earmarked assets). " +
      "Any shortfall triggers an honest shortfall disclosure (MITHQAL " +
      "does NOT cover the shortfall).",
    resolutionProcedure:
      "MITHQAL triggers resolution proceedings coordination. The " +
      "resolution authority (regulator / deposit insurer / central " +
      "bank, NOT MITHQAL) decides whether to attempt recovery, declare " +
      "insolvency, or open resolution tools. If insolvency is " +
      "declared, transition to INSOLVENT.",
  },

  INSOLVENT: {
    state: "INSOLVENT",
    newIssuance:
      "PROHIBITED — issuance authorization permanently revoked. The " +
      "bank cannot issue MTQ in any state going forward.",
    existingTransfer:
      "CHAIN_NEUTRAL — on-chain MTQ continues to transfer. MITHQAL " +
      "remains chain-neutral; the bankruptcy of one participating bank " +
      "does not invalidate the MTQ supply.",
    redemption:
      "CLAIM_IN_BANKRUPTCY — holders' redemption right becomes a " +
      "claim in the bank's insolvency proceeding. The Protected Backing " +
      "Cell, being earmarked/segregated customer property under " +
      "banking law, is returned to MTQ holders preferentially (pari " +
      "passu at minimum, preferential ideally per jurisdiction).",
    backingStatus:
      "PROTECTED_BACKING_SEQUESTERED — the Protected Backing Cell is " +
      "legally sequestered from the bankruptcy estate. The cell is " +
      "distributed to MTQ holders (and to acquiring banks on behalf of " +
      "migrated holders) under court / resolution-authority supervision. " +
      "MITHQAL provides the reconciliation data the court needs.",
    liquidity:
      "ZERO — bank is in formal insolvency. No liquidity operations.",
    customerTreatment:
      "Holders file claim in insolvency proceeding. MITHQAL provides " +
      "each holder with a cryptographic proof-of-liability receipt " +
      "(per proof-of-liabilities.ts) that the holder can submit to the " +
      "court / resolution authority. The Protected Backing Cell is " +
      "returned to holders preferentially; any shortfall becomes a " +
      "general unsecured claim (NOT covered by MITHQAL).",
    receivingBankTreatment:
      "Accept incoming MTQ (chain neutrality). Reconciliation with " +
      "the insolvency administrator / resolution authority. Receiving " +
      "bank may redeem incoming MTQ against the Protected Backing Cell " +
      "under court supervision, on behalf of migrated holders.",
    reconciliation:
      "Insolvency-led reconciliation. MITHQAL cooperates with the " +
      "insolvency administrator: provides the on-chain supply record, " +
      "the Protected Backing Cell reconciliation, the per-holder proof-" +
      "of-liabilities receipts, and the historical issuance/redemption " +
      "audit trail.",
    resolutionProcedure:
      "Resolution authority takes control. If resolution tools are " +
      "invoked (bail-in, sale, bridge bank), transition to RESOLUTION. " +
      "If the bank is wound down directly, transition to EXIT after " +
      "the cell is distributed and claims are settled.",
  },

  RESOLUTION: {
    state: "RESOLUTION",
    newIssuance:
      "PROHIBITED — the bank is under resolution; no new issuance. " +
      "Any successor entity (bridge bank, purchaser) must be separately " +
      "onboarded as a participating bank before it can issue MTQ.",
    existingTransfer:
      "CHAIN_NEUTRAL — on-chain MTQ continues to transfer. Resolution " +
      "tools do not affect the chain; they affect the bank's " +
      "obligations and the Protected Backing Cell.",
    redemption:
      "RESOLUTION_AUTHORITY_CONTROLLED — the resolution authority " +
      "controls the redemption / claims process. Holders redeem via " +
      "the resolution authority's mechanism (bail-in conversion, " +
      "transfer to bridge bank, claim payout). MITHQAL provides " +
      "reconciliation data but does NOT control the resolution.",
    backingStatus:
      "TRANSFERRED_TO_RESOLVED_ENTITY — the Protected Backing Cell is " +
      "transferred to the bridge bank / purchaser / resolution fund as " +
      "directed by the resolution authority. The cell remains earmarked " +
      "for MTQ holders' benefit; it is NOT absorbed into the bridge " +
      "bank's general estate.",
    liquidity:
      "UNDER_AUTHORITY — liquidity is managed by the resolution " +
      "authority, not by the bank or by MITHQAL.",
    customerTreatment:
      "Resolution authority communicates directly with holders. " +
      "Holders' MTQ claims are honored (a) by transfer of the cell to " +
      "the bridge bank (holders continue as MTQ holders of the bridge " +
      "bank), (b) by bail-in conversion, or (c) by claim payout. " +
      "MITHQAL ensures the cell reconciliation follows the holders, " +
      "not the failed bank's general creditors.",
    receivingBankTreatment:
      "Accept incoming MTQ (chain neutrality). Reconciliation with " +
      "the resolution authority. Receiving bank honors redemptions " +
      "against the transferred Protected Backing Cell on behalf of " +
      "migrated holders, per the resolution authority's directions.",
    reconciliation:
      "Resolution-led reconciliation. MITHQAL cooperates with the " +
      "resolution authority: provides the on-chain supply record, " +
      "the Protected Backing Cell reconciliation, the per-holder proof-" +
      "of-liabilities receipts, and the cell-transfer instructions.",
    resolutionProcedure:
      "Bail-in, sale of business, or bridge-bank transfer executed by " +
      "the resolution authority. MITHQAL coordinates data and ensures " +
      "the Protected Backing Cell is tracked to the successor entity " +
      "(or distributed to holders). When resolution is complete, " +
      "transition to EXIT for the failed bank.",
  },

  EXIT: {
    state: "EXIT",
    newIssuance:
      "PROHIBITED — the bank has exited the MITHQAL system. It no " +
      "longer participates as an issuing bank. Any successor entity " +
      "must be onboarded separately.",
    existingTransfer:
      "CHAIN_NEUTRAL — any residual on-chain MTQ continues to transfer " +
      "normally. The exit of one bank does not affect the MTQ supply " +
      "or other banks.",
    redemption:
      "COMPLETED — all redemption obligations of the exiting bank have " +
      "been fulfilled (via cell transfer to an acquiring bank, claim " +
      "payout, or direct redemption). No open redemption claims remain.",
    backingStatus:
      "RETURNED_OR_TRANSFERRED — the Protected Backing Cell has been " +
      "(a) transferred to an acquiring participating bank, (b) returned " +
      "to the MTQ holder community via the resolution authority, or " +
      "(c) wound down with all proceeds distributed to holders. No " +
      "backing remains held for this bank.",
    liquidity:
      "NOT_APPLICABLE — bank is no longer in the MTQ system.",
    customerTreatment:
      "Customers have been transitioned (to an acquiring bank, to " +
      "direct redemption, or to claim payout). No open customer " +
      "issues remain for this bank. Holders' MTQ remains valid on-chain.",
    receivingBankTreatment:
      "NOT_APPLICABLE — the exiting bank is no longer a participating " +
      "institution. It does not send or receive MTQ. Other participating " +
      "banks operate normally.",
    reconciliation:
      "FINAL — final reconciliation completed. MITHQAL records the " +
      "exit, archives the bank's reconciliation history, and updates " +
      "the participating-bank registry. Bank is delisted.",
    resolutionProcedure:
      "Exit complete. The bank is delisted from the participating-bank " +
      "registry. If the bank was wound down through resolution, the " +
      "resolution authority closes its proceeding. MITHQAL records the " +
      "exit in the institutional audit trail.",
  },
};

// ============================================================================
// SECTION 3 — Eleven contractual / legal questions
// ============================================================================

/**
 * The eleven questions the §48 framework MUST answer. These are the
 * canonical questions any MTQ holder, receiving bank, regulator, or
 * resolution authority will ask. The answer field gives the MITHQAL
 * framework's binding response; the principle field states the
 * controlling principle (always anchored to PRINCIPLE above).
 */
export interface ContractualQuestion {
  /** Question number (1-11). */
  id: number;
  /** The question text. */
  question: string;
  /** The framework's binding answer. */
  answer: string;
  /** Controlling principle for this question. */
  principle: string;
}

export const CONTRACTUAL_QUESTIONS: ContractualQuestion[] = [
  {
    id: 1,
    question: "Who owes the holder?",
    answer:
      "The issuing bank owes the holder. The bank is the holder's " +
      "counterparty, not MITHQAL. The bank's obligation is to redeem " +
      "MTQ at par (against its Protected Backing Cell) and to honor " +
      "transfers. In default / insolvency, the holder's claim is " +
      "against the bank's estate and against the Protected Backing Cell " +
      "(which is earmarked customer property, not general estate).",
    principle: PRINCIPLE,
  },
  {
    id: 2,
    question: "Who owes the receiving bank?",
    answer:
      "The originating (defaulting) bank owes the receiving bank for " +
      "any MTQ the receiving bank honors on behalf of migrated holders " +
      "via the cross-bank reconciliation protocol. The receiving bank " +
      "draws on the originating bank's Protected Backing Cell, not on " +
      "its own balance sheet. MITHQAL facilitates the reconciliation " +
      "but is not a debtor in this relationship.",
    principle: PRINCIPLE,
  },
  {
    id: 3,
    question: "What is the holder's claim?",
    answer:
      "The holder's claim is (a) a redemption claim against the " +
      "Protected Backing Cell (earmarked customer property, returned " +
      "preferentially in insolvency), and (b) to the extent the cell " +
      "is insufficient, a general unsecured claim against the bank's " +
      "estate in resolution. The claim is denominated in the MTQ par " +
      "value (PAR = 1.00 USD per §2 of the reserve spec). MITHQAL " +
      "provides the proof-of-liabilities receipt; it does NOT guarantee " +
      "the claim.",
    principle: PRINCIPLE,
  },
  {
    id: 4,
    question: "What happens to existing MTQ?",
    answer:
      "Existing MTQ remains valid. The MTQ is on-chain and is NOT " +
      "invalidated by the failure of its issuing bank. The MTQ " +
      "represents a claim on the Protected Backing Cell and a residual " +
      "claim on the bank's estate. Holders may continue to hold, " +
      "transfer, or redeem (via another participating bank).",
    principle: "Chain neutrality — MTQ supply survives bank failure",
  },
  {
    id: 5,
    question: "Can it continue transferring?",
    answer:
      "YES. On-chain transfers of MTQ continue in every state. MITHQAL " +
      "is chain-neutral and cannot halt on-chain transfers. The bank's " +
      "gateway may be suspended (SUSPENDED / DEFAULT / INSOLVENT / " +
      "RESOLUTION / EXIT states), but on-chain MTQ held in non-custodial " +
      "wallets or with other participating banks transfers freely.",
    principle: "Chain neutrality is absolute",
  },
  {
    id: 6,
    question: "Can it redeem?",
    answer:
      "Depends on state. ACTIVE / RESTRICTED / LIQUIDITY_STRESS: yes " +
      "(normal / throttled). SUSPENDED / DEFAULT / INSOLVENT / " +
      "RESOLUTION: the failing bank's gateway cannot redeem, BUT " +
      "holders may transfer their MTQ to another participating bank " +
      "and redeem there against the Protected Backing Cell via the " +
      "cross-bank reconciliation protocol. EXIT: all redemptions " +
      "completed. MITHQAL never guarantees redemption; it provides the " +
      "reconciliation that makes redemption possible.",
    principle: PRINCIPLE,
  },
  {
    id: 7,
    question: "Who absorbs losses?",
    answer:
      "Losses are absorbed in this order: (1) the Protected Backing " +
      "Cell (earmarked customer property — first loss for MTQ holders " +
      "is zero IF the cell is fully backed); (2) the bank's equity / " +
      "shareholders; (3) the bank's subordinated debt; (4) the bank's " +
      "general creditors pro rata; (5) the bank's deposit insurer / " +
      "resolution fund (where applicable). MITHQAL absorbs NO losses. " +
      "MITHQAL is not the financial guarantor, not the deposit insurer, " +
      "and not the resolution fund.",
    principle: PRINCIPLE,
  },
  {
    id: 8,
    question: "What happens to backing?",
    answer:
      "The Protected Backing Cell is preserved throughout the lifecycle. " +
      "In ACTIVE / RESTRICTED / LIQUIDITY_STRESS: fully-backed, " +
      "operationally available. In SUSPENDED: preserved and locked. In " +
      "DEFAULT / INSOLVENT: legally sequestered from the bank's general " +
      "estate, returned to MTQ holders preferentially. In RESOLUTION: " +
      "transferred to the bridge bank / purchaser (still earmarked for " +
      "MTQ holders). In EXIT: returned / distributed / wound down. " +
      "MITHQAL tracks the cell across all transitions; it never absorbs " +
      "or repurposes the cell.",
    principle:
      "Protected Backing Cell is customer property, not MITHQAL assets",
  },
  {
    id: 9,
    question: "What does the resolution authority control?",
    answer:
      "The resolution authority (regulator / deposit insurer / central " +
      "bank of the bank's home jurisdiction, NOT MITHQAL) controls: " +
      "(a) the resolution tool selected (bail-in, sale, bridge bank, " +
      "wind-down); (b) the distribution of the bank's estate; (c) the " +
      "transfer of the Protected Backing Cell to a successor entity; " +
      "(d) communication with creditors. MITHQAL provides data, " +
      "reconciliation, and proof-of-liabilities receipts, but does NOT " +
      "control the resolution. MITHQAL is not the resolution authority.",
    principle: "Resolution authority is sovereign, MITHQAL is protocol",
  },
  {
    id: 10,
    question: "How is reconciliation performed?",
    answer:
      "Reconciliation is performed continuously by MITHQAL across the " +
      "lifecycle: ACTIVE (daily), RESTRICTED (twice daily), " +
      "LIQUIDITY_STRESS (hourly), SUSPENDED (full snapshot), DEFAULT " +
      "(forensic per forensic-rr-reconciliation.ts), INSOLVENT (insolvency-" +
      "led, court-supervised), RESOLUTION (resolution-authority-led), " +
      "EXIT (final reconciliation). MITHQAL reconciles on-chain supply " +
      "S_bank against the Protected Backing Cell balance, per the " +
      "canonical-supply-ledger theorems (S1, S2, S3). Any shortfall is " +
      "disclosed honestly, NOT covered by MITHQAL.",
    principle: "Honest reconciliation — shortfalls disclosed, not covered",
  },
  {
    id: 11,
    question: "What is the customer treatment?",
    answer:
      "ACTIVE: normal. RESTRICTED: normal with proactive disclosure. " +
      "LIQUIDITY_STRESS: redemption queue, transparent communication. " +
      "SUSPENDED: notification, ability to transfer MTQ to another bank " +
      "and redeem normally. DEFAULT: choice of (a) transfer-and-redeem " +
      "via another bank, or (b) file claim. INSOLVENT: file claim with " +
      "proof-of-liabilities receipt, cell returned preferentially. " +
      "RESOLUTION: resolution-authority communication. EXIT: customers " +
      "transitioned. MITHQAL provides the data customers need; MITHQAL " +
      "does NOT compensate customers for bank failure.",
    principle: PRINCIPLE,
  },
];

// ============================================================================
// SECTION 4 — Lifecycle transition assessment
// ============================================================================

/**
 * Signals that may trigger a lifecycle transition. Each signal is a boolean
 * indicating whether the corresponding condition has been observed at this
 * assessment step. All fields are optional; missing fields default to false.
 *
 * SIGNAL PRIORITY (highest wins, when multiple signals are true):
 *   exitCompleted       → EXIT
 *   resolutionTriggered → RESOLUTION
 *   insolvencyDeclared  → INSOLVENT
 *   defaultDeclared     → DEFAULT
 *   regulatoryAction    → SUSPENDED
 *   liquidityStress     → LIQUIDITY_STRESS
 *   capitalAdequacyBreach → RESTRICTED
 *
 * Note: this engine models FORWARD transitions only. Recovery (e.g. from
 * SUSPENDED back to ACTIVE after corrective action) is out of scope and
 * requires explicit regulatory action that this engine does not auto-trigger.
 */
export interface BankTransitionSignals {
  /** Bank capital adequacy below regulatory minimum (→ RESTRICTED). */
  capitalAdequacyBreach?: boolean;
  /** Bank LCR below threshold / redemption-continuity = STRESS (→ LIQUIDITY_STRESS). */
  liquidityStress?: boolean;
  /** Regulatory action has suspended bank operations (→ SUSPENDED). */
  regulatoryAction?: boolean;
  /** Bank has defaulted on a payment obligation (→ DEFAULT). */
  defaultDeclared?: boolean;
  /** Insolvency has been formally declared by a court / regulator (→ INSOLVENT). */
  insolvencyDeclared?: boolean;
  /** Resolution proceedings have been opened by the resolution authority (→ RESOLUTION). */
  resolutionTriggered?: boolean;
  /** Resolution has completed / bank has been wound down (→ EXIT). */
  exitCompleted?: boolean;
}

/**
 * The result of a single lifecycle transition assessment.
 */
export interface BankLifecycleTransition {
  /** State before the transition. */
  from: BankDefaultState;
  /** State after the transition (may equal `from` if no transition fires). */
  to: BankDefaultState;
  /** True if a transition occurred. */
  transitioned: boolean;
  /** The signal that drove the transition (null if no transition). */
  trigger: keyof BankTransitionSignals | null;
  /** Human-readable reason for the transition (or for no transition). */
  reason: string;
  /** Snapshot of the signals evaluated. */
  signals: BankTransitionSignals;
}

/** Maps each signal to the lifecycle state it triggers. */
const SIGNAL_TARGET_STATE: Record<
  keyof BankTransitionSignals,
  BankDefaultState
> = {
  capitalAdequacyBreach: "RESTRICTED",
  liquidityStress: "LIQUIDITY_STRESS",
  regulatoryAction: "SUSPENDED",
  defaultDeclared: "DEFAULT",
  insolvencyDeclared: "INSOLVENT",
  resolutionTriggered: "RESOLUTION",
  exitCompleted: "EXIT",
};

/** Signal evaluation order, most-severe first. */
const SIGNAL_PRIORITY: (keyof BankTransitionSignals)[] = [
  "exitCompleted",
  "resolutionTriggered",
  "insolvencyDeclared",
  "defaultDeclared",
  "regulatoryAction",
  "liquidityStress",
  "capitalAdequacyBreach",
];

/**
 * Assess the next lifecycle state for a bank given its current state and a
 * set of observed signals.
 *
 * Rules:
 *   - The engine models forward transitions only.
 *   - When multiple signals are true, the most severe (per
 *     SIGNAL_PRIORITY) wins, but only if its target state is STRICTLY
 *     further along than the current state. Otherwise the bank stays.
 *   - When NO signal is true, the bank stays in its current state.
 *
 * @param currentState - current bank lifecycle state
 * @param signals - observed signals (all default to false if omitted)
 * @returns a BankLifecycleTransition describing the outcome
 */
export function assessBankTransition(
  currentState: BankDefaultState,
  signals: BankTransitionSignals = {},
): BankLifecycleTransition {
  const currentIndex = BANK_LIFECYCLE_ORDER.indexOf(currentState);

  for (const sig of SIGNAL_PRIORITY) {
    if (signals[sig]) {
      const targetState = SIGNAL_TARGET_STATE[sig];
      const targetIndex = BANK_LIFECYCLE_ORDER.indexOf(targetState);
      if (targetIndex > currentIndex) {
        return {
          from: currentState,
          to: targetState,
          transitioned: true,
          trigger: sig,
          reason:
            `Signal '${sig}' is true and target state ${targetState} is ` +
            `further along the lifecycle than ${currentState}; ` +
            `transitioning ${currentState} → ${targetState}.`,
          signals,
        };
      }
      // signal is true but bank is already at-or-past the target state —
      // continue checking less-severe signals (none can advance the bank).
    }
  }

  return {
    from: currentState,
    to: currentState,
    transitioned: false,
    trigger: null,
    reason:
      "No advancing signal observed, or all observed signals correspond " +
      "to states at-or-before the current state. Bank remains in " +
      `${currentState}. (Recovery transitions are out of scope for this ` +
      "engine and require explicit regulatory action.)",
    signals,
  };
}

// ============================================================================
// SECTION 5 — Scenario simulation
// ============================================================================

/**
 * A single step in a scenario simulation: the signals observed at one time
 * step, and the resulting transition.
 */
export interface BankScenarioStep {
  /** Step index (0-based). */
  step: number;
  /** State at the start of this step. */
  from: BankDefaultState;
  /** State at the end of this step. */
  to: BankDefaultState;
  /** Whether a transition occurred at this step. */
  transitioned: boolean;
  /** The signal that drove the transition (null if none). */
  trigger: keyof BankTransitionSignals | null;
  /** Reason for the transition (or for no transition). */
  reason: string;
  /** Signals observed at this step. */
  signals: BankTransitionSignals;
}

/**
 * The result of a scenario simulation.
 */
export interface BankScenarioResult {
  /** Starting state. */
  startState: BankDefaultState;
  /** Final state after walking through all signal steps. */
  endState: BankDefaultState;
  /** Number of steps simulated. */
  steps: number;
  /** Number of transitions that occurred. */
  transitionsCount: number;
  /** Per-step detail. */
  trace: BankScenarioStep[];
  /** True if the scenario terminated in EXIT (clean wind-down). */
  cleanExit: boolean;
}

/**
 * Simulate a bank default scenario by walking through a sequence of signal
 * observations, one step per time period.
 *
 * Each step's signals are evaluated against the current state via
 * {@link assessBankTransition}. The simulation runs forward-only.
 *
 * @param startState - the bank's starting lifecycle state
 * @param signalSequence - array of signal observations (one per step)
 * @returns the simulation result including per-step trace
 */
export function simulateBankDefaultScenario(
  startState: BankDefaultState,
  signalSequence: BankTransitionSignals[],
): BankScenarioResult {
  let currentState = startState;
  const trace: BankScenarioStep[] = [];
  let transitionsCount = 0;

  signalSequence.forEach((signals, idx) => {
    const result = assessBankTransition(currentState, signals);
    trace.push({
      step: idx,
      from: result.from,
      to: result.to,
      transitioned: result.transitioned,
      trigger: result.trigger,
      reason: result.reason,
      signals: result.signals,
    });
    if (result.transitioned) transitionsCount++;
    currentState = result.to;
  });

  return {
    startState,
    endState: currentState,
    steps: signalSequence.length,
    transitionsCount,
    trace,
    cleanExit: currentState === "EXIT",
  };
}

// ============================================================================
// SECTION 6 — Honest state (per §74)
// ============================================================================

/**
 * The honest state of the §48 framework, per §74 of the master directive.
 *
 * These five fields are NON-NEGOTIABLE and exact:
 *   - bankDefaultStateModelDesigned = true   (the lifecycle model is designed)
 *   - bankDefaultOperationalWorkflow = true   (the operational workflow is specified)
 *   - bankDefaultContractValidated   = false  (no real bank has signed the contractual annex)
 *   - bankDefaultLegalValidated      = false  (no jurisdiction has legally validated the cell segregation)
 *   - bankDefaultProductionReady     = false  (the framework is NOT production-authorized)
 *
 * HONESTY CONTRACT:
 *   - The model and workflow are SPECIFIED.
 *   - The contracts and legal validation are NOT YET EXECUTED.
 *   - The framework is APPROVED FOR INSTITUTIONAL ENGAGEMENT (put in front of
 *     banks, regulators, resolution authorities), NOT FOR PRODUCTION USE.
 */
export const BANK_DEFAULT_HONEST_STATE = {
  bankDefaultStateModelDesigned: true,
  bankDefaultOperationalWorkflow: true,
  bankDefaultContractValidated: false,
  bankDefaultLegalValidated: false,
  bankDefaultProductionReady: false,
} as const;

/**
 * Return the honest state of the §48 framework.
 *
 * @returns the five non-negotiable honest-state fields per §74
 */
export function bankDefaultHonestState(): typeof BANK_DEFAULT_HONEST_STATE {
  return BANK_DEFAULT_HONEST_STATE;
}

/**
 * The honest final status of the §48 framework.
 * SPECIFIED, NOT CONTRACTED. APPROVED FOR INSTITUTIONAL ENGAGEMENT,
 * NOT FOR PRODUCTION USE.
 */
export const BANK_DEFAULT_FINAL_STATUS: string =
  "§48 BANK DEFAULT & RESOLUTION FRAMEWORK — SPECIFIED, NOT CONTRACTED. " +
  "APPROVED FOR INSTITUTIONAL ENGAGEMENT (banks, regulators, resolution " +
  "authorities). NOT PRODUCTION-AUTHORIZED. MITHQAL IS NOT THE FINANCIAL " +
  "GUARANTOR.";

/** Status color: AMBER (spec-level, not production-authorized). */
export const BANK_DEFAULT_FINAL_STATUS_COLOR = "AMBER" as const;

// ============================================================================
// SECTION 7 — Executive report generator
// ============================================================================

/**
 * The full §48 report returned by {@link generateBankDefaultReport}.
 */
export interface BankDefaultReport {
  /** Module identifier. */
  moduleId: string;
  /** Spec version. */
  specVersion: string;
  /** Directive section number. */
  directiveSection: number;
  /** The controlling principle. */
  principle: typeof PRINCIPLE;
  /** The eight lifecycle states. */
  states: BankDefaultState[];
  /** Per-state behavioral configurations. */
  stateConfigs: Record<BankDefaultState, BankStateConfig>;
  /** The eleven contractual / legal questions with answers. */
  contractualQuestions: ContractualQuestion[];
  /** Honest state per §74. */
  honestState: typeof BANK_DEFAULT_HONEST_STATE;
  /** Final status string. */
  finalStatus: typeof BANK_DEFAULT_FINAL_STATUS;
  /** Final status color (AMBER). */
  finalStatusColor: typeof BANK_DEFAULT_FINAL_STATUS_COLOR;
  /** Reference: list of signals understood by the transition engine. */
  transitionSignals: (keyof BankTransitionSignals)[];
  /** Reference: the priority order of signals (most-severe first). */
  signalPriority: (keyof BankTransitionSignals)[];
}

/**
 * Generate the full §48 bank default & resolution report.
 *
 * This is the canonical entry point for any consumer (dashboard, API,
 * auditor, regulator) that needs the complete §48 framework in one
 * structured object.
 *
 * @returns the full BankDefaultReport
 */
export function generateBankDefaultReport(): BankDefaultReport {
  return {
    moduleId: MODULE_ID,
    specVersion: SPEC_VERSION,
    directiveSection: DIRECTIVE_SECTION,
    principle: PRINCIPLE,
    states: BANK_LIFECYCLE_ORDER,
    stateConfigs: BANK_STATE_CONFIGS,
    contractualQuestions: CONTRACTUAL_QUESTIONS,
    honestState: BANK_DEFAULT_HONEST_STATE,
    finalStatus: BANK_DEFAULT_FINAL_STATUS,
    finalStatusColor: BANK_DEFAULT_FINAL_STATUS_COLOR,
    transitionSignals: SIGNAL_PRIORITY,
    signalPriority: SIGNAL_PRIORITY,
  };
}
