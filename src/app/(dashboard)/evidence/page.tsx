"use client";

import { Info, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Evidence page — MITHQAL-TECH-SPEC-001 §3.4 (evidence passport).
 *
 * Searchable / filterable evidence table. Each row corresponds to an
 * evidence record persisted in the `evidence` table (see schema.ts).
 *
 * In pilot the table shows synthetic seed evidence so operators can
 * exercise the search UI without provisioning the DB. When /api/v1
 * returns real rows (Phase 3), the synthetic rows are dropped.
 */

interface EvidenceRow {
  evidenceId: string;
  instructionId: string;
  type: string;
  source: string;
  observedAt: string;
  hash: string;
  scope: string;
  status: string;
}

const SYNTHETIC_EVIDENCE: EvidenceRow[] = [
  {
    evidenceId: "EV-001",
    instructionId: "INS-003",
    type: "INSTRUCTION_ACCEPTED",
    source: "Bank A API",
    observedAt: "2026-10-11 10:23:15",
    hash: "0x9af1b2",
    scope: "instruction.payload",
    status: "ACTIVE",
  },
  {
    evidenceId: "EV-002",
    instructionId: "INS-003",
    type: "BANK_FUNDING_FINAL",
    source: "Bank A Treasury",
    observedAt: "2026-10-11 10:23:18",
    hash: "0x7c2e44",
    scope: "funding.ledger",
    status: "ACTIVE",
  },
  {
    evidenceId: "EV-003",
    instructionId: "INS-003",
    type: "FX_LEG_FINAL",
    source: "FX Provider",
    observedAt: "2026-10-11 10:23:22",
    hash: "0x12bc88",
    scope: "fx.execution",
    status: "ACTIVE",
  },
  {
    evidenceId: "EV-004",
    instructionId: "INS-003",
    type: "RAIL_DEBIT",
    source: "RTGS",
    observedAt: "2026-10-11 10:23:45",
    hash: "0x55d1a0",
    scope: "rail.debit",
    status: "ACTIVE",
  },
  {
    evidenceId: "EV-005",
    instructionId: "INS-003",
    type: "RAIL_CREDIT",
    source: "RTGS",
    observedAt: "2026-10-11 10:24:02",
    hash: "0x88e1c9",
    scope: "rail.credit",
    status: "ACTIVE",
  },
  {
    evidenceId: "EV-006",
    instructionId: "INS-003",
    type: "CREDITOR_BANK_CONFIRM",
    source: "Bank B API",
    observedAt: "2026-10-11 10:24:05",
    hash: "0x2aab17",
    scope: "creditor.confirmation",
    status: "ACTIVE",
  },
  {
    evidenceId: "EV-007",
    instructionId: "INS-003",
    type: "EXTERNAL_RAIL_FINAL",
    source: "RTGS",
    observedAt: "2026-10-11 10:24:10",
    hash: "0xf8a93e",
    scope: "rail.external",
    status: "EXCEPTION",
  },
  {
    evidenceId: "EV-008",
    instructionId: "INS-004",
    type: "INSTRUCTION_ACCEPTED",
    source: "Bank C API",
    observedAt: "2026-10-11 11:01:00",
    hash: "0x4b9c1d",
    scope: "instruction.payload",
    status: "ACTIVE",
  },
  {
    evidenceId: "EV-009",
    instructionId: "INS-005",
    type: "BANK_FUNDING_FINAL",
    source: "Bank D Treasury",
    observedAt: "2026-10-11 11:15:00",
    hash: "0xc7e221",
    scope: "funding.ledger",
    status: "ACTIVE",
  },
];

const TYPE_FILTERS = [
  "ALL",
  "INSTRUCTION_ACCEPTED",
  "BANK_FUNDING_FINAL",
  "FX_LEG_FINAL",
  "RAIL_DEBIT",
  "RAIL_CREDIT",
  "CREDITOR_BANK_CONFIRM",
  "EXTERNAL_RAIL_FINAL",
];

export default function EvidencePage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SYNTHETIC_EVIDENCE.filter((row) => {
      const matchesQuery =
        !q ||
        row.evidenceId.toLowerCase().includes(q) ||
        row.instructionId.toLowerCase().includes(q) ||
        row.hash.toLowerCase().includes(q) ||
        row.source.toLowerCase().includes(q);
      const matchesType = typeFilter === "ALL" || row.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [search, typeFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence"
        description="Cryptographic evidence passport — every state transition carries a hash"
      />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Synthetic evidence</AlertTitle>
        <AlertDescription>
          The table below shows 9 SYNTHETIC seed rows so the search/filter UI is exercisable without
          provisioning the DB. Real evidence arrives when /api/v1/instructions starts writing rows.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Evidence Passport</CardTitle>
              <CardDescription>{filtered.length} rows (synthetic)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search evidence…"
                  className="w-56 pl-8"
                  aria-label="Search evidence"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-56" aria-label="Filter by evidence type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_FILTERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t === "ALL" ? "All types" : t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evidence ID</TableHead>
                <TableHead>Instruction</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Observed</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    No matching evidence rows.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.evidenceId}>
                    <TableCell className="font-mono text-xs">{row.evidenceId}</TableCell>
                    <TableCell className="font-mono text-xs">{row.instructionId}</TableCell>
                    <TableCell className="text-xs">{row.type}</TableCell>
                    <TableCell>{row.source}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">
                      {row.observedAt}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.hash}</TableCell>
                    <TableCell className="font-mono text-xs">{row.scope}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
