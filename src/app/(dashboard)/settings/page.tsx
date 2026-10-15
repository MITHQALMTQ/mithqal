"use client";

/**
 * MITHQAL Assurance — Settings (/settings).
 *
 * Configuration surface for the assurance engine — threshold tuning,
 * toggle gates, and on-call rotation. Every config item carries an
 * explicit aria-label so screen readers announce what each control
 * governs.
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs
 *   • 5 StatCards (Thresholds, Integrations, On-Call, Policies, Audit)
 *     wrapped in `.stagger-in`
 *   • Three sections of config items, each with a Switch + aria-label
 *
 * A11y: every interactive control has a descriptive aria-label; each
 * config row is wrapped in a labelled <fieldset> for grouping.
 */

import * as React from "react";
import {
  BellRing,
  Boxes,
  GitBranch,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Demo config state — local React state only; would write back to
 * /api/v1/settings in a later phase.
 * ────────────────────────────────────────────────────────────── */

const SPARK_THRESH = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
const SPARK_INT = [3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6];
const SPARK_ONCALL = [1, 2, 1, 2, 2, 3, 2, 3, 3, 4, 3, 4];
const SPARK_POLICIES = [6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10];
const SPARK_AUDIT = [4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8];

type ToggleRow = {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
  ariaLabel: string;
};

const THRESHOLD_TOGGLES: ToggleRow[] = [
  {
    id: "auto-pause-corridor",
    label: "Auto-pause corridor on drift > 0.5%",
    description:
      "When a sub-custody ledger drifts more than 0.5% from the canonical proof, the corridor is automatically paused pending treasury review.",
    defaultOn: true,
    ariaLabel:
      "Toggle automatic corridor pausing when drift exceeds 0.5% threshold",
  },
  {
    id: "escalate-critical",
    label: "Escalate critical exceptions to on-call",
    description:
      "Critical (P0) exceptions page the on-call treasury officer within 60 seconds of detection.",
    defaultOn: true,
    ariaLabel:
      "Toggle paging the on-call officer when a critical exception is raised",
  },
  {
    id: "failover-oracle",
    label: "Auto fail-over to backup oracle on stale feed",
    description:
      "If the primary XAU oracle is stale for more than 90 seconds, the engine switches to the backup oracle feed.",
    defaultOn: true,
    ariaLabel:
      "Toggle automatic fail-over to the backup oracle when the primary feed goes stale",
  },
];

const INTEGRATION_TOGGLES: ToggleRow[] = [
  {
    id: "swift-gpi",
    label: "SWIFT gpi settlement feed",
    description:
      "Live SWIFT gpi settlement feed — provides confirmation and tracker data for cross-border rails.",
    defaultOn: true,
    ariaLabel: "Toggle the SWIFT gpi settlement feed integration",
  },
  {
    id: "chainlink-oracle",
    label: "Chainlink oracle reference",
    description:
      "Chainlink reference oracle for XAU spot — primary source of price truth for the assurance engine.",
    defaultOn: true,
    ariaLabel: "Toggle the Chainlink oracle reference integration",
  },
  {
    id: "onchain-anchor",
    label: "On-chain merkle anchor",
    description:
      "Anchors every sealed evidence bundle to the institution's merkle-root contract on-chain for tamper-evidence.",
    defaultOn: true,
    ariaLabel:
      "Toggle the on-chain merkle-root anchor for sealed evidence bundles",
  },
];

const POLICY_TOGGLES: ToggleRow[] = [
  {
    id: "sanctions-screen",
    label: "Sanctions screening on every instruction",
    description:
      "Runs the sanctions screening pipeline against every mint, redeem, and rebalance instruction.",
    defaultOn: true,
    ariaLabel:
      "Toggle the sanctions screening pipeline on every instruction",
  },
  {
    id: "audit-every-action",
    label: "Audit-trail every on-call action",
    description:
      "Writes an audit-trail entry for every action taken by an on-call officer (pause, resume, rebalance, etc.).",
    defaultOn: true,
    ariaLabel:
      "Toggle the audit-trail requirement for every on-call officer action",
  },
  {
    id: "drift-republish",
    label: "Auto re-publish proof on drift remediation",
    description:
      "Automatically re-publishes the proof-of-reserves when a drift is remediated back below threshold.",
    defaultOn: false,
    ariaLabel:
      "Toggle automatic re-publication of the proof-of-reserves after a drift is remediated",
  },
];

function ConfigToggle({ row }: { row: ToggleRow }) {
  const [on, setOn] = React.useState(row.defaultOn);
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/40 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <Label
          htmlFor={row.id}
          className="text-sm font-medium text-foreground"
        >
          {row.label}
        </Label>
        <p className="mt-1 text-xs text-fg-muted">{row.description}</p>
      </div>
      <Switch
        id={row.id}
        checked={on}
        onCheckedChange={setOn}
        aria-label={row.ariaLabel}
      />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof BellRing;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="glass-depth rounded-xl border border-line/60 p-5">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4 text-gold" />
        </span>
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-fg-muted">{description}</p>
        </div>
      </div>
      <div className="flex flex-col divide-y divide-line/40">{children}</div>
    </fieldset>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Configuration surface for the assurance engine. Threshold tuning, integration toggles, and policy gates — every change is audit-logged."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Settings" },
        ]}
      />

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Settings headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="Thresholds"
          value={THRESHOLD_TOGGLES.length}
          icon={SlidersHorizontal}
          color="gold"
          sparklineData={SPARK_THRESH}
          sub="drift · SLA · oracle"
        />
        <StatCard
          label="Integrations"
          value={INTEGRATION_TOGGLES.length}
          icon={GitBranch}
          color="emerald"
          sparklineData={SPARK_INT}
          sub="SWIFT · Chainlink · on-chain"
        />
        <StatCard
          label="On-Call"
          value={4}
          icon={BellRing}
          color="amber"
          sparklineData={SPARK_ONCALL}
          sub="officers in rotation"
        />
        <StatCard
          label="Policies"
          value={POLICY_TOGGLES.length}
          icon={ShieldCheck}
          color="cyan"
          sparklineData={SPARK_POLICIES}
          sub="screening · audit · republish"
        />
        <StatCard
          label="Audit Entries"
          value={8}
          suffix="k"
          icon={Scale}
          color="purple"
          sparklineData={SPARK_AUDIT}
          decimals={0}
          sub="last 30 days"
        />
      </section>

      {/* ── Threshold tuning ── */}
      <section aria-label="Threshold tuning" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Threshold Tuning
        </h2>

        <div className="glass-depth rounded-xl border border-line/60 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label
                htmlFor="threshold-drift"
                className="text-sm font-medium text-foreground"
              >
                Drift threshold (%)
              </Label>
              <Input
                id="threshold-drift"
                type="number"
                step="0.05"
                defaultValue="0.5"
                aria-label="Drift threshold percentage at which corridor is paused"
                className="mt-1.5 font-mono"
              />
              <p className="mt-1 text-xs text-fg-muted">
                Above this % the corridor auto-pauses.
              </p>
            </div>
            <div>
              <Label
                htmlFor="threshold-sets"
                className="text-sm font-medium text-foreground"
              >
                Settlement SLA (minutes)
              </Label>
              <Input
                id="threshold-sets"
                type="number"
                step="1"
                defaultValue="240"
                aria-label="Settlement SLA in minutes beyond which an exception is raised"
                className="mt-1.5 font-mono"
              />
              <p className="mt-1 text-xs text-fg-muted">
                Time-to-settle SLA in minutes.
              </p>
            </div>
            <div>
              <Label
                htmlFor="threshold-oracle"
                className="text-sm font-medium text-foreground"
              >
                Oracle staleness (seconds)
              </Label>
              <Input
                id="threshold-oracle"
                type="number"
                step="1"
                defaultValue="90"
                aria-label="Oracle staleness in seconds beyond which the backup feed is engaged"
                className="mt-1.5 font-mono"
              />
              <p className="mt-1 text-xs text-fg-muted">
                Stale window before backup oracle engages.
              </p>
            </div>
          </div>
        </div>

        <Section
          icon={Boxes}
          title="Drift & Auto-Pause Gates"
          description="When the assurance engine detects drift or staleness, these gates decide what happens automatically."
        >
          {THRESHOLD_TOGGLES.map((row) => (
            <ConfigToggle key={row.id} row={row} />
          ))}
        </Section>
      </section>

      {/* ── Integrations ── */}
      <section aria-label="Integrations" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Integrations
        </h2>
        <Section
          icon={GitBranch}
          title="Source-of-Truth Integrations"
          description="External feeds the assurance engine depends on. Disabling an integration here disables the corresponding reconciliation checks."
        >
          {INTEGRATION_TOGGLES.map((row) => (
            <ConfigToggle key={row.id} row={row} />
          ))}
        </Section>
      </section>

      {/* ── Policies ── */}
      <section aria-label="Policy gates" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Policy Gates
        </h2>
        <Section
          icon={ShieldCheck}
          title="Screening & Audit Policies"
          description="Policy gates that govern how the assurance engine treats instructions and officer actions."
        >
          {POLICY_TOGGLES.map((row) => (
            <ConfigToggle key={row.id} row={row} />
          ))}
        </Section>
      </section>

      <p
        className={cn(
          "rounded-lg border border-gold/20 bg-gold/5 p-3 text-xs text-gold-soft",
        )}
      >
        <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
        Every change you make here is audit-logged and surfaces on the
        Timeline page within seconds. Changes to integration toggles are
        treasury-committee reviewed before they take effect.
      </p>
    </div>
  );
}
