import { NextResponse } from "next/server";

/**
 * GET /api/data-source-health
 *
 * Returns the live health status of every external data source the
 * MITHQAL platform consults. For each source we report:
 *
 *   - dataset / provider / apiEndpoint / alternativeEndpoint (discovery)
 *   - connectivity ("REACHABLE" | "UNREACHABLE" | "NOT_TESTED" | "PUBLICATION_ONLY")
 *   - accessMethod ("SDMX_API" | "REST_API" | "PUBLICATION_ONLY" | ...)
 *   - frequency ("QUARTERLY" | "TRIENNIAL" | "MONTHLY" | "DAILY" | ...)
 *   - status ("HEALTHY" | "DEGRADED" | "ERROR" | "PUBLICATION_ONLY")
 *
 * Honest-state constraint (blueprint §V25.3):
 *   productionAuthorized = false
 *   These health checks are DESIGN-TIME — they verify the upstream APIs are
 *   alive, they do NOT authorize production use of the platform.
 *
 * Connectivity checks use a 10s timeout and run in parallel via
 * Promise.allSettled, so a single unreachable source cannot block the
 * response. SWIFT RMB Tracker is treated as PUBLICATION_ONLY — it is a
 * monthly publication, not an API outage, so it is always reported as
 * healthy in the publication-only sense.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  // Run all four connectivity probes in parallel — total latency = slowest.
  const [imfResult, bisResult, fredResult, swiftResult] = await Promise.allSettled([
    checkIMFConnectivity(),
    checkBISConnectivity(),
    checkFREDConnectivity(),
    checkSWIFTConfig(),
  ]);

  const imfReachable = settledValue(imfResult, false);
  const bisReachable = settledValue(bisResult, false);
  const fredReachable = settledValue(fredResult, false);
  const swiftReachable = settledValue(swiftResult, true); // PUBLICATION_ONLY is always "healthy"

  const fredApiKeyConfigured = !!process.env.FRED_API_KEY;

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    sources: [
      {
        dataset: "COFER",
        provider: "IMF",
        apiEndpoint: "https://api.imf.org/external/sdmx/2.1/data/COFER/1.0/",
        alternativeEndpoint: "https://www.imf.org/external/datamapper/api/v1/COFER",
        connectivity: imfReachable ? "REACHABLE" : "UNREACHABLE",
        accessMethod: "SDMX_API",
        frequency: "QUARTERLY",
        status: imfReachable ? "HEALTHY" : "DEGRADED",
      },
      {
        dataset: "Triennial Survey",
        provider: "BIS",
        apiEndpoint: "https://stats.bis.org/api/v1/data/",
        connectivity: bisReachable ? "REACHABLE" : "UNREACHABLE",
        accessMethod: "SDMX_API",
        frequency: "TRIENNIAL",
        status: bisReachable ? "HEALTHY" : "DEGRADED",
        note:
          "API_AVAILABLE / PERIODIC_DATASET — API is live; data updates every 3 years (last full survey: 2022)",
      },
      {
        dataset: "RMB Tracker",
        provider: "SWIFT",
        apiEndpoint: "SWIFT API Developer Portal (per-dataset)",
        connectivity: "PUBLICATION_ONLY",
        accessMethod: "PUBLICATION_ONLY",
        frequency: "MONTHLY",
        status: "PUBLICATION_ONLY",
        note:
          "SWIFT has API infrastructure; RMB Tracker is a monthly publication. PUBLICATION_ONLY is not an error state — it is the access pattern SWIFT publishes for this dataset.",
        configValid: swiftReachable,
      },
      {
        dataset: "VIX / Credit Spreads",
        provider: "FRED",
        apiEndpoint: "https://api.stlouisfed.org/fred/",
        connectivity: fredReachable
          ? "REACHABLE"
          : fredApiKeyConfigured
            ? "UNREACHABLE"
            : "NOT_TESTED",
        accessMethod: "REST_API",
        frequency: "DAILY",
        status: fredReachable
          ? "HEALTHY"
          : fredApiKeyConfigured
            ? "DEGRADED"
            : "ERROR",
        apiKeyRequired: true,
        apiKeyConfigured: fredApiKeyConfigured,
      },
    ],
    honestState: {
      productionAuthorized: false,
      note: "Data-source health checks are DESIGN-TIME. No production authorization.",
    },
  });
}

/* ---- helpers ---- */

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

/* ---- upstream connectivity probes ----
 * Each probe returns true on a 2xx HTTP response, false otherwise.
 * 10s timeout protects the response from a hung upstream. */

async function checkIMFConnectivity(): Promise<boolean> {
  try {
    const res = await fetch(
      "https://api.imf.org/external/sdmx/2.1/data/COFER/1.0/",
      {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "MITHQAL-HealthCheck/1.0" },
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function checkBISConnectivity(): Promise<boolean> {
  try {
    const res = await fetch("https://stats.bis.org/api/v1/dataflow", {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "MITHQAL-HealthCheck/1.0" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function checkFREDConnectivity(): Promise<boolean> {
  if (!process.env.FRED_API_KEY) return false;
  try {
    const res = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=VIXCLS&api_key=${process.env.FRED_API_KEY}&file_type=json&limit=1`,
      {
        signal: AbortSignal.timeout(10000),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function checkSWIFTConfig(): Promise<boolean> {
  // SWIFT RMB Tracker is PUBLICATION_ONLY — not a connectivity failure.
  // The "check" simply confirms that the dataset classification is consistent
  // (monthly publication pattern). Always true because PUBLICATION_ONLY is
  // the intended access method, not an outage.
  return true;
}
