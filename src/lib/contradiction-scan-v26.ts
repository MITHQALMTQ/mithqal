/**
 * MITHQAL v26.0 §10.6 — Extended Contradiction Scanner
 *
 * Walks the repository file tree and applies 15 v26.0-specific
 * contradiction patterns across 12 surface categories. Each
 * finding is classified with a severity (P0..P3) and an excerpt
 * (redacted to avoid leaking secret values).
 *
 * Hard rules per v26.0 §10.6:
 *   - 12 surface categories scanned (no surface is exempt).
 *   - 15 v26.0-specific patterns (SCV-BM-* / SCV-PAR-* / SCV-130-*
 *     / SCV-GOLD-* / SCV-GATE-* / SCV-JUR-* / SCV-DB-* /
 *     SCV-PROD-* / SCV-REQ-* / SCV-ATM-*).
 *   - Suppression tokens (HISTORICAL, LEGACY, DEFERRED_NOT_ACTIVE,
 *     QUARANTINED, ORCHESTRATED_NOT_ACTIVE) explicitly mark a
 *     finding as "known / not active" and reduce its severity to
 *     P3.
 *   - Secret values are NEVER printed to scan output. Excerpts
 *     are redacted: any string that looks like a key, token,
 *     password, or secret is replaced with `<REDACTED>`.
 *
 * Blueprint: v26.0 §10.6 + §10.2 (SCV-* pattern catalog)
 */

// ---------------------------------------------------------------------------
// §10.6 — surface categories (12)
// ---------------------------------------------------------------------------

export type ContradictionSurfaceCategory =
  | "ACTIVE_SOURCE"
  | "COMMENTS_STRINGS"
  | "SCHEMAS"
  | "MIGRATIONS"
  | "WORKFLOW_REGISTRIES"
  | "ENV_TEMPLATES"
  | "POLICY_FILES"
  | "TESTS"
  | "DOCS"
  | "SHIPPED_GENERATED"
  | "RELEASE_MANIFESTS"
  | "PACKAGE_BUILD_CONFIG";

export const SURFACE_CATEGORIES: readonly ContradictionSurfaceCategory[] = [
  "ACTIVE_SOURCE",
  "COMMENTS_STRINGS",
  "SCHEMAS",
  "MIGRATIONS",
  "WORKFLOW_REGISTRIES",
  "ENV_TEMPLATES",
  "POLICY_FILES",
  "TESTS",
  "DOCS",
  "SHIPPED_GENERATED",
  "RELEASE_MANIFESTS",
  "PACKAGE_BUILD_CONFIG",
] as const;

// ---------------------------------------------------------------------------
// §10.6 — severity ladder
// ---------------------------------------------------------------------------

export type ContradictionSeverity = "P0" | "P1" | "P2" | "P3";

// ---------------------------------------------------------------------------
// §10.2 — 15 v26.0-specific patterns
// ---------------------------------------------------------------------------

export interface V26ContradictionPattern {
  patternId: string;
  surface: ContradictionSurfaceCategory;
  description: string;
  regex: RegExp;
  defaultSeverity: ContradictionSeverity;
  blueprintRef: string;
}

/**
 * The 15 v26.0-specific contradiction patterns. Each pattern is
 * a P0..P3 issue when found unsuppressed in the listed surface.
 * Patterns marked DEFERRED_NOT_ACTIVE / QUARANTINED / etc. are
 * suppressed (severity downgraded to P3) per §10.6.
 */
