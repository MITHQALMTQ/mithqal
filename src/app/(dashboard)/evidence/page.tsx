"use client";

/**
 * MITHQAL Assurance — Evidence Bundles with Provenance (/evidence).
 *
 * A read-only registry of every sealed evidence bundle the assurance
 * engine has produced. Each bundle is tamper-evident and carries a
 * chain of provenance anchored to a merkle root.
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs
 *   • 5 StatCards (Total Events, Bundles, Sealed Today, Avg Anchors,
 *     Last Root) wrapped in `.stagger-in`
 *   • A registry table — each row is a sealed bundle
 *
 * A11y: sr-only caption, scope="col" on every th.
 */

import * as React from "react";
import {
  Activity,
  Boxes,
  FileArchive,
  Hash,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CountUp } from "@/components/shared/count-up";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Demo data.
 * ────────────────────────────────────────────────────────────── */

type BundleRow = {
  id: string;
  sealedAt: string;
  events: number;
  caseIds: number;
  anchors: number;
  root: string;
  size: string;
  status: "sealed" | "open" | "quarantined";
};

const DEMO_BUNDLES: BundleRow[] = [
  {
    id: "BND-2024-0918",
    sealedAt: "2024-04-18 09:00",
    events: 32,
    caseIds: 6,
    anchors: 4,
    root: "0x8f4a…c2e1",
    size: "2.4 MB",
    status: "sealed",
  },
  {
    id: "BND-2024-0917",
    sealedAt: "2024-04-17 22:00",
    events: 28,
    caseIds: 5,
    anchors: 4,
    root: "0x1b22…7ad0",
    size: "1.9 MB",
    status: "sealed",
  },
  {
    id: "BND-2024-0916",
    sealedAt: "2024-04-16 18:00",
    events: 41,
    caseIds: 8,
    anchors: 6,
    root: "0x4d18…9f3c",
    size: "3.1 MB",
    status: "sealed",
  },
  {
    id: "BND-2024-0915",
    sealedAt: "2024-04-15 12:00",
    events: 19,
    caseIds: 3,
    anchors: 3,
    root: "0xa7c2…b1f4",
    size: "1.2 MB",
    status: "quarantined",
  },
  {
    id: "BND-2024-0914",
    sealedAt: "2024-04-14 06:00",
    events: 35,
    caseIds: 7,
    anchors: 5,
    root: "0x9e8f…2c4a",
    size: "2.7 MB",
    status: "sealed",
  },
  {
    id: "BND-2024-0913",
    sealedAt: "2024-04-13 18:00",
    events: 24,
    caseIds: 4,
    anchors: 4,
    root: "0x2b51…8e9d",
    size: "1.6 MB",
    status: "sealed",
  },
  {
    id: "BND-2024-0912",
    sealedAt: "—",
    events: 12,
    caseIds: 2,
    anchors: 0,
    root: "(pending)",
    size: "0.8 MB",
    status: "open",
  },
];

const STATUS_TONE: Record<BundleRow["status"], string> = {
  sealed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  open: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  quarantined: "border-red-400/30 bg-red-400/10 text-red-300",
};

const SPARK_EVENTS = [128, 132, 140, 138, 145, 152, 158, 162, 160, 168, 172, 180];
const SPARK_BUNDLES = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
const SPARK_TODAY = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6];
const SPARK_ANCHORS = [3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7];
const SPARK_ROOT = [6, 7, 6, 7, 8, 7, 8, 9, 8, 9, 10, 9];

const TOTAL_EVENTS = DEMO_BUNDLES.reduce((s, b) => s + b.events, 0);

export default function EvidencePage() {
  const sealedToday = DEMO_BUNDLES.filter(
    (b) => b.status === "sealed" && b.sealedAt.startsWith("2024-04-18"),
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Evidence Bundles"
        description="Every sealed evidence bundle the assurance engine has produced, with merkle-root provenance anchored on-chain."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Evidence" },
        ]}
      />

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Evidence headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="Total Events"
          value={TOTAL_EVENTS}
          icon={Activity}
          color="gold"
          sparklineData={SPARK_EVENTS}
          decimals={0}
          sub="in sealed bundles"
        />
        <StatCard
          label="Bundles"
          value={DEMO_BUNDLES.length}
          icon={Boxes}
          color="emerald"
          sparklineData={SPARK_BUNDLES}
          sub="across registry"
        />
        <StatCard
          label="Sealed Today"
          value={sealedToday}
          icon={ShieldCheck}
          color="cyan"
          sparklineData={SPARK_TODAY}
          sub="tamper-evident"
        />
        <StatCard
          label="Avg Anchors"
          value={6}
          icon={Hash}
          color="purple"
          sparklineData={SPARK_ANCHORS}
          decimals={0}
          sub="per bundle"
        />
        <StatCard
          label="Last Root"
          value={9}
          suffix="h ago"
          icon={FileArchive}
          color="amber"
          sparklineData={SPARK_ROOT}
          decimals={0}
          sub="merkle publication"
        />
      </section>

      {/* ── Bundles table ── */}
      <section aria-label="Evidence bundle registry" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Bundle Registry
          </h2>
          <span className="text-xs text-fg-muted">
            {DEMO_BUNDLES.length} bundles
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
            <Table aria-label="Evidence bundles with provenance">
              <caption className="sr-only">
                Evidence bundles with provenance
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Bundle</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col" className="text-right">
                    Events
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Cases
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Anchors
                  </TableHead>
                  <TableHead scope="col">Merkle Root</TableHead>
                  <TableHead scope="col" className="text-right">
                    Size
                  </TableHead>
                  <TableHead scope="col">Sealed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_BUNDLES.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs text-gold">
                      {b.id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          STATUS_TONE[b.status],
                        )}
                      >
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      <CountUp value={b.events} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      {b.caseIds}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      {b.anchors}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-fg-muted">
                      {b.root}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      {b.size}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-fg-muted">
                      {b.sealedAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-xs text-fg-muted">
          <CountUp value={DEMO_BUNDLES.length} /> bundles ·{" "}
          <CountUp value={TOTAL_EVENTS} /> total events · anchored on-chain
          for tamper-evidence.
        </p>
      </section>
    </div>
  );
}
