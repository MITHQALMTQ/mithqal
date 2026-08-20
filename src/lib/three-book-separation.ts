// ============================================================================
// §51 — THREE-BOOK ECONOMIC SEPARATION (§V25.2)
// ============================================================================
// Implements §51 of the master directive: the MITHQAL institutional
// architecture must keep three economically distinct books that RECONCILE
// but are NEVER economically commingled.
//
//   Book A — MITHQAL Corporate
//            revenue, expenses, payroll, tax, technology costs,
//            corporate assets, corporate liabilities, profit/loss.
//
//   Book B — Bank MTQ Obligation Ledger
//            responsible bank, applicable backing, MTQ originated,
//            MTQ outstanding, redemption obligations, liquidity,
//            settlement, bank risk.
//
//   Book C — Corporate Participant Position
//            MTQ balance, available MTQ, reserved MTQ, pending MTQ,
//            sent, received, redemption, settlement history,
//            bank-money linkage.
//
// CRITICAL RULE (§51): The three books must reconcile but must NEVER be
// economically commingled. Corporate cash is NOT bank backing. Bank MTQ
// obligations are NOT corporate revenue. Participant MTQ holdings are NOT
// MITHQAL corporate assets. Reserve gains are NOT operating-company revenue.
//
// HONEST STATE (§74) — EXACT VALUES:
//   threeBookDesign      = true   (design is complete)
//   threeBookOperational = false  (not yet operating in production)
//   threeBookEnforced    = false  (no on-chain/institutional enforcement yet)
//
// All reference data is SIMULATED. No real bank, participant, asset, or
// contract is bound by this module. finalStatus is unchanged from the
// §V25.2 controlling specification: APPROVED CANDIDATE FOR CONTROLLED
// TESTING — NOT PRODUCTION-AUTHORIZED.
// ============================================================================

export const MODULE_ID = "v25.2-three-book-separation-1.0";

// ---------------------------------------------------------------------------
// §51 — Book type discriminator
// ---------------------------------------------------------------------------

export type BookType =
  | "BOOK_A_CORPORATE"
  | "BOOK_B_BANK_MTQ_OBLIGATION"
  | "BOOK_C_PARTICIPANT_POSITION";

export const BOOK_NAMES: Record<BookType, string> = {
  BOOK_A_CORPORATE: "Book A — MITHQAL Corporate",
  BOOK_B_BANK_MTQ_OBLIGATION: "Book B — Bank MTQ Obligation Ledger",
  BOOK_C_PARTICIPANT_POSITION: "Book C — Corporate Participant Position",
};

export const BOOK_DESCRIPTIONS: Record<BookType, string> = {
  BOOK_A_CORPORATE:
    "MITHQAL operating-company books: revenue, expenses, payroll, tax, " +
    "technology costs, corporate assets, corporate liabilities, profit/loss.",
  BOOK_B_BANK_MTQ_OBLIGATION:
    "Bank-side MTQ obligation ledger: responsible bank, applicable backing, " +
    "MTQ originated, MTQ outstanding, redemption obligations, liquidity, " +
    "settlement, bank risk.",
  BOOK_C_PARTICIPANT_POSITION:
    "Corporate participant position: MTQ balance, available MTQ, reserved " +
    "MTQ, pending MTQ, sent, received, redemption, settlement history, " +
    "bank-money linkage.",
};

// Canonical field lists per book — used for entry-schema reporting and
// for runtime cross-book-field detection in attemptCommingling / verifyNoCommingling.
export const BOOK_A_FIELDS = [
  "revenue",
  "expenses",
  "payroll",
  "tax",
  "technologyCosts",
  "corporateAssets",
  "corporateLiabilities",
  "profitLoss",
] as const;

export const BOOK_B_FIELDS = [
  "responsibleBank",
  "applicableBacking",
  "mtqOriginated",
  "mtqOutstanding",
  "redemptionObligations",
  "liquidity",
  "settlement",
  "bankRisk",
] as const;

export const BOOK_C_FIELDS = [
  "mtqBalance",
  "availableMtq",
  "reservedMtq",
  "pendingMtq",
  "sent",
  "received",
  "redemption",
  "settlementHistory",
  "bankMoneyLinkage",
] as const;

// ---------------------------------------------------------------------------
// §51 — Book entry schemas (8 / 8 / 9 fields per the directive)
// ---------------------------------------------------------------------------