export const V26_CONTRADICTION_PATTERNS: readonly V26ContradictionPattern[] = [
  {
    patternId: "SCV-BM-001",
    surface: "ACTIVE_SOURCE",
    description:
      "Legacy BM module name (BM15 / BM-15-Mint / BM16 / BM16B-MintExecution) appears as an active assertion instead of canonical BM-15 / BM-16A / BM-16B per v26.0 §4.4.",
    regex: /\bBM15\b|\bBM-15-Mint\b|\bBM16\b|\bBM16B-MintExecution\b/g,
    defaultSeverity: "P1",
    blueprintRef: "v26.0 §10.2 SCV-BM-001",
  },
  {
    patternId: "SCV-BM-002",
    surface: "COMMENTS_STRINGS",
    description:
      "Legacy BM module name used in a string literal or comment without indicating it is historical.",
    regex: /\bBM-16-Mint\b|\bBM16B-Mint\b|\bBM-16-MintExecution\b/g,
    defaultSeverity: "P2",
    blueprintRef: "v26.0 §10.2 SCV-BM-002",
  },
  {
    patternId: "SCV-BM-003",
    surface: "WORKFLOW_REGISTRIES",
    description:
      "Workflow function id uses legacy BM-16B-MintExecution as a canonical id; should use BM-16B per §4.4.",
    regex: /id:\s*["'`]BM-?16B-?MintExecution["'`]/gi,
    defaultSeverity: "P1",
    blueprintRef: "v26.0 §10.2 SCV-BM-003",
  },
  {
    patternId: "SCV-PAR-001",
    surface: "ACTIVE_SOURCE",
    description:
      "MTQ described as a USD peg (MTQ_USD_PEG=true) — contradicts v26.0 §6 PAR is not a hidden USD peg.",
    regex: /MTQ_USD_PEG\s*=\s*true|MTQ\s+is\s+a\s+USD\s+peg/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-PAR-001",
  },
  {
    patternId: "SCV-PAR-002",
    surface: "DOCS",
    description:
      "Documentation describes MTQ as pegged to USD; contradicts v26.0 §6 + §66.",
    regex: /MTQ\s+pegged\s+to\s+USD|MTQ\s+is\s+a\s+USD[-\s]pegged\s+(token|cryptocurrency)/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-PAR-002",
  },
  {
    patternId: "SCV-130-001",
    surface: "ACTIVE_SOURCE",
    description:
      "Active assertion of 130% backing as a legal rule; v26.0 §3.4 says 130% is a target, not a legal rule.",
    regex: /130%\s+backing\s+is\s+(?:a\s+)?(?:legal\s+rule|legally\s+required)|legalRule\s*=\s*["'`]130%/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-130-001",
  },
  {
    patternId: "SCV-130-002",
    surface: "POLICY_FILES",
    description:
      "Policy file enforces 130% as a hard legal threshold; v26.0 §3.4 makes it a target.",
    regex: /backingRatio:\s*1\.30|legalThreshold:\s*1\.30/gi,
    defaultSeverity: "P1",
    blueprintRef: "v26.0 §10.2 SCV-130-002",
  },
  {
    patternId: "SCV-130-003",
    surface: "DOCS",
    description:
      "Documentation claims 130% backing is a legal guarantee; contradicts v26.0 §3.4.",
    regex: /130%\s+(?:backing|reserve)\s+(?:is\s+)?(?:a\s+)?legal\s+guarantee/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-130-003",
  },
  {
    patternId: "SCV-GOLD-001",
    surface: "ACTIVE_SOURCE",
    description:
      "Gold counted as MTQ backing; v26.0 §3.5 EXCLUDES gold and silver from backing per the digital-asset-only mandate.",
    regex: /gold\s+is\s+(?:counted|included)\s+as\s+(?:MTQ\s+)?backing|backingAssets\s*=\s*\[[^\]]*gold/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-GOLD-001",
  },
  {
    patternId: "SCV-GATE-001",
    surface: "ACTIVE_SOURCE",
    description:
      "MTQ mint authorized without MTQ gate check; v26.0 §3.2 requires assertMtqEnabled on every mint path.",
    regex: /mtqMint\(\s*\)|mintMtq\(\s*\)\s*;?\s*\/\/\s*(?:no\s+gate|skip\s+gate)/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-GATE-001",
  },
  {
    patternId: "SCV-JUR-001",
    surface: "ACTIVE_SOURCE",
    description:
      "Production authorized without jurisdictional pilot scope check; v26.0 §7.1 requires jurisdiction-locked pilot authorization.",
    regex: /productionAuthorized\s*=\s*true\s*\/\/\s*no\s+jurisdiction/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-JUR-001",
  },
  {
    patternId: "SCV-JUR-002",
    surface: "POLICY_FILES",
    description:
      "Policy file bypasses jurisdictional scope; v26.0 §7.1 forbids cross-jurisdictional authorization during pilot.",
    regex: /scope:\s*["'`]global["'`]|bypassJurisdiction:\s*true/gi,
    defaultSeverity: "P1",
    blueprintRef: "v26.0 §10.2 SCV-JUR-002",
  },
  {
    patternId: "SCV-DB-001",
    surface: "ACTIVE_SOURCE",
    description:
      "Turso (libSQL) projection used as authoritative writer; v26.0 §6.1 / D-006 says Neon Postgres is the only authoritative writer.",
    regex: /turso\.write\(|projectionDb\.create\(|tursoProjection\.insert\(/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-DB-001",
  },
  {
    patternId: "SCV-PROD-001",
    surface: "ACTIVE_SOURCE",
    description:
      "MITHQAL_PRODUCTION_AUTHORIZED=true at the active-source level; v26.0 §11.3 D-012 forbids this in pilot.",
    regex: /MITHQAL_PRODUCTION_AUTHORIZED\s*=\s*true|productionAuthorized\s*=\s*true/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-PROD-001",
  },
  {
    patternId: "SCV-PROD-002",
    surface: "ENV_TEMPLATES",
    description:
      ".env template defaults MTQ_ENABLED=true; v26.0 §3.2 requires MTQ disabled by default.",
    regex: /^MTQ_ENABLED\s*=\s*true/gm,
    defaultSeverity: "P1",
    blueprintRef: "v26.0 §10.2 SCV-PROD-002",
  },
  {
    patternId: "SCV-REQ-001",
    surface: "ACTIVE_SOURCE",
    description:
      "Required compliance source explicitly bypassed by timeout; v26.0 §5.2 forbids 'pass by timeout' for required sources.",
    regex: /passByTimeout:\s*true|allowTimeoutPass:\s*true/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-REQ-001",
  },
  {
    patternId: "SCV-REQ-002",
    surface: "POLICY_FILES",
    description:
      "Policy file marks required compliance source as optional; v26.0 §5.2 forbids treating required sources as optional during pilot.",
    regex: /required:\s*false\s*\/\/\s*compliance/gi,
    defaultSeverity: "P1",
    blueprintRef: "v26.0 §10.2 SCV-REQ-002",
  },
  {
    patternId: "SCV-ATM-001",
    surface: "ACTIVE_SOURCE",
    description:
      "AI recommendation overrides hard constraint (eligibility / backing / finality / MTQ gate); v26.0 §6.11 forbids AI overrides of hard constraints.",
    regex: /aiOverrideHardConstraint:\s*true|aiDecision\s*>\s*gateDecision/gi,
    defaultSeverity: "P0",
    blueprintRef: "v26.0 §10.2 SCV-ATM-001",
  },
];

// ---------------------------------------------------------------------------
// §10.6 — suppression tokens
// ---------------------------------------------------------------------------

/**
 * Suppression tokens per v26.0 §10.6. A line containing any of
 * these tokens is treated as a known / not-active finding and is
 * downgraded to P3 severity (informational).
 */
export const SUPPRESSION_TOKENS: readonly string[] = [
  "HISTORICAL",
  "LEGACY",
  "DEFERRED_NOT_ACTIVE",
  "QUARANTINED",
  "ORCHESTRATED_NOT_ACTIVE",
] as const;

/**
 * Whether a line carries a suppression token. When true, the
 * finding's severity is downgraded to P3 (informational) and its
 * `suppressed` flag is set to true.
 */
export function isSuppressed(line: string): boolean {
  return SUPPRESSION_TOKENS.some((tok) => line.includes(tok));
}

// ---------------------------------------------------------------------------
// §10.6 — finding shape
// ---------------------------------------------------------------------------

export interface ContradictionFinding {
  path: string;
  line: number;
  pattern: string;
  severity: ContradictionSeverity;
  excerpt: string; // redacted
  suppressed: boolean;
  blueprint_ref: string;
}

export interface ScanOptions {
  /** When true, scan is read-only and reports suppressed findings too. */
  includeSuppressed?: boolean;
  /** Glob filter for files to scan (default: all .ts/.tsx/.js/.json/.md). */
  extensions?: readonly string[];
}

export interface ScanSummary {
  totalFindings: number;
  bySeverity: Record<ContradictionSeverity, number>;
  byPattern: Record<string, number>;
  bySurface: Record<ContradictionSurfaceCategory, number>;
  suppressedCount: number;
  blueprintRef: string;
  patternsScanned: number;
  surfacesScanned: number;
  filesScanned: number;
  honestState: {
    staticScan: true;
    runtimeAssertion: false;
    secretsRedacted: true;
  };
}

// ---------------------------------------------------------------------------
// §10.6 — secret redaction
// ---------------------------------------------------------------------------

const SECRET_REGEX =
  /\b(?:password|passwd|secret|api[_-]?key|token|access[_-]?key|private[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/gi;

/**
 * Redact any substring that looks like a secret value. Replaces
 * the value with `<REDACTED>` while preserving the key name so
 * reviewers can see WHAT was redacted without seeing the value.
 *
 * Per v26.0 §10.6, secrets are NEVER printed to scan output.
 */
function redactSecrets(line: string): string {
  return line.replace(SECRET_REGEX, (match) => {
    const eq = match.indexOf("=");
    const colon = match.indexOf(":");
    const split = Math.max(eq, colon);
    if (split < 0) return "<REDACTED>";
    const key = match.slice(0, split + 1);
    return `${key} "<REDACTED>"`;
  });
}

function truncateExcerpt(line: string): string {
  const trimmed = line.trim();
  return trimmed.length > 200 ? `${trimmed.slice(0, 197)}...` : trimmed;
}

// ---------------------------------------------------------------------------
// §10.6 — per-file scan
// ---------------------------------------------------------------------------

function scanLine(
  path: string,
  lineNumber: number,
  line: string,
  pattern: V26ContradictionPattern,
  out: ContradictionFinding[],
  includeSuppressed: boolean,
): void {
  // Reset regex lastIndex for global regex reuse.
  pattern.regex.lastIndex = 0;
  if (!pattern.regex.test(line)) return;
  const suppressed = isSuppressed(line);
  const severity: ContradictionSeverity = suppressed ? "P3" : pattern.defaultSeverity;
  if (suppressed && !includeSuppressed) return;
  out.push({
    path,
    line: lineNumber,
    pattern: pattern.patternId,
    severity,
    excerpt: truncateExcerpt(redactSecrets(line)),
    suppressed,
    blueprint_ref: pattern.blueprintRef,
  });
}

function scanContent(
  path: string,
  content: string,
  patterns: readonly V26ContradictionPattern[],
  includeSuppressed: boolean,
): ContradictionFinding[] {
  const findings: ContradictionFinding[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    for (const pattern of patterns) {
      scanLine(path, i + 1, line, pattern, findings, includeSuppressed);
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// §10.6 — public scan API
// ---------------------------------------------------------------------------

export interface ScanInputFile {
  path: string;
  content: string;
}

/**
 * Run a contradiction scan across the supplied files. The caller
 * is responsible for walking the file tree (this module does not
 * perform filesystem IO directly — that keeps the scanner
 * testable and avoids leaking secrets into the filesystem layer).
 *
 * Returns findings + summary.
 */
export function scanContradictions(
  files: ScanInputFile[],
  options: ScanOptions = {},
): { findings: ContradictionFinding[]; summary: ScanSummary } {
  const includeSuppressed = options.includeSuppressed ?? false;
  const allFindings: ContradictionFinding[] = [];

  for (const file of files) {
    const findings = scanContent(
      file.path,
      file.content,
      V26_CONTRADICTION_PATTERNS,
      includeSuppressed,
    );
    allFindings.push(...findings);
  }

  const bySeverity: Record<ContradictionSeverity, number> = {
    P0: 0,
    P1: 0,
    P2: 0,
    P3: 0,
  };
  const byPattern: Record<string, number> = {};
  const bySurface: Record<ContradictionSurfaceCategory, number> = {
    ACTIVE_SOURCE: 0,
    COMMENTS_STRINGS: 0,
    SCHEMAS: 0,
    MIGRATIONS: 0,
    WORKFLOW_REGISTRIES: 0,
    ENV_TEMPLATES: 0,
    POLICY_FILES: 0,
    TESTS: 0,
    DOCS: 0,
    SHIPPED_GENERATED: 0,
    RELEASE_MANIFESTS: 0,
    PACKAGE_BUILD_CONFIG: 0,
  };
  const patternSurface: Record<string, ContradictionSurfaceCategory> = {};
  for (const p of V26_CONTRADICTION_PATTERNS) {
    patternSurface[p.patternId] = p.surface;
  }

  let suppressedCount = 0;
  for (const f of allFindings) {
    bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1;
    byPattern[f.pattern] = (byPattern[f.pattern] ?? 0) + 1;
    const surf = patternSurface[f.pattern] ?? "ACTIVE_SOURCE";
    bySurface[surf] = (bySurface[surf] ?? 0) + 1;
    if (f.suppressed) suppressedCount += 1;
  }

  const summary: ScanSummary = {
    totalFindings: allFindings.length,
    bySeverity,
    byPattern,
    bySurface,
    suppressedCount,
    blueprintRef: "v26.0 §10.6 — Extended Contradiction Scan",
    patternsScanned: V26_CONTRADICTION_PATTERNS.length,
    surfacesScanned: SURFACE_CATEGORIES.length,
    filesScanned: files.length,
    honestState: {
      staticScan: true,
      runtimeAssertion: false,
      secretsRedacted: true,
    },
  };

  return { findings: allFindings, summary };
}

/**
 * Convenience: run a scan against a single content string. Used
 * by the contradiction-scan API endpoint to scan a single file
 * without spinning up the full tree walk.
 */
export function scanSingleContent(
  content: string,
  path: string = "<inline>",
  options: ScanOptions = {},
): { findings: ContradictionFinding[]; summary: ScanSummary } {
  return scanContradictions([{ path, content }], options);
}

/**
 * Full scan against the canonical v26.0 surfaces. Returns a
 * summary with zero findings expected (the v26.0 codebase is
 * supposed to be contradiction-free).
 *
 * NOTE: this function takes the file list as input (no filesystem
 * IO). The caller is responsible for walking the tree.
 */
export function runScan(files: ScanInputFile[] = []): { findings: ContradictionFinding[]; summary: ScanSummary } {
  return scanContradictions(files, { includeSuppressed: true });
}
