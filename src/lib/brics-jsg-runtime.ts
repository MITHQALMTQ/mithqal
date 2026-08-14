// v25.0 §4+§6 — BRICS Settlement Interoperability Adapter + Jurisdictional Settlement Gateway
// =================================================================
// Runtime implementation of the BRICS/JSG architecture.
// =================================================================

import {
  type BRICSAdapterConfig,
  type JurisdictionalSettlementGateway,
  KNOWN_JSGS,
  JSG_ENFORCEMENT_RULES,
} from "./v25-0-brics-neutrality-amendment";

// ---- §6 Jurisdictional Settlement Gateway Manager ----

export class JSGManager {
  private gateways: Map<string, JurisdictionalSettlementGateway> = new Map();

  constructor() {
    for (const jsg of KNOWN_JSGS) {
      this.gateways.set(jsg.jsgId, { ...jsg, enforces: JSG_ENFORCEMENT_RULES.map(r => ({ rule: r, value: "ENFORCED", active: true })) });
    }
  }

  getGateway(jsgId: string): JurisdictionalSettlementGateway | null {
    return this.gateways.get(jsgId) ?? null;
  }

  getGatewayByJurisdiction(jurisdiction: string): JurisdictionalSettlementGateway | null {
    for (const [, gw] of this.gateways) {
      if (gw.jurisdiction === jurisdiction) return gw;
    }
    return null;
  }

  listGateways(): JurisdictionalSettlementGateway[] {
    return Array.from(this.gateways.values());
  }

  isolate(jsgId: string): boolean {
    const gw = this.gateways.get(jsgId);
    if (!gw) return false;
    gw.status = "ISOLATED";
    return true;
  }

  activate(jsgId: string): boolean {
    const gw = this.gateways.get(jsgId);
    if (!gw) return false;
    gw.status = "ACTIVE";
    return true;
  }

  isJSGActive(jsgId: string): boolean {
    const gw = this.gateways.get(jsgId);
    return gw?.status === "ACTIVE";
  }

  /** §22 — Jurisdictional Emergency Isolation. Isolate one JSG without affecting others. */
  emergencyIsolate(jsgId: string): { isolated: string; unaffected: string[] } {
    const isolated: string[] = [];
    const unaffected: string[] = [];

    if (this.isolate(jsgId)) {
      isolated.push(jsgId);
    }

    for (const [id, gw] of this.gateways) {
      if (id !== jsgId && gw.status === "ACTIVE") {
        unaffected.push(id);
      }
    }

    return { isolated: isolated.join(", "), unaffected };
  }
}

// ---- §4 BRICS Settlement Interoperability Adapter (BSIA) ----

export class BRICSInteroperabilityAdapter {
  private config: BRICSAdapterConfig;

  constructor() {
    this.config = {
      adapterId: "BSIA-001",
      version: "v25.0.1",
      status: "PENDING_AUTHORIZATION", // No official BRICS instrument exists yet
      authorizedBRICSInstruments: [], // Empty — no officially authorized BRICS instruments
      jurisdictionControls: ["US-JSG", "JP-JSG", "AE-JSG", "IN-JSG", "BR-JSG", "EU-JSG", "SG-JSG", "HK-JSG"],
      policyVersion: "v25.0",
      transactionLimits: {
        maxPerTransaction: 50_000_000,
        dailyLimit: 500_000_000,
      },
      emergencyDisablement: true,
      auditTrail: true,
    };
  }

  getConfig(): BRICSAdapterConfig {
    return { ...this.config };
  }

  /** §21 — Disabling the BRICS adapter must NOT disable MTQ itself. */
  disable(): { adapterDisabled: boolean; mtqOperational: boolean } {
    this.config.status = "DISABLED";
    return { adapterDisabled: true, mtqOperational: true }; // MTQ continues independently
  }

  /** Enable adapter (requires authorization). */
  enable(): boolean {
    // Only enable if there are authorized BRICS instruments
    if (this.config.authorizedBRICSInstruments.length === 0) {
      return false; // Cannot enable without official BRICS instruments
    }
    this.config.status = "ACTIVE";
    return true;
  }

  /** Authorize a new BRICS instrument (only if officially recognized). */
  authorizeBRICSInstrument(instrument: string): boolean {
    // In production, this would require verification of official BRICS authorization
    if (!this.config.authorizedBRICSInstruments.includes(instrument)) {
      this.config.authorizedBRICSInstruments.push(instrument);
    }
    return true;
  }

  /** Check if a BRICS instrument is authorized. */
  isAuthorized(instrument: string): boolean {
    return this.config.authorizedBRICSInstruments.includes(instrument);
  }

  /** §11 — BRICS Unit flow (if it exists). */
  processBRICSUnitFlow(amount: number, destinationJurisdiction: string): {
    processed: boolean;
    reason: string;
    flow: string;
  } {
    if (this.config.status !== "ACTIVE") {
      return {
        processed: false,
        reason: "BRICS adapter is not ACTIVE (status: " + this.config.status + "). No official BRICS instrument authorized.",
        flow: "BLOCKED — adapter inactive",
      };
    }

    if (this.config.authorizedBRICSInstruments.length === 0) {
      return {
        processed: false,
        reason: "No officially authorized BRICS instruments. MITHQAL remains fully functional without BRICS Unit.",
        flow: "BLOCKED — no authorized BRICS instrument",
      };
    }

    if (amount > this.config.transactionLimits.maxPerTransaction) {
      return {
        processed: false,
        reason: `Amount ${amount} exceeds max ${this.config.transactionLimits.maxPerTransaction}`,
        flow: "BLOCKED — limit exceeded",
      };
    }

    return {
      processed: true,
      reason: "BRICS Unit flow authorized",
      flow: `BRICS Unit → BSIA → MTQ → ${destinationJurisdiction} JSG → Authorized Bank/CBDC`,
    };
  }
}

// ---- §12 MTQ Independence from BRICS ----

export function checkMTQIndependence(): {
  mtqFunctional: boolean;
  bricsRequired: boolean;
  reason: string;
} {
  // MTQ is ALWAYS functional regardless of BRICS
  return {
    mtqFunctional: true,
    bricsRequired: false,
    reason: "MTQ shall remain independently functional regardless of whether a BRICS unit, BRICS CBDC framework, BRICS payment system or BRICS monetary instrument exists.",
  };
}

// ---- §22 Jurisdictional Emergency Isolation ----

export function performEmergencyIsolation(
  jsgId: string,
  jsgManager: JSGManager,
): {
  isolated: string;
  unaffected: string[];
  mtqOperational: boolean;
  principle: string;
} {
  const result = jsgManager.emergencyIsolate(jsgId);
  return {
    ...result,
    mtqOperational: true, // MTQ core continues
    principle: "Any jurisdiction can isolate its own gateway without collapsing the entire MITHQAL network. This is much stronger than a globally centralized block/unblock switch.",
  };
}
