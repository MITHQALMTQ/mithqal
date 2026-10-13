#!/usr/bin/env bun
/**
 * ============================================================================
 * MITHQAL v26.0 — CONTRADICTION SCAN CLI (§10.6)
 * ============================================================================
 *
 * Runs the v26.0 contradiction scanner (`src/lib/contradiction-scan-v26.ts`)
 * across ALL 12 required surface categories per v26.0 §10.6, prints a JSON
 * report to stdout, and exits with code 1 if any P0 findings exist (after
 * suppression).
 *
 * Usage:
 *   bun run scripts/run-contradiction-scan.ts
 *   bun run scripts/run-contradiction-scan.ts --root /path/to/repo
 *   bun run scripts/run-contradiction-scan.ts --no-legacy
 *
 * Exit codes:
 *   0 — No P0 findings; scanner completed successfully.
 *   1 — One or more P0 findings (release-blocking); fix or file justified
 *       expiring-exception suppressions.
 *
 * Suppression rules (per §10.6): a finding is suppressed when its line
 * contains a justified expiring-exception token (HISTORICAL / DO NOT
 * ACTIVATE / LEGACY / QUARANTINED / DEFERRED_NOT_ACTIVE / etc.). Each
 * suppressed finding still appears in the report with `suppressed: true`
 * and a `suppressionReason` so reviewers can audit.
 *
 * PR-CI wiring: add as a required PR check; tag the workflow:
 *
 *   - name: v26 contradiction scan
 *     run: bun run scripts/run-contradiction-scan.ts
 *
 * Release check: add to release acceptance checklist §10.3 — release is
 * BLOCKED if exit code 1.
 * ============================================================================
 */

import { runV26ContradictionScan } from "../src/lib/contradiction-scan-v26";

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  root: string;
  wrapLegacy: boolean;
  quiet: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    root: process.cwd(),
    wrapLegacy: true,
    quiet: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") {
      args.root = argv[++i] ?? process.cwd();
    } else if (a === "--no-legacy") {
      args.wrapLegacy = false;
    } else if (a === "--quiet" || a === "-q") {
      args.quiet = true;
    } else if (a === "--help" || a === "-h") {
       
      console.log(
        [
          "Usage: bun run scripts/run-contradiction-scan.ts [options]",
          "",
          "Options:",
          "  --root <path>    Root directory to scan (default: process.cwd())",
          "  --no-legacy      Do NOT also run the legacy §77 contradiction-scan.ts",
          "  --quiet, -q      Suppress per-finding detail; print only summary",
          "  --help, -h       Show this help",
          "",
          "Exit codes:",
          "  0  No P0 findings (release-acceptable)",
          "  1  P0 findings exist (release-blocking)",
        ].join("\n"),
      );
      process.exit(0);
    } else {
       
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const args = parseArgs(process.argv);
  const report = runV26ContradictionScan({
    root: args.root,
    wrapLegacy: args.wrapLegacy,
  });

  if (args.quiet) {
    const summary = {
      moduleId: report.moduleId,
      blueprint_ref: report.blueprint_ref,
      surfacesScanned: report.surfacesScanned,
      filesScanned: report.filesScanned,
      totalFindings: report.totalFindings,
      p0Findings: report.p0Findings,
      p1Findings: report.p1Findings,
      p2Findings: report.p2Findings,
      p3Findings: report.p3Findings,
      suppressedFindings: report.suppressedFindings,
      finalStatus: report.finalStatus,
      finalStatusColor: report.finalStatusColor,
      exitCode: report.exitCode,
    };
     
    console.log(JSON.stringify(summary, null, 2));
  } else {
     
    console.log(JSON.stringify(report, null, 2));
  }

   
  console.error(report.finalStatus);
   
  console.error(
    `P0=${report.p0Findings} P1=${report.p1Findings} P2=${report.p2Findings} P3=${report.p3Findings} suppressed=${report.suppressedFindings} files=${report.filesScanned} surfaces=${report.surfacesScanned}`,
  );

  process.exit(report.exitCode);
}

main();