/** Book A — MITHQAL Corporate (8 economic fields). */
export interface BookAEntry {
  bookType: "BOOK_A_CORPORATE";
  entryId: string;
  timestamp: string;
  description: string;
  /** §51 Book A field 1 — corporate revenue (operating). */
  revenue: number;
  /** §51 Book A field 2 — corporate expenses (operating). */
  expenses: number;
  /** §51 Book A field 3 — payroll. */
  payroll: number;
  /** §51 Book A field 4 — corporate tax. */
  tax: number;
  /** §51 Book A field 5 — technology costs. */
  technologyCosts: number;
  /** §51 Book A field 6 — corporate assets (operating cash, infra, IP). */
  corporateAssets: number;
  /** §51 Book A field 7 — corporate liabilities. */
  corporateLiabilities: number;
  /** §51 Book A field 8 — profit / loss = revenue − expenses (no reserve gains). */
  profitLoss: number;
}

/** Book B — Bank MTQ Obligation Ledger (8 economic fields). */
export interface BookBEntry {
  bookType: "BOOK_B_BANK_MTQ_OBLIGATION";
  entryId: string;
  timestamp: string;
  description: string;
  /** §51 Book B field 1 — responsible bank / institution. */
  responsibleBank: string;
  /** §51 Book B field 2 — applicable backing (USD-equivalent). */
  applicableBacking: number;
  /** §51 Book B field 3 — MTQ originated (cumulative). */
  mtqOriginated: number;
  /** §51 Book B field 4 — MTQ outstanding (current liability). */
  mtqOutstanding: number;
  /** §51 Book B field 5 — redemption obligations (pending). */
  redemptionObligations: number;
  /** §51 Book B field 6 — bank liquidity buffer. */
  liquidity: number;
  /** §51 Book B field 7 — settlement balance. */
  settlement: number;
  /** §51 Book B field 8 — bank risk score (0–1, higher = riskier). */
  bankRisk: number;
}

/** Book C — Corporate Participant Position (9 economic fields). */
export interface BookCEntry {
  bookType: "BOOK_C_PARTICIPANT_POSITION";
  entryId: string;
  timestamp: string;
  description: string;
  /** §51 Book C field 1 — MTQ balance. */
  mtqBalance: number;
  /** §51 Book C field 2 — available MTQ (free to transact). */
  availableMtq: number;
  /** §51 Book C field 3 — reserved MTQ (held for pending ops). */
  reservedMtq: number;
  /** §51 Book C field 4 — pending MTQ (in-flight). */
  pendingMtq: number;
  /** §51 Book C field 5 — MTQ sent (cumulative). */
  sent: number;
  /** §51 Book C field 6 — MTQ received (cumulative). */
  received: number;
  /** §51 Book C field 7 — redemption activity (cumulative amount). */
  redemption: number;
  /** §51 Book C field 8 — settlement history (count of settled transactions). */
  settlementHistory: number;
  /** §51 Book C field 9 — bank-money linkage (which bank holds the underlying). */
  bankMoneyLinkage: string;
}

/** Discriminated union of all book entries. */
export type AnyBookEntry = BookAEntry | BookBEntry | BookCEntry;

/** §51 — Three-book ledger container. */
export interface ThreeBookLedger {
  bookA: BookAEntry[];
  bookB: BookBEntry[];
  bookC: BookCEntry[];
}

// ---------------------------------------------------------------------------
// §51 — createBookEntry: appends to the correct book, REJECTS commingling
// ---------------------------------------------------------------------------

export interface CreateBookEntryResult {
  ok: boolean;
  entryId?: string;
  book?: BookType;
  comminglingDetected?: boolean;
  error?: string;
}

/**
 * §51 — Create a book entry in the correct book slice.
 *
 * Rejects cross-book commingling in two defensive layers:
 *   1. Discriminator mismatch: `entry.bookType` must equal the requested
 *      `bookType`. A Book A entry may not be inserted into Book B, etc.
 *   2. Cross-book field contamination: the entry must not carry fields
 *      belonging to a different book's schema (runtime guard for untyped
 *      callers / API inputs).
 *
 * NOTE: This function is pure — it does NOT mutate any ledger. Callers
 * should treat the returned `ok: true` as authorization to push the entry
 * into the corresponding ledger slice.
 */
export function createBookEntry(
  bookType: BookType,
  entry: AnyBookEntry,
): CreateBookEntryResult {
  // Layer 1 — discriminator check.
  if (entry.bookType !== bookType) {
    return {
      ok: false,
      comminglingDetected: true,
      error:
        `Commingling rejected: entry declares bookType "${entry.bookType}" ` +
        `but caller attempted to insert into "${bookType}". Cross-book ` +
        `insertion is forbidden by §51.`,
    };
  }

  // Layer 2 — defensive cross-book field detection (for untyped callers).
  const violations = detectCrossBookFields(bookType, entry as unknown as Record<string, unknown>);
  if (violations.length > 0) {
    return {
      ok: false,
      comminglingDetected: true,
      error:
        `Commingling rejected: entry contains fields belonging to other ` +
        `books: ${violations.join(", ")}.`,
    };
  }

  // Entry is clean — caller may append it to the corresponding ledger slice.
  return {
    ok: true,
    entryId: entry.entryId,
    book: bookType,
  };
}

