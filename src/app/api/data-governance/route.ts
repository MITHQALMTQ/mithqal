import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  GOVERNANCE_MATRIX,
  DATA_TYPES,
  GOVERNANCE_DIMENSIONS,
  INSTITUTIONAL_VALIDITY_RULE,
  GOVERNANCE_DIMENSION_FIELDS,
  GOVERNANCE_DATA_TYPE_FIELDS,
  getDataType,
  getGovernanceCell,
  getCellsByState,
  DATA_GOVERNANCE_STATUS,
  DATA_GOVERNANCE_VERSION,
  DATA_GOVERNANCE_SOURCE,
  DATA_TYPE_COUNT,
  GOVERNANCE_DIMENSION_COUNT,
  GOVERNANCE_CELL_COUNT,
  type DataTypeId,
  type GovernanceDimensionId,
  type GovernanceState,
} from "@/lib/institutional-data-governance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Standard 30 req/min per-IP rate limit per directive.
  const rateLimited = enforceRateLimit(
    "data-governance",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const dataTypeId = url.searchParams.get("dataTypeId") as DataTypeId | null;
  const dimensionId = url.searchParams.get("dimensionId") as
    | GovernanceDimensionId
    | null;
  const state = url.searchParams.get("state") as GovernanceState | null;

  // Single-cell lookup by (dataTypeId, dimensionId)
  if (dataTypeId && dimensionId) {
    const validDataTypes = DATA_TYPES.map((d) => d.id);
    const validDimensions = GOVERNANCE_DIMENSIONS.map((d) => d.id);
    if (!validDataTypes.includes(dataTypeId)) {
      return NextResponse.json(
        { error: `Invalid dataTypeId: ${dataTypeId}` },
        { status: 400 },
      );
    }
    if (!validDimensions.includes(dimensionId)) {
      return NextResponse.json(
        { error: `Invalid dimensionId: ${dimensionId}` },
        { status: 400 },
      );
    }
    const cell = getGovernanceCell(dataTypeId, dimensionId);
    if (!cell) {
      return NextResponse.json(
        { error: `Cell not found: ${dataTypeId} × ${dimensionId}` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.19",
        source: DATA_GOVERNANCE_SOURCE,
      },
      cell,
    });
  }

  // Single-row lookup by dataTypeId
  if (dataTypeId) {
    const validDataTypes = DATA_TYPES.map((d) => d.id);
    if (!validDataTypes.includes(dataTypeId)) {
      return NextResponse.json(
        { error: `Invalid dataTypeId: ${dataTypeId}` },
        { status: 400 },
      );
    }
    const row = getDataType(dataTypeId);
    if (!row) {
      return NextResponse.json(
        { error: `Data type not found: ${dataTypeId}` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.19",
        source: DATA_GOVERNANCE_SOURCE,
      },
      dataTypeId,
      rowCount: 1,
      row,
    });
  }

  // State filter
  if (state) {
    const validStates: GovernanceState[] = [
      "DESIGNED",
      "IMPLEMENTED",
      "PENDING_EXTERNAL_VALIDATION",
    ];
    if (!validStates.includes(state)) {
      return NextResponse.json(
        { error: `Invalid state: ${state}` },
        { status: 400 },
      );
    }
    const cells = getCellsByState(state);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.19",
        source: DATA_GOVERNANCE_SOURCE,
      },
      state,
      cellCount: cells.length,
      cells,
    });
  }

  // Default — full framework
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.19",
      source: DATA_GOVERNANCE_SOURCE,
      version: DATA_GOVERNANCE_VERSION,
      status: DATA_GOVERNANCE_STATUS,
      overrideRule:
        "Institutional Data Governance Framework — 15 governance dimensions × 7 data types = 105 cells. ALL cells at DESIGNED or PENDING_EXTERNAL_VALIDATION (honest state). No evidence institutionally valid without provenance + timestamp + source + integrity protection + verification status.",
      changeRequest: "CR-2026-008 (per Architecture Freeze v25.3.15)",
    },
    dataTypeCount: DATA_TYPE_COUNT,
    governanceDimensionCount: GOVERNANCE_DIMENSION_COUNT,
    cellCount: GOVERNANCE_CELL_COUNT,
    dataTypes: DATA_TYPES,
    governanceDimensions: GOVERNANCE_DIMENSIONS,
    matrix: GOVERNANCE_MATRIX,
    dataTypeFields: GOVERNANCE_DATA_TYPE_FIELDS,
    dimensionFields: GOVERNANCE_DIMENSION_FIELDS,
    institutionalValidityRule: INSTITUTIONAL_VALIDITY_RULE,
    rule: "Per PROMPT 32: 'Create a canonical Institutional Data Governance Framework. Define: data classification, ownership, lineage, retention, immutability requirements, jurisdictional residency, access control, encryption, key management, deletion rules, legal holds, regulatory access, participant confidentiality, evidence integrity and auditability. Extend this to: ledger data, bank data, legal-obligation data, reconciliation evidence, compliance evidence, AI/model data and operational logs. No evidence may be considered institutionally valid without provenance, timestamp, source, integrity protection and verification status.'",
  });
}
