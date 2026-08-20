// ============================================================================
// §V25.2 — CONTRADICTION SCAN (§77)
// ============================================================================
// Implements §77 of the master directive: search the entire project for the
// 17 architectural contradiction patterns listed.
//
// The expected result per §77: ZERO unresolved architectural contradictions.
//
// This module performs a programmatic scan of src/lib/*.ts for the 17 patterns.
// For each pattern, it reports:
//   - occurrences found
//   - whether each is a TRUE contradiction (violates current architecture) or
//     a FALSE POSITIVE (e.g., the pattern appears in a "MUST NOT" rule that
//     correctly prohibits it, or in an honest-state declaration showing false)
//   - resolution status: RESOLVED (false positive or corrected) or UNRESOLVED
//
// HONEST STATE: this is a static code scan, not a runtime assertion. It scans
// the library modules; it does NOT validate live runtime behavior.
// ============================================================================

export const MODULE_ID = "v25.2-contradiction-scan-1.0";
export const SECTION = 77;

// §77 — the 17 contradiction patterns to scan for
export interface ContradictionPattern {
  id: string;
  pattern: string;
  description: string;
  expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION" | "MUST_APPEAR_ONLY_AS_PROHIBITION_OR_FALSE";
  regex: RegExp;
}

export const CONTRADICTION_PATTERNS: ContradictionPattern[] = [
  {
    id: "C01",
    pattern: "MITHQAL owns backing",
    description: "MITHQAL must NOT own MTQ backing (§8: MITHQAL_OWNS_MTQ_BACKING = FALSE)",
    expectedResolution: "MUST_APPEAR_ONLY_AS_PROHIBITION_OR_FALSE",
    regex: /MITHQAL[_\s]+owns[_\s]+backing|MITHQAL_OWNS_MTQ_BACKING\s*[:=]\s*true/gi,
  },
  {
    id: "C02",
    pattern: "MITHQAL guarantees MTQ",
    description: "MITHQAL must NOT financially guarantee MTQ (§8: MITHQAL_FINANCIALLY_GUARANTEES_MTQ = FALSE)",
    expectedResolution: "MUST_APPEAR_ONLY_AS_PROHIBITION_OR_FALSE",
    regex: /MITHQAL[_\s]+guarantees[_\s]+MTQ|MITHQAL_FINANCIALLY_GUARANTEES_MTQ\s*[:=]\s*true/gi,
  },
  {
    id: "C03",
    pattern: "MITHQAL custody of backing",
    description: "MITHQAL must NOT custody MTQ backing by default (§8)",
    expectedResolution: "MUST_APPEAR_ONLY_AS_PROHIBITION_OR_FALSE",
    regex: /MITHQAL[_\s]+custod(?:y|ies)[_\s]+(?:mtq[_\s]+)?backing|MITHQAL_CUSTODIES_MTQ_BACKING_BY_DEFAULT\s*[:=]\s*true/gi,
  },
  {
    id: "C04",
    pattern: "Bank unrestricted minting",
    description: "Banks may NOT mint without MITHQAL authorization (§10: Bank requests. MITHQAL authorizes.)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /bank[_\s]+(?:can|may|shall)[_\s]+mint[_\s]+without[_\s]+authorization/gi,
  },
  {
    id: "C05",
    pattern: "MTQ USD peg",
    description: "MTQ must NOT be described as a USD peg (§6, §66: PAR must NOT become a hidden USD peg)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /MTQ[_\s]+is[_\s]+a[_\s]+USD[_\s]+peg|MTQ[_\s]+pegged[_\s]+to[_\s]+USD|MTQ[_\s]+USD[_\s]+peg\s*=\s*true/gi,
  },
  {
    id: "C06",
    pattern: "MTQ retail",
    description: "MTQ must NOT be a retail cryptocurrency (§6, §92: Do NOT add retail MTQ)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /MTQ[_\s]+is[_\s]+a[_\s]+retail[_\s]+(?:cryptocurrency|token|product)/gi,
  },
  {
    id: "C07",
    pattern: "Exchange functionality",
    description: "MITHQAL must NOT be a trading venue/exchange (§6, §46, §92)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /MITHQAL[_\s]+operates[_\s]+an[_\s]+exchange|MITHQAL[_\s]+is[_\s]+a[_\s]+trading[_\s]+venue/gi,
  },
  {
    id: "C08",
    pattern: "SWIFT replacement",
    description: "MITHQAL must NOT be described as a SWIFT replacement (§14)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /MITHQAL[_\s]+replaces[_\s]+SWIFT|MITHQAL[_\s]+is[_\s]+a[_\s]+SWIFT[_\s]+replacement/gi,
  },
  {
    id: "C09",
    pattern: "Bank core replacement",
    description: "MITHQAL must NOT require core banking replacement (§11, §85, §92)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /MITHQAL[_\s]+requires[_\s]+core[_\s]+banking[_\s]+replacement|MITHQAL[_\s]+replaces[_\s]+core[_\s]+banking/gi,
  },
  {
    id: "C10",
    pattern: "Stablecoin automatically reserve",
    description: "Stablecoins must NOT automatically be counted as reserve (§69: settlement ≠ reserve)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /stablecoin[_\s]+automatically[_\s]+(?:counted[_\s]+as|is)[_\s]+reserve/gi,
  },
  {
    id: "C11",
    pattern: "Settlement automatically reserve",
    description: "Settlement assets must NOT automatically be counted as reserve (§69)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /settlement[_\s]+automatically[_\s]+(?:counted[_\s]+as|is)[_\s]+reserve/gi,
  },
  {
    id: "C12",
    pattern: "Liquidity automatically backing",
    description: "Liquidity must NOT automatically be counted as backing (§58)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /liquidity[_\s]+automatically[_\s]+(?:counted[_\s]+as|is)[_\s]+backing/gi,
  },
  {
    id: "C13",
    pattern: "Foundation mint authority",
    description: "The Foundation must NOT have mint authority (§2.1, §94)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /Foundation[_\s]+(?:can|may|shall)[_\s]+mint[_\s]+MTQ|Foundation[_\s]+mint[_\s]+authority\s*=\s*true/gi,
  },
  {
    id: "C14",
    pattern: "Holding Company backing",
    description: "Holding Company must NOT own/backing MTQ (§3, §94)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /Holding[_\s]+Company[_\s]+(?:owns|provides|guarantees)[_\s]+(?:MTQ[_\s]+)?backing/gi,
  },
  {
    id: "C15",
    pattern: "Technology Company financial authority",
    description: "Technology Company must NOT have financial authority (§5, §94)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /Technology[_\s]+Company[_\s]+(?:guarantees|financially[_\s]+authorizes|owns[_\s]+backing)/gi,
  },
  {
    id: "C16",
    pattern: "Operating Company proprietary reserve trading",
    description: "Operating Company must NOT do proprietary reserve trading (§4, §67, §92)",
    expectedResolution: "MUST_NOT_APPEAR_AS_ASSERTION",
    regex: /Operating[_\s]+Company[_\s]+proprietary[_\s]+reserve[_\s]+trading|Operating[_\s]+Company[_\s]+proprietary[_\s]+FX[_\s]+trading/gi,
  },
  {
    id: "C17",
    pattern: "Historical reserve parameters overriding current policy",
    description: "Historical configs (120%, 15%+5% tokenized, 3.5% digital, 60% cap) must NOT override current 130%/80/18/2/20% (§49, §75, §76)",
    expectedResolution: "MUST_APPEAR_ONLY_AS_PROHIBITION_OR_FALSE",
    regex: /RR[_\s]*strategic[_\s]*[:=][_\s]*1\.20|reserveTarget\s*=\s*0\.15.*tokenizedGold\s*=\s*0\.05|digitalTarget\s*=\s*0\.035|perCurrencyCap\s*=\s*0\.60/gi,
  },
];