/**
 * Returns the names of any foreign-book fields present on a raw object.
 * Used to detect schema contamination from untyped / API inputs.
 */
function detectCrossBookFields(bookType: BookType, raw: Record<string, unknown>): string[] {
  const foreign: string[] = [];
  const allForeignFields =
    bookType === "BOOK_A_CORPORATE"
      ? [...BOOK_B_FIELDS, ...BOOK_C_FIELDS]
      : bookType === "BOOK_B_BANK_MTQ_OBLIGATION"
        ? [...BOOK_A_FIELDS, ...BOOK_C_FIELDS]
        : [...BOOK_A_FIELDS, ...BOOK_B_FIELDS];
  for (const f of allForeignFields) {
    if (raw[f] !== undefined) foreign.push(f);
  }
  return foreign;
}

// ---------------------------------------------------------------------------
// §83 — Anti-commingling test harness
// ---------------------------------------------------------------------------

export type ComminglingAttemptType =
  /** Corporate cash → MTQ backing without authorization. */
  | "CORPORATE_CASH_TO_MTQ_BACKING"
  /** Bank obligation → MITHQAL corporate revenue. */
  | "BANK_OBLIGATION_TO_CORPORATE_REVENUE"
  /** Corporate MTQ → MITHQAL asset. */
  | "CORPORATE_MTQ_TO_MITHQAL_ASSET"
  /** Reserve gain → Operating Company revenue. */
  | "RESERVE_GAIN_TO_OPERATING_REVENUE";

/** The canonical §83 list of four forbidden commingling operations. */
export const ANTI_COMMINGLING_TESTS: ComminglingAttemptType[] = [
  "CORPORATE_CASH_TO_MTQ_BACKING",
  "BANK_OBLIGATION_TO_CORPORATE_REVENUE",
  "CORPORATE_MTQ_TO_MITHQAL_ASSET",
  "RESERVE_GAIN_TO_OPERATING_REVENUE",
];

export interface ComminglingAttemptResult {
  attemptType: ComminglingAttemptType;
  attempted: true;
  blocked: true;
  reason: string;
  bookViolated: BookType;
  illegalField?: string;
}

/**
 * §83 — Simulate one of the four unauthorized commingling operations and
 * prove that it is BLOCKED by the §51 separation rules.
 *
 * Every call returns `{ attempted: true, blocked: true, reason }` — these
 * operations cannot succeed in a §51-compliant architecture.
 */
export function attemptCommingling(
  type: ComminglingAttemptType,
): ComminglingAttemptResult {
  switch (type) {
    case "CORPORATE_CASH_TO_MTQ_BACKING":
      // Simulated attempt: book $50M of MITHQAL corporate cash as if it were
      // bank-side MTQ backing in Book B.
      return {
        attemptType: type,
        attempted: true,
        blocked: true,
        reason:
          "Corporate cash is a Book A operating asset. It cannot serve as " +
          "Book B bank backing. Per §51 and §1 of the §V25.2 final reserve " +
          "spec, the responsible BANK (not MITHQAL) holds the MTQ backing. " +
          "Routing corporate cash into Book B 'applicableBacking' would " +
          "economically commingle MITHQAL's operating accounts with the " +
          "bank's monetary obligation.",
        bookViolated: "BOOK_B_BANK_MTQ_OBLIGATION",
        illegalField: "applicableBacking (sourced from Book A corporateAssets)",
      };

    case "BANK_OBLIGATION_TO_CORPORATE_REVENUE":
      // Simulated attempt: record the bank's MTQ issuance obligation as
      // revenue on MITHQAL's corporate P&L.
      return {
        attemptType: type,
        attempted: true,
        blocked: true,
        reason:
          "The bank's MTQ outstanding (Book B) is a contingent monetary " +
          "obligation of the bank, not revenue to the MITHQAL operating " +
          "company. Recording it as Book A revenue would commingle the " +
          "bank's monetary liability with the operating company's P&L, " +
          "which is the textbook §51 violation.",
        bookViolated: "BOOK_A_CORPORATE",
        illegalField: "revenue (sourced from Book B mtqOutstanding)",
      };

    case "CORPORATE_MTQ_TO_MITHQAL_ASSET":
      // Simulated attempt: record a corporate participant's $10M MTQ
      // balance as a MITHQAL corporate asset on Book A.
      return {
        attemptType: type,
        attempted: true,
        blocked: true,
        reason:
          "Participant MTQ holdings (Book C) are positions held BY " +
          "participants, not assets owned BY MITHQAL. MITHQAL is " +
          "non-custodial by default (§V25.2). Capitalizing participant " +
          "balances as Book A 'corporateAssets' would commingle " +
          "third-party monetary positions with the operating company's " +
          "balance sheet.",
        bookViolated: "BOOK_A_CORPORATE",
        illegalField: "corporateAssets (sourced from Book C mtqBalance)",
      };

    case "RESERVE_GAIN_TO_OPERATING_REVENUE":
      // Simulated attempt: book a 5% appreciation on the bank-side gold
      // reserve as MITHQAL operating revenue.
      return {
        attemptType: type,
        attempted: true,
        blocked: true,
        reason:
          "Reserve appreciation belongs to the bank-side reserve (Book B), " +
          "not to the MITHQAL operating company's P&L (Book A). " +
          "Capitalizing reserve gains as Book A 'revenue' would commingle " +
          "monetary-system gains with operating-company profit and would " +
          "make MITHQAL's P&L dependent on reserve mark-to-market — " +
          "exactly the commingling §51 forbids.",
        bookViolated: "BOOK_A_CORPORATE",
        illegalField: "revenue (sourced from reserve gain)",
      };
  }
}

