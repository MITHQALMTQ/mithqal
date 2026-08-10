/**
 * MITHQAL — Generic Custodian Adapter Architecture
 *
 * Per §15: "Create a generic custodian adapter architecture. Do NOT hard-code one custodian."
 *
 * Hierarchy:
 *   CustodianAdapter (abstract)
 *     ├── BankCustodianAdapter      (cash, sovereign, stablecoin)
 *     ├── BullionCustodianAdapter   (gold, silver — allocated physical)
 *     ├── VaultProviderAdapter      (specialized vaults)
 *     └── InstitutionalCustodianAdapter (central bank, BIS-type)
 *
 * Each adapter supports:
 *   - holdings inquiry
 *   - transaction submission
 *   - transaction status
 *   - settlement confirmation
 *   - account reconciliation
 *   - statement retrieval
 *   - audit evidence
 *
 * Phase 4 of the institutional execution architecture implementation.
 * Status: SIMULATED — all adapters return simulated responses.
 *
 * Credentials are NEVER stored in source code (§15).
 * In production, credentials come from environment variables / secrets manager.
 */

import type { AssetClass, ReserveAssetState } from "./reserve-state";
import { isReserveStateInitialized, getReserveState } from "./reserve-state";

// ============================================================
// Types
// ============================================================

export type CustodianType = "bank" | "bullion" | "vault" | "institutional";

export interface CustodianHoldings {
  custodianId: string;
  assets: Array<{
    assetId: string;
    assetClass: AssetClass;
    quantity: number;
    unit: "oz" | "USD";
    marketPrice: number;
    custodyAccountId: string;
    confirmedAt: string;
  }>;
  statementRef: string;
}

export interface CustodianTransactionRequest {
  transactionId: string;
  assetClass: AssetClass;
  action: "buy" | "sell";
  quantity: number;
  unit: "oz" | "USD";
  custodianId: string;
  custodyAccountId: string;
  settlementMethod: "wire" | "physical_delivery" | "book_transfer";
  idempotencyKey: string; // §28 — every execution request must be idempotent
}

export interface CustodianTransactionStatus {
  transactionId: string;
  status: "submitted" | "executing" | "settled" | "failed" | "cancelled";
  settledQuantity?: number;
  settlementRef?: string;
  settlementTimestamp?: string;
  failureReason?: string;
}

export interface CustodianAdapter {
  readonly custodianId: string;
  readonly custodianType: CustodianType;
  readonly custodianName: string;

  /** Query current holdings at this custodian. */
  getHoldings(custodyAccountId: string): Promise<CustodianHoldings>;

  /** Submit a transaction (buy/sell) to the custodian. */
  submitTransaction(request: CustodianTransactionRequest): Promise<CustodianTransactionStatus>;

  /** Query the status of a submitted transaction. */
  getTransactionStatus(transactionId: string): Promise<CustodianTransactionStatus>;

  /** Retrieve a custodian statement for audit evidence. */
  getStatement(custodyAccountId: string, fromDate: string, toDate: string): Promise<{
    statementRef: string;
    period: { from: string; to: string };
    openingBalance: number;
    closingBalance: number;
    transactions: Array<{ ref: string; date: string; description: string; amount: number }>;
  }>;

  /** Reconcile holdings against the internal ledger. */
  reconcile(internalState: ReserveAssetState[]): Promise<{
    matched: boolean;
    variance: number;
    discrepancies: Array<{ assetId: string; internalQty: number; custodianQty: number; variance: number }>;
  }>;
}

// ============================================================
// Simulated Custodian Adapters
// ============================================================

/**
 * Base class for simulated custodian adapters.
 * In production, each subclass would make real API calls to the custodian.
 */
abstract class SimulatedCustodianAdapter implements CustodianAdapter {
  abstract readonly custodianId: string;
  abstract readonly custodianType: CustodianType;
  abstract readonly custodianName: string;

  // Simulated holdings store (in production: real API)
  protected holdings = new Map<string, CustodianHoldings>();
  protected transactions = new Map<string, CustodianTransactionStatus>();

  async getHoldings(custodyAccountId: string): Promise<CustodianHoldings> {
    const holdings = this.holdings.get(custodyAccountId);
    if (!holdings) {
      // Return empty holdings for unknown accounts
      return {
        custodianId: this.custodianId,
        assets: [],
        statementRef: `stmt-${Date.now()}`,
      };
    }
    return holdings;
  }