// Scan result for a single pattern in a single file
export interface PatternFileMatch {
  file: string;
  line: number;
  matchedText: string;
  context: string; // the full line for review
  classifiedAs: "TRUE_CONTRADICTION" | "FALSE_POSITIVE_PROHIBITION" | "FALSE_POSITIVE_FALSE_STATE";
  resolutionNote: string;
}

export interface PatternScanResult {
  pattern: ContradictionPattern;
  totalOccurrences: number;
  trueContradictions: number;
  falsePositives: number;
  matches: PatternFileMatch[];
  status: "RESOLVED" | "UNRESOLVED";
}

// Classify a match: is it a TRUE contradiction, or a false positive
// (the pattern appears in a "MUST NOT" rule, an honest-state "false" declaration,
//  or a comment explaining the prohibition)?
function classifyMatch(matchedText: string, fullLine: string): PatternFileMatch["classifiedAs"] {
  const lower = fullLine.toLowerCase();
  // False positive: line declares the value as false / MUST NOT / NOT / prohibited
  if (
    /\bmust\s+not\b/i.test(fullLine) ||
    /\bnot\s+own\b/i.test(fullLine) ||
    /\bnot\s+custod/i.test(fullLine) ||
    /\bdoes\s+not\b/i.test(fullLine) ||
    /\bnever\b/i.test(fullLine) ||
    /\bprohibit/i.test(fullLine) ||
    /\bexcluded?\b/i.test(fullLine) ||
    /=\s*false\b/i.test(fullLine) ||
    /:\s*false\b/i.test(fullLine) ||
    /honest/i.test(fullLine) ||
    /superseded/i.test(fullLine) ||
    /historical/i.test(fullLine) ||
    /non-controlling/i.test(fullLine) ||
    /no_/i.test(matchedText) ||
    /NO\b/i.test(matchedText)
  ) {
    return "FALSE_POSITIVE_PROHIBITION";
  }
  // False positive: appears in a contradiction-scan pattern definition itself
  // (the regex/definition lines that list the patterns to scan for)
  if (
    /contradiction/i.test(fullLine) ||
    /\bpattern\b/i.test(fullLine) ||
    /\bregex\b/i.test(fullLine) ||
    /expectedResolution/i.test(fullLine) ||
    /description:\s/i.test(fullLine) ||
    /MUST_NOT_APPEAR/i.test(fullLine) ||
    /MUST_APPEAR_ONLY/i.test(fullLine)
  ) {
    return "FALSE_POSITIVE_PROHIBITION";
  }
  return "TRUE_CONTRADICTION";
}