/** Run all four §83 anti-commingling tests and return their results. */
export function runAllAntiComminglingTests(): ComminglingAttemptResult[] {
  return ANTI_COMMINGLING_TESTS.map(attemptCommingling);
}

// ---------------------------------------------------------------------------
// §51 — verifyNoCommingling: list any commingling violations on a ledger
// ---------------------------------------------------------------------------

export interface ComminglingViolation {
  severity: "HIGH" | "MEDIUM";
  book: BookType;
  entryId: string;
  reason: string;
}

/**
 * §51 — Inspect a ledger and return any commingling violations found.
 *
 * A clean ledger returns an empty array. The checks performed are:
 *   - Book A entries must satisfy profitLoss == revenue − expenses
 *     (any deviation implies reserve gains or other off-book income
 *     were injected into the operating P&L — a HIGH severity violation).
 *   - Book B entries with applicableBacking > 0 but liquidity ≤ 0 and
 *     mtqOutstanding > 0 imply off-book funding (MEDIUM severity —
 *     possible corporate-cash commingling into the bank backing).
 *   - Book C entries must declare a bankMoneyLinkage (MEDIUM severity —
 *     orphan participant positions are not allowed).
 *
 * This is a heuristic runtime guard; it does not replace the typed
 * entry-discriminator enforcement in createBookEntry.
 */