  async submitTransaction(request: CustodianTransactionRequest): Promise<CustodianTransactionStatus> {
    // Idempotency check (§28)
    const existing = this.transactions.get(request.idempotencyKey);
    if (existing) {
      return existing; // Duplicate request → return same result
    }

    // Simulate settlement (in production: async API call)
    const status: CustodianTransactionStatus = {
      transactionId: request.transactionId,
      status: "settled",
      settledQuantity: request.quantity,
      settlementRef: `settle-${request.transactionId}`,
      settlementTimestamp: new Date().toISOString(),
    };

    this.transactions.set(request.idempotencyKey, status);
    this.transactions.set(request.transactionId, status);

    // Update simulated holdings
    const account = request.custodyAccountId;
    let holdings = this.holdings.get(account);
    if (!holdings) {
      holdings = { custodianId: this.custodianId, assets: [], statementRef: `stmt-${Date.now()}` };
      this.holdings.set(account, holdings);
    }

    // Find or create the asset entry
    let asset = holdings.assets.find((a) => a.assetClass === request.assetClass);
    if (!asset) {
      asset = {
        assetId: `${request.assetClass}-primary`,
        assetClass: request.assetClass,
        quantity: 0,
        unit: request.unit,
        marketPrice: request.assetClass === "gold" ? 4076.9 : request.assetClass === "silver" ? 58.76 : 1,
        custodyAccountId: account,
        confirmedAt: new Date().toISOString(),
      };
      holdings.assets.push(asset);
    }

    // Apply the transaction
    if (request.action === "buy") {
      asset.quantity += request.quantity;
    } else {
      asset.quantity = Math.max(0, asset.quantity - request.quantity);
    }
    asset.confirmedAt = new Date().toISOString();

    return status;
  }

  async getTransactionStatus(transactionId: string): Promise<CustodianTransactionStatus> {
    const status = this.transactions.get(transactionId);
    if (!status) {
      return { transactionId, status: "failed", failureReason: "Transaction not found" };
    }
    return status;
  }

  async getStatement(custodyAccountId: string, fromDate: string, toDate: string): Promise<{
    statementRef: string;
    period: { from: string; to: string };
    openingBalance: number;
    closingBalance: number;
    transactions: Array<{ ref: string; date: string; description: string; amount: number }>;
  }> {
    const holdings = this.holdings.get(custodyAccountId);
    const totalValue = holdings?.assets.reduce((sum, a) => sum + a.quantity * a.marketPrice, 0) ?? 0;
    return {
      statementRef: `stmt-${custodyAccountId}-${Date.now()}`,
      period: { from: fromDate, to: toDate },
      openingBalance: totalValue,
      closingBalance: totalValue,
      transactions: [],
    };
  }

  async reconcile(internalState: ReserveAssetState[]): Promise<{
    matched: boolean;
    variance: number;
    discrepancies: Array<{ assetId: string; internalQty: number; custodianQty: number; variance: number }>;
  }> {
    // Get all holdings across all accounts
    const allCustodianAssets: Map<string, number> = new Map();
    for (const holdings of this.holdings.values()) {
      for (const asset of holdings.assets) {
        const existing = allCustodianAssets.get(asset.assetId) ?? 0;
        allCustodianAssets.set(asset.assetId, existing + asset.quantity);
      }
    }

    const discrepancies: Array<{ assetId: string; internalQty: number; custodianQty: number; variance: number }> = [];
    let totalVariance = 0;

    for (const internal of internalState) {
      const custodianQty = allCustodianAssets.get(internal.assetId) ?? 0;
      const variance = Math.abs(internal.quantity - custodianQty);
      if (variance > 0.001) {
        discrepancies.push({
          assetId: internal.assetId,
          internalQty: internal.quantity,
          custodianQty,
          variance,
        });
        totalVariance += variance * internal.marketPrice;
      }
    }

    return {
      matched: discrepancies.length === 0,
      variance: totalVariance,
      discrepancies,
    };
  }
}

// ============================================================
// Concrete Simulated Adapters
// ============================================================

/** Bank custodian — for cash, sovereign, stablecoin. */
export class SimulatedBankCustodianAdapter extends SimulatedCustodianAdapter {
  readonly custodianId = "sim-bank-01";
  readonly custodianType = "bank" as const;
  readonly custodianName = "Simulated Bank Custodian (Testnet)";
}

/** Bullion custodian — for gold, silver (allocated physical). */
export class SimulatedBullionCustodianAdapter extends SimulatedCustodianAdapter {
  readonly custodianId = "sim-vault-01";
  readonly custodianType = "bullion" as const;
  readonly custodianName = "Simulated Bullion Custodian (Testnet)";
}

/** Vault provider — specialized precious-metals vault. */
export class SimulatedVaultProviderAdapter extends SimulatedCustodianAdapter {
  readonly custodianId = "sim-vault-02";
  readonly custodianType = "vault" as const;
  readonly custodianName = "Simulated Vault Provider (Testnet)";
}

