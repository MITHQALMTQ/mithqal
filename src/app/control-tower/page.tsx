import { InstitutionalizationControlTower } from "@/components/institutionalization-control-tower";
import { CONTROL_TOWER_DATA } from "@/lib/institutionalization-control-tower";

// ============================================================================
// /control-tower — Institutionalization Control Tower page route
// ============================================================================
//
// Task ID: CT-UI
//
// Renders the bank-grade Control Tower component with the canonical
// CONTROL_TOWER_DATA passed as a prop (no client fetch needed — the data
// is statically imported from the data layer authored in
// `src/lib/institutionalization-control-tower.ts`).
//
// `force-dynamic` ensures the page is server-rendered on every request
// (consistent with the institutional-engagement + institutional-readiness
// pages that share the same design language).
//
// HONEST-STATE: This page renders the truth. NOT PRODUCTION-AUTHORIZED.
// ============================================================================

export const dynamic = "force-dynamic";

export default function ControlTowerPage() {
  return <InstitutionalizationControlTower data={CONTROL_TOWER_DATA} />;
}
