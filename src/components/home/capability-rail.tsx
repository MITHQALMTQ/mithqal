import type { ReactNode } from "react";
import {
  SettlementIcon,
  PolicyIcon,
  EvidenceIcon,
  InteroperabilityIcon,
  ContinuityIcon,
} from "@/components/home/mithqal-icons";

/**
 * MITHQAL home — capability rail.
 *
 * A 5-column rail anchored to the bottom of the hero on desktop,
 * describing the five institutional capabilities MITHQAL coordinates.
 * Each cell carries a thin-line gold monoline icon, a 16px title and a
 * 12.5px description, separated by hairline vertical dividers.
 *
 * Responsive:
 *  - < 900px: rail leaves the absolute hero anchor and flows in normal
 *    document order as a 2-column grid (so it never overflows the hero).
 *  - < 620px: collapses to a single column.
 *
 * Institutional language only — no consumer / Web3 terminology.
 */

type Capability = {
  title: string;
  description: string;
  icon: (props: { className?: string }) => ReactNode;
};

const CAPABILITIES: Capability[] = [
  {
    title: "Settlement Orchestration",
    description:
      "Coordinate settlement workflows across controlled institutional rails.",
    icon: SettlementIcon,
  },
  {
    title: "Policy & Risk Controls",
    description:
      "Apply deterministic policy, eligibility and risk controls to workflows.",
    icon: PolicyIcon,
  },
  {
    title: "Reconciliation & Evidence",
    description:
      "Maintain reconciliation, traceability and audit-ready evidence.",
    icon: EvidenceIcon,
  },
  {
    title: "Multi-Rail Interoperability",
    description:
      "Coordinate workflows across distinct financial and settlement rails.",
    icon: InteroperabilityIcon,
  },
  {
    title: "Continuity & Replay",
    description:
      "Support controlled recovery, failure handling, replay and operational continuity.",
    icon: ContinuityIcon,
  },
];

export function CapabilityRail() {
  return (
    <div className="mithqal-capability-rail">
      {CAPABILITIES.map((capability) => {
        const Icon = capability.icon;
        return (
          <div key={capability.title} className="mithqal-capability">
            <Icon className="mithqal-capability-icon" />
            <h3 className="mithqal-capability-title">{capability.title}</h3>
            <p className="mithqal-capability-desc">
              {capability.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