/** Institutional custodian — central bank / BIS-type (future). */
export class SimulatedInstitutionalCustodianAdapter extends SimulatedCustodianAdapter {
  readonly custodianId = "sim-institutional-01";
  readonly custodianType = "institutional" as const;
  readonly custodianName = "Simulated Institutional Custodian (Future)";
}

// ============================================================
// Custodian Registry
// ============================================================

const custodianRegistry = new Map<string, CustodianAdapter>();

// Register simulated custodians
export function registerSimulatedCustodians(): void {
  if (custodianRegistry.size === 0) {
    const bank = new SimulatedBankCustodianAdapter();
    const bullion = new SimulatedBullionCustodianAdapter();
    const vault = new SimulatedVaultProviderAdapter();
    const institutional = new SimulatedInstitutionalCustodianAdapter();

    custodianRegistry.set(bank.custodianId, bank);
    custodianRegistry.set(bullion.custodianId, bullion);
    custodianRegistry.set(vault.custodianId, vault);
    custodianRegistry.set(institutional.custodianId, institutional);
  }
}

/**
 * Track whether the simulated custodian holdings have been seeded from the
 * reserve baseline. The holdings seed is idempotent per-process but MUST be
 * re-applied whenever the underlying reserve state is re-initialized (e.g.
 * after a sandbox restart). We track the latest reserve-state version we
 * seeded against so a subsequent `initializeReserveState(...)` call (which
 * bumps the version) triggers a re-seed.
 */
let lastSeededReserveVersion: number | null = null;

/**
 * Ensure the simulated custodian holdings have been seeded from the reserve
 * state's `executed` view. This bridges the dead-code gap (C-2) where
 * `initializeSimulatedCustodianHoldings()` was defined but never invoked,
 * leaving `/api/custody/holdings` to return all-zero confirmedQuantity.
 *
 * Idempotent: tracks the last-seeded `reserveStateVersion` so it only
 * re-seeds when the underlying state has actually changed. Safe to call
 * from any code path that touches a custodian (e.g. `getCustodianAdapter`,
 * `listCustodians`) — the no-op fast path returns immediately.
 *
 * If the reserve state has not been initialized yet (rare — the holdings
 * route initializes it on first call), this is also a no-op.
 */
export function ensureSimulatedCustodianHoldingsSeeded(): void {
  if (!isReserveStateInitialized()) return;
  const state = getReserveState();
  if (lastSeededReserveVersion === state.reserveStateVersion) return;
  registerSimulatedCustodians();
  initializeSimulatedCustodianHoldings(state.executed);
  lastSeededReserveVersion = state.reserveStateVersion;
}

/** Get a custodian adapter by ID. */
export function getCustodianAdapter(custodianId: string): CustodianAdapter | null {
  registerSimulatedCustodians();
  // C-2 fix: lazily seed the simulated holdings from the reserve baseline
  // the first time any consumer asks for an adapter. Without this, the
  // holdings inquiry would return confirmedQuantity = 0 for every asset
  // because `initializeSimulatedCustodianHoldings()` was never invoked.
  ensureSimulatedCustodianHoldingsSeeded();
  return custodianRegistry.get(custodianId) ?? null;
}

/** List all registered custodians. */
export function listCustodians(): Array<{ custodianId: string; custodianType: CustodianType; custodianName: string }> {
  registerSimulatedCustodians();
  ensureSimulatedCustodianHoldingsSeeded();
  return Array.from(custodianRegistry.values()).map((c) => ({
    custodianId: c.custodianId,
    custodianType: c.custodianType,
    custodianName: c.custodianName,
  }));
}

/** Initialize simulated custodian holdings from the reserve state. */
export function initializeSimulatedCustodianHoldings(reserveAssets: ReserveAssetState[]): void {
  registerSimulatedCustodians();
  for (const asset of reserveAssets) {
    if (asset.custodianId) {
      const adapter = custodianRegistry.get(asset.custodianId);
      if (adapter instanceof SimulatedCustodianAdapter) {
        // Seed the simulated holdings
        const holdings = adapter["holdings"].get(asset.custodyAccountId ?? "") ??
          { custodianId: asset.custodianId, assets: [], statementRef: `stmt-init` };
        holdings.assets.push({
          assetId: asset.assetId,
          assetClass: asset.assetClass,
          quantity: asset.quantity,
          unit: asset.unit as "oz" | "USD",
          marketPrice: asset.marketPrice,
          custodyAccountId: asset.custodyAccountId ?? "",
          confirmedAt: new Date().toISOString(),
        });
        adapter["holdings"].set(asset.custodyAccountId ?? "", holdings);
      }
    }
  }
}
