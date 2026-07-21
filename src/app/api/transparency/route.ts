import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deriveState } from "@/lib/testnet-engine";

// GET /api/transparency — public, unauthenticated snapshot of the
// Institution's live state. Embodies the Constitution's transparency
// principle: every claim here is verifiable from the public ledger.
//
// Returns: live testnet state (supply, reserves, NAV, ratio, PoR), the
// operation count, the Formation Committee submission count (number only —
// no PII ever leaks), and the formation milestone checklist.
export async function GET() {
  try {
    const [ops, submissionCount] = await Promise.all([
      db.testnetOperation.findMany({ orderBy: { createdAt: "asc" } }),
      db.formationInterest.count(),
    ]);

    const state = deriveState(ops);
    const recent = [...ops]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8)
      .map((o) => ({
        type: o.type,
        participant: o.participant,
        amountUsd: o.amountUsd,
        mtq: o.mtq,
        reserveRatio: o.reserveRatio,
        porHash: o.porHash,
        createdAt: o.createdAt.toISOString(),
      }));

    return NextResponse.json({
      testnet: {
        supply: state.supply,
        reserveValue: state.reserveValue,
        nav: state.nav,
        reserveRatio: state.reserveRatio,
        mintingPaused: state.mintingPaused,
        porHash: state.porHash,
        lastUpdate: state.lastUpdate,
        operationCount: ops.length,
        tiers: state.tiers,
        recentOperations: recent,
      },
      formation: {
        submissionCount,
        // Milestone checklist — public, so investors can see progress.
        // (Number-only; no names/emails ever exposed here.)
        milestones: FORMATION_MILESTONES,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("transparency failed", err);
    return NextResponse.json({ error: "Could not load state." }, { status: 500 });
  }
}

const FORMATION_MILESTONES = [
  { id: "blueprint", label: "Constitution v18 FINAL published", done: true },
  { id: "github", label: "GitHub repository live", done: true },
  { id: "x", label: "X / Twitter presence", done: true },
  { id: "docs", label: "Public Constitution reference", done: true },
  { id: "testnet", label: "MTQ testnet simulator live", done: true },
  { id: "deck", label: "Investor teaser deck", done: true },
  { id: "intake", label: "Formation Committee intake open", done: true },
  { id: "operating-co", label: "Operating company incorporated (Entity B)", done: false },
  { id: "foundation", label: "Foundation registered (Entity A)", done: false },
  { id: "council", label: "Formation Committee seated", done: false },
  { id: "custody", label: "Qualified custody RFP issued", done: false },
  { id: "audit", label: "First independent security audit", done: false },
  { id: "anchor", label: "Anchor participant MOU signed", done: false },
  { id: "mainnet", label: "MTQ mainnet launched", done: false },
];