// Scan a single file's content for all patterns
export function scanFileContent(
  file: string,
  content: string,
): PatternFileMatch[] {
  const matches: PatternFileMatch[] = [];
  const lines = content.split("\n");
  for (const pattern of CONTRADICTION_PATTERNS) {
    // Reset regex lastIndex for global regex reuse
    pattern.regex.lastIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      pattern.regex.lastIndex = 0;
      const m = pattern.regex.exec(line);
      if (m) {
        const matchedText = m[0];
        const classifiedAs = classifyMatch(matchedText, line);
        matches.push({
          file,
          line: i + 1,
          matchedText,
          context: line.trim().slice(0, 200),
          classifiedAs,
          resolutionNote:
            classifiedAs === "TRUE_CONTRADICTION"
              ? "UNRESOLVED — requires correction"
              : classifiedAs === "FALSE_POSITIVE_PROHIBITION"
                ? "RESOLVED — pattern appears in a prohibition/false-state/honest-state context"
                : "RESOLVED — pattern appears in a non-controlling/historical context",
        });
      }
    }
  }
  return matches;
}

// Run the full scan across provided file contents (caller passes {file, content}[])
export interface ScanInput {
  file: string;
  content: string;
}

export interface ContradictionScanReport {
  moduleId: string;
  section: number;
  patternsScanned: number;
  filesScanned: number;
  totalOccurrences: number;
  trueContradictions: number;
  falsePositives: number;
  unresolvedContradictions: number;
  expectedResult: "ZERO_UNRESOLVED_ARCHITECTURAL_CONTRADICTIONS";
  expectedResultMet: boolean;
  perPatternResults: PatternScanResult[];
  honestState: {
    staticCodeScan: boolean;
    runtimeAssertion: false;
    note: string;
  };
  finalStatus: string;
  finalStatusColor: "EMERALD" | "AMBER" | "RED";
}

export function runContradictionScan(inputs: ScanInput[]): ContradictionScanReport {
  const allMatches: PatternFileMatch[] = [];
  for (const { file, content } of inputs) {
    const matches = scanFileContent(file, content);
    allMatches.push(...matches);
  }

  const perPattern: PatternScanResult[] = CONTRADICTION_PATTERNS.map((pattern) => {
    const matches = allMatches.filter((m) => {
      // match by checking if the matched text matches this pattern's regex
      pattern.regex.lastIndex = 0;
      return pattern.regex.test(m.matchedText) || pattern.regex.test(m.context);
    });
    const trueContradictions = matches.filter((m) => m.classifiedAs === "TRUE_CONTRADICTION").length;
    const falsePositives = matches.filter((m) => m.classifiedAs !== "TRUE_CONTRADICTION").length;
    return {
      pattern,
      totalOccurrences: matches.length,
      trueContradictions,
      falsePositives,
      matches,
      status: trueContradictions === 0 ? "RESOLVED" : "UNRESOLVED",
    };
  });

  const totalOccurrences = perPattern.reduce((s, p) => s + p.totalOccurrences, 0);
  const trueContradictions = perPattern.reduce((s, p) => s + p.trueContradictions, 0);
  const falsePositives = perPattern.reduce((s, p) => s + p.falsePositives, 0);
  const unresolved = perPattern.filter((p) => p.status === "UNRESOLVED").length;

  return {
    moduleId: MODULE_ID,
    section: SECTION,
    patternsScanned: CONTRADICTION_PATTERNS.length,
    filesScanned: inputs.length,
    totalOccurrences,
    trueContradictions,
    falsePositives,
    unresolvedContradictions: unresolved,
    expectedResult: "ZERO_UNRESOLVED_ARCHITECTURAL_CONTRADICTIONS",
    expectedResultMet: unresolved === 0,
    perPatternResults: perPattern,
    honestState: {
      staticCodeScan: true,
      runtimeAssertion: false,
      note: "Static code scan of src/lib/*.ts. Does not validate runtime behavior or config files. False positives (prohibitions, honest-state declarations) are classified and resolved.",
    },
    finalStatus: unresolved === 0
      ? "§77 CONTRADICTION SCAN — ZERO UNRESOLVED ARCHITECTURAL CONTRADICTIONS (target met)"
      : `§77 CONTRADICTION SCAN — ${unresolved} UNRESOLVED CONTRADICTION(S) REMAIN (target NOT met)`,
    finalStatusColor: unresolved === 0 ? "EMERALD" : "RED",
  };
}

// Convenience: scan a single content string (for API use without file IO)
export function scanSingleContent(content: string, file = "<inline>"): ContradictionScanReport {
  return runContradictionScan([{ file, content }]);
}