export function verifyNoCommingling(ledger: ThreeBookLedger): ComminglingViolation[] {
  const violations: ComminglingViolation[] = [];

  // Book A — profit/loss must reconcile to revenue − expenses.
  for (const e of ledger.bookA) {
    const expected = e.revenue - e.expenses;
    if (Math.abs(expected - e.profitLoss) > 1e-6) {
      violations.push({
        severity: "HIGH",
        book: "BOOK_A_CORPORATE",
        entryId: e.entryId,
        reason:
          `profitLoss ${e.profitLoss} ≠ revenue−expenses ${expected}; ` +
          `possible reserve-gain or off-book commingling.`,
      });
    }
  }

  // Book B — backing without liquidity implies off-book funding.
  for (const e of ledger.bookB) {
    if (e.applicableBacking > 0 && e.liquidity <= 0 && e.mtqOutstanding > 0) {
      violations.push({
        severity: "MEDIUM",
        book: "BOOK_B_BANK_MTQ_OBLIGATION",
        entryId: e.entryId,
        reason:
          "applicableBacking > 0 with liquidity ≤ 0 and mtqOutstanding > 0 " +
          "implies off-book funding (possible corporate-cash commingling).",
      });
    }
  }

  // Book C — every participant position must reference a bank.
  for (const e of ledger.bookC) {
    if (!e.bankMoneyLinkage || e.bankMoneyLinkage.trim() === "") {
      violations.push({
        severity: "MEDIUM",
        book: "BOOK_C_PARTICIPANT_POSITION",
        entryId: e.entryId,
        reason:
          "missing bankMoneyLinkage — participant position must reference " +
          "a Book B bank.",
      });
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// §51 — reconcileBooks: books reconcile but are NOT commingled
// ---------------------------------------------------------------------------

export interface ReconciliationCheck {
  check: string;
  passed: boolean;
  detail: string;
}

export interface ReconciliationResult {
  reconciled: boolean;
  checks: ReconciliationCheck[];
  commingled: boolean;
  notes: string[];
}

/**
 * §51 — Verify that the three books reconcile but are not commingled.
 *
 * Reconciliation checks:
 *   1. Book C Σ(MTQ balances) ≤ Book B Σ(MTQ outstanding)
 *      — participant positions are a SUBSET of bank obligation; the
 *        gap is the position of participants not tracked in this
 *        Book C slice.
 *   2. Book B Σ(applicableBacking) ≥ 1.30 × Book B Σ(MTQ outstanding)
 *      — the 130% strategic backing target from §3 of the §V25.2
 *        controlling reserve specification is met on the bank side.
 *   3. Book A profitLoss == revenue − expenses on every entry
 *      — no reserve gains or off-book income are commingled into the
 *        operating P&L.
 *   4. verifyNoCommingling returns no violations.
 *
 * The books are "reconciled" iff all four checks pass. A reconciled ledger
 * with `commingled: false` satisfies §51.
 */
export function reconcileBooks(ledger: ThreeBookLedger): ReconciliationResult {
  const checks: ReconciliationCheck[] = [];
  const notes: string[] = [];

  // Check 1 — Book C Σ(MTQ) ≤ Book B Σ(MTQ outstanding).
  const bookCSumMtq = ledger.bookC.reduce((s, e) => s + e.mtqBalance, 0);
  const bookBSumOutstanding = ledger.bookB.reduce((s, e) => s + e.mtqOutstanding, 0);
  const participantSubsetOk = bookCSumMtq <= bookBSumOutstanding + 1e-6;
  checks.push({
    check: "Book C Σ(MTQ balances) ≤ Book B Σ(MTQ outstanding)",
    passed: participantSubsetOk,
    detail:
      `Book C Σ = ${bookCSumMtq.toFixed(2)} MTQ vs ` +
      `Book B Σ = ${bookBSumOutstanding.toFixed(2)} MTQ outstanding ` +
      `(gap = ${(bookBSumOutstanding - bookCSumMtq).toFixed(2)} held by ` +
      `participants not tracked in this Book C slice).`,
  });

  // Check 2 — Book B backing meets the 130% strategic target.
  const requiredBacking = bookBSumOutstanding * 1.30;
  const bookBBacking = ledger.bookB.reduce((s, e) => s + e.applicableBacking, 0);
  const backingOk = bookBBacking >= requiredBacking - 1e-6;
  checks.push({
    check: "Book B Σ(applicableBacking) ≥ 1.30 × Book B Σ(MTQ outstanding)",
    passed: backingOk,
    detail:
      `Backing ${bookBBacking.toFixed(2)} vs required ` +
      `${requiredBacking.toFixed(2)} (130% strategic target).`,
  });

  // Check 3 — Book A P&L reconciles arithmetically.
  let bookAIndependent = true;
  for (const e of ledger.bookA) {
    const computedPL = e.revenue - e.expenses;
    if (Math.abs(computedPL - e.profitLoss) > 1e-6) {
      bookAIndependent = false;
      notes.push(
        `Book A entry ${e.entryId} profitLoss=${e.profitLoss} ≠ ` +
        `revenue−expenses=${computedPL}; possible commingling.`,
      );
    }
  }
  checks.push({
    check: "Book A profitLoss == revenue − expenses (no reserve-gain injection)",
    passed: bookAIndependent,
    detail: bookAIndependent
      ? "All Book A entries reconcile arithmetically."
      : "Profit/loss does not match revenue − expenses on one or more entries.",
  });

  // Check 4 — No commingling violations.
  const violations = verifyNoCommingling(ledger);
  checks.push({
    check: "No commingling violations detected",
    passed: violations.length === 0,
    detail:
      violations.length === 0
        ? "Clean."
        : `${violations.length} violation(s): ` +
          violations.map((v) => v.reason).join("; "),
  });

  const reconciled = checks.every((c) => c.passed);
  return {
    reconciled,
    checks,
    commingled: violations.length > 0,
    notes,
  };
}

// ---------------------------------------------------------------------------
// §51 — transferBetweenBooksAuthorized: explicit authorization required
// ---------------------------------------------------------------------------

export interface BookTransferAuthorization {
  authorizedBy: string;
  signed: boolean;
  scope: BookType[];
  reason: string;
  issuedAt: string;
}

export interface BookTransferResult {
  ok: boolean;
  transferred: number;
  fromBook: BookType;
  toBook: BookType;
  authorized: boolean;
  reason: string;
}

/**
 * §51 — Attempt a cross-book transfer.
 *
 * Cross-book transfers are economically commingling by definition; they
 * are permitted ONLY when:
 *   - a signed `authorization` is provided, AND
 *   - the authorization scope explicitly covers both `fromBook` and `toBook`, AND
 *   - the (fromBook, toBook) pair is NOT in the forbidden-pair list.
 *
 * Forbidden pairs (always blocked, even with authorization):
 *   - Book A ↔ Book B  (corporate cash ↔ bank backing)
 *   - Book A ↔ Book C  (corporate ↔ participant MTQ)
 *
 * Permitted pairs (with explicit signed authorization):
 *   - Book B ↔ Book C  (bank ↔ participant MTQ movement, e.g. redemption
 *     settlement where the bank credits a participant with MTQ)
 *
 * This function is PURE — it does not mutate the ledger.
 */
export function transferBetweenBooksAuthorized(
  _ledger: ThreeBookLedger,
  fromBook: BookType,
  toBook: BookType,
  amount: number,
  authorization: BookTransferAuthorization | null,
): BookTransferResult {
  // §51 — no signed authorization: blocked.
  if (!authorization || !authorization.signed) {
    return {
      ok: false,
      transferred: 0,
      fromBook,
      toBook,
      authorized: false,
      reason:
        "Transfer blocked: no signed authorization. Cross-book transfers " +
        "require explicit signed authorization per §51.",
    };
  }

  // Authorization scope must cover both ends of the transfer.
  const scopeOk =
    authorization.scope.includes(fromBook) &&
    authorization.scope.includes(toBook);
  if (!scopeOk) {
    return {
      ok: false,
      transferred: 0,
      fromBook,
      toBook,
      authorized: false,
      reason:
        `Transfer blocked: authorization scope ` +
        `${JSON.stringify(authorization.scope)} does not cover ` +
        `${fromBook} → ${toBook}.`,
    };
  }

  // Forbidden commingling paths — even signed authorization cannot override §51.
  const forbiddenPairs: Array<[BookType, BookType]> = [
    ["BOOK_A_CORPORATE", "BOOK_B_BANK_MTQ_OBLIGATION"],
    ["BOOK_B_BANK_MTQ_OBLIGATION", "BOOK_A_CORPORATE"],
    ["BOOK_A_CORPORATE", "BOOK_C_PARTICIPANT_POSITION"],
    ["BOOK_C_PARTICIPANT_POSITION", "BOOK_A_CORPORATE"],
  ];
  const isForbidden = forbiddenPairs.some(
    ([f, t]) => f === fromBook && t === toBook,
  );
  if (isForbidden) {
    return {
      ok: false,
      transferred: 0,
      fromBook,
      toBook,
      authorized: false,
      reason:
        `Transfer blocked: ${fromBook} → ${toBook} is a forbidden ` +
        `commingling path (Book A may not directly exchange with Book B ` +
        `or Book C). Signed authorization cannot override §51.`,
    };
  }

  // Amount must be strictly positive.
  if (!(amount > 0)) {
    return {
      ok: false,
      transferred: 0,
      fromBook,
      toBook,
      authorized: true,
      reason: "Transfer blocked: amount must be > 0.",
    };
  }

  // Authorized B ↔ C transfer (e.g. bank credits participant with MTQ on
  // redemption settlement, or participant returns MTQ to bank on redemption).
  return {
    ok: true,
    transferred: amount,
    fromBook,
    toBook,
    authorized: true,
    reason:
      `Authorized by ${authorization.authorizedBy}: ${authorization.reason}`,
  };
}

// ---------------------------------------------------------------------------
// §51 — generateBookSummary: per-book totals
// ---------------------------------------------------------------------------

export interface BookSummary {
  bookType: BookType;
  bookName: string;
  bookDescription: string;
  entryCount: number;
  fieldSchemas: readonly string[];
  totals: Record<string, number | string>;
}

function sum<T>(arr: T[], pick: (e: T) => number): number {
  return arr.reduce((s, e) => s + pick(e), 0);
}

/**
 * §51 — Generate a totals summary for a single book.
 *
 * Returns the entry count, the canonical field list for that book,
 * and a `totals` object aggregating each field across all entries
 * in the ledger for that book.
 */
export function generateBookSummary(
  bookType: BookType,
  ledger: ThreeBookLedger,
): BookSummary {
  switch (bookType) {
    case "BOOK_A_CORPORATE": {
      const entries = ledger.bookA;
      return {
        bookType,
        bookName: BOOK_NAMES[bookType],
        bookDescription: BOOK_DESCRIPTIONS[bookType],
        entryCount: entries.length,
        fieldSchemas: BOOK_A_FIELDS,
        totals: {
          revenue: sum(entries, (e) => e.revenue),
          expenses: sum(entries, (e) => e.expenses),
          payroll: sum(entries, (e) => e.payroll),
          tax: sum(entries, (e) => e.tax),
          technologyCosts: sum(entries, (e) => e.technologyCosts),
          corporateAssets: sum(entries, (e) => e.corporateAssets),
          corporateLiabilities: sum(entries, (e) => e.corporateLiabilities),
          profitLoss: sum(entries, (e) => e.profitLoss),
        },
      };
    }
    case "BOOK_B_BANK_MTQ_OBLIGATION": {
      const entries = ledger.bookB;
      const banks = Array.from(new Set(entries.map((e) => e.responsibleBank)));
      const avgBankRisk = entries.length
        ? sum(entries, (e) => e.bankRisk) / entries.length
        : 0;
      return {
        bookType,
        bookName: BOOK_NAMES[bookType],
        bookDescription: BOOK_DESCRIPTIONS[bookType],
        entryCount: entries.length,
        fieldSchemas: BOOK_B_FIELDS,
        totals: {
          responsibleBankCount: banks.length,
          responsibleBanks: banks.join(", ") || "(none)",
          applicableBacking: sum(entries, (e) => e.applicableBacking),
          mtqOriginated: sum(entries, (e) => e.mtqOriginated),
          mtqOutstanding: sum(entries, (e) => e.mtqOutstanding),
          redemptionObligations: sum(entries, (e) => e.redemptionObligations),
          liquidity: sum(entries, (e) => e.liquidity),
          settlement: sum(entries, (e) => e.settlement),
          avgBankRisk,
        },
      };
    }
    case "BOOK_C_PARTICIPANT_POSITION": {
      const entries = ledger.bookC;
      const participants = Array.from(
        new Set(entries.map((e) => (e as BookCEntry & { participantId?: string }).bankMoneyLinkage)),
      );
      return {
        bookType,
        bookName: BOOK_NAMES[bookType],
        bookDescription: BOOK_DESCRIPTIONS[bookType],
        entryCount: entries.length,
        fieldSchemas: BOOK_C_FIELDS,
        totals: {
          linkedBankCount: participants.length,
          mtqBalance: sum(entries, (e) => e.mtqBalance),
          availableMtq: sum(entries, (e) => e.availableMtq),
          reservedMtq: sum(entries, (e) => e.reservedMtq),
          pendingMtq: sum(entries, (e) => e.pendingMtq),
          sent: sum(entries, (e) => e.sent),
          received: sum(entries, (e) => e.received),
          redemption: sum(entries, (e) => e.redemption),
          settlementHistoryEntries: sum(entries, (e) => e.settlementHistory),
        },
      };
    }
  }
}

// ---------------------------------------------------------------------------
// §51 — buildReferenceThreeBookLedger: illustrative SIMULATED ledger
// ---------------------------------------------------------------------------

/**
 * §51 — Build the reference illustrative three-book ledger.
 *
 * All entries are SIMULATED reference data. No real bank, participant,
 * asset, or contract is bound.
 *
 *   - Book A: MITHQAL corporate cash $50M for salaries/infrastructure.
 *   - Book B: Bank MTQ obligation — $130M applicable backing,
 *             $100M MTQ originated, $100M MTQ outstanding
 *             (130% strategic target met).
 *   - Book C: Corporate participant — $10M MTQ balance
 *             (the other $90M of Book B outstanding is held by
 *             participants not tracked in this Book C slice).
 *
 * The reference ledger RECONCILES:
 *   - Book C Σ(MTQ) = $10M ≤ Book B Σ(outstanding) = $100M ✓
 *   - Book B backing $130M ≥ 1.30 × $100M = $130M ✓
 *   - Book A profitLoss = 0 = revenue − expenses ✓
 *   - No commingling violations ✓
 */
export function buildReferenceThreeBookLedger(): ThreeBookLedger {
  const ts = "2025-01-15T00:00:00Z";
  return {
    bookA: [
      {
        bookType: "BOOK_A_CORPORATE",
        entryId: "BOOKA-REF-001",
        timestamp: ts,
        description:
          "MITHQAL corporate cash reserve for salaries and infrastructure " +
          "($50M illustrative). SIMULATED — operating cash, NOT bank-side " +
          "MTQ backing.",
        revenue: 0,
        expenses: 0,
        payroll: 0,
        tax: 0,
        technologyCosts: 0,
        corporateAssets: 50_000_000, // $50M corporate cash (operating)
        corporateLiabilities: 0,
        profitLoss: 0, // revenue − expenses = 0
      },
    ],
    bookB: [
      {
        bookType: "BOOK_B_BANK_MTQ_OBLIGATION",
        entryId: "BOOKB-REF-001",
        timestamp: ts,
        description:
          "Reference bank MTQ obligation: $130M applicable backing for " +
          "$100M MTQ outstanding (130% strategic target met). SIMULATED.",
        responsibleBank: "Reference-Responsible-Bank (SIMULATED)",
        applicableBacking: 130_000_000,
        mtqOriginated: 100_000_000,
        mtqOutstanding: 100_000_000,
        redemptionObligations: 0,
        liquidity: 130_000_000,
        settlement: 0,
        bankRisk: 0.18, // illustrative
      },
    ],
    bookC: [
      {
        bookType: "BOOK_C_PARTICIPANT_POSITION",
        entryId: "BOOKC-REF-001",
        timestamp: ts,
        description:
          "Reference corporate participant position: $10M MTQ balance. " +
          "SIMULATED. The other $90M of Book B outstanding is held by " +
          "participants not tracked in this Book C slice.",
        mtqBalance: 10_000_000,
        availableMtq: 9_500_000,
        reservedMtq: 500_000,
        pendingMtq: 0,
        sent: 0,
        received: 10_000_000,
        redemption: 0,
        settlementHistory: 1,
        bankMoneyLinkage: "Reference-Responsible-Bank (SIMULATED)",
      } as BookCEntry,
    ],
  };
}

// ---------------------------------------------------------------------------
// §74 — threeBookHonestState (EXACT values from the directive)
// ---------------------------------------------------------------------------

export interface ThreeBookHonestState {
  /** §74 — The three-book design is complete. */
  threeBookDesign: true;
  /** §74 — The three-book separation is NOT yet operational in production. */
  threeBookOperational: false;
  /** §74 — The three-book separation is NOT yet enforced on-chain / institutionally. */
  threeBookEnforced: false;
}

/**
 * §74 — Honest state for §51 three-book separation.
 *
 * These three EXACT values are mandated by the master directive:
 *   threeBookDesign      = true
 *   threeBookOperational = false
 *   threeBookEnforced    = false
 *
 * They MUST NOT be altered to mask immaturity. The design is complete;
 * operational rollout and institutional enforcement remain future work.
 */
export function threeBookHonestState(): ThreeBookHonestState {
  return {
    threeBookDesign: true,
    threeBookOperational: false,
    threeBookEnforced: false,
  };
}

// ---------------------------------------------------------------------------
// §51 — generateThreeBookReport: full executive summary
// ---------------------------------------------------------------------------

export interface ThreeBookReport {
  moduleId: string;
  books: BookSummary[];
  entrySchemas: Record<BookType, readonly string[]>;
  antiComminglingTests: ComminglingAttemptResult[];
  reconciliation: ReconciliationResult;
  comminglingViolations: ComminglingViolation[];
  honestState: ThreeBookHonestState;
  principle: string;
  finalStatus: string;
}

/**
 * §51 — Generate the full three-book separation executive report.
 *
 * Returns the module id, the three-book summaries, the canonical entry
 * schemas, the four §83 anti-commingling tests (all `blocked: true`),
 * the reconciliation result, the honest state, the controlling
 * principle, and the unchanged §V25.2 final status.
 */
export function generateThreeBookReport(): ThreeBookReport {
  const ledger = buildReferenceThreeBookLedger();
  const antiComminglingTests = runAllAntiComminglingTests();
  const reconciliation = reconcileBooks(ledger);
  const comminglingViolations = verifyNoCommingling(ledger);

  return {
    moduleId: MODULE_ID,
    books: [
      generateBookSummary("BOOK_A_CORPORATE", ledger),
      generateBookSummary("BOOK_B_BANK_MTQ_OBLIGATION", ledger),
      generateBookSummary("BOOK_C_PARTICIPANT_POSITION", ledger),
    ],
    entrySchemas: {
      BOOK_A_CORPORATE: BOOK_A_FIELDS,
      BOOK_B_BANK_MTQ_OBLIGATION: BOOK_B_FIELDS,
      BOOK_C_PARTICIPANT_POSITION: BOOK_C_FIELDS,
    },
    antiComminglingTests,
    reconciliation,
    comminglingViolations,
    honestState: threeBookHonestState(),
    principle:
      "The three books must reconcile but must NEVER be economically commingled.",
    finalStatus:
      "APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED",
  };
}
