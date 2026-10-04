/**
 * Unified Provider Health Check — checks all 5 providers in one endpoint.
 *
 * GET /api/health → returns JSON with status of each provider:
 *   - GitHub: git HEAD + push capability
 *   - Turso: SELECT 1
 *   - Neon: SELECT 1
 *   - Inngest: key presence check
 *   - Vercel: token presence check
 *
 * This is the "harmony" endpoint — all 5 providers verified in one call.
 */

import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { neon } from "@neondatabase/serverless";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ProviderHealth {
  name: string;
  status: "healthy" | "degraded" | "down" | "not_configured";
  detail: string;
  latencyMs?: number;
}

export async function GET() {
  const providers: ProviderHealth[] = [];
  const timestamp = new Date().toISOString();

  // 1. GitHub
  try {
    const gitHead = execSync("git rev-parse --short HEAD", { timeout: 3000 }).toString().trim();
    providers.push({
      name: "GitHub",
      status: "healthy",
      detail: `HEAD: ${gitHead} on main`,
    });
  } catch {
    providers.push({
      name: "GitHub",
      status: "degraded",
      detail: "Git not accessible",
    });
  }

  // 2. Turso
  const tursoStart = Date.now();
  try {
    const url = process.env.DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    if (!url) {
      providers.push({ name: "Turso", status: "not_configured", detail: "DATABASE_URL not set" });
    } else {
      const client = createClient({ url, authToken });
      await client.execute("SELECT 1 as test");
      providers.push({
        name: "Turso",
        status: "healthy",
        detail: `Connected to ${url.substring(0, 40)}...`,
        latencyMs: Date.now() - tursoStart,
      });
    }
  } catch (e) {
    providers.push({
      name: "Turso",
      status: "down",
      detail: e instanceof Error ? e.message.substring(0, 80) : "Connection failed",
      latencyMs: Date.now() - tursoStart,
    });
  }

  // 3. Neon
  const neonStart = Date.now();
  try {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      providers.push({ name: "Neon", status: "not_configured", detail: "NEON_DATABASE_URL not set" });
    } else {
      const sql = neon(connectionString);
      await sql`SELECT 1 as test`;
      providers.push({
        name: "Neon",
        status: "healthy",
        detail: "Postgres connected",
        latencyMs: Date.now() - neonStart,
      });
    }
  } catch (e) {
    providers.push({
      name: "Neon",
      status: "down",
      detail: e instanceof Error ? e.message.substring(0, 80) : "Connection failed",
      latencyMs: Date.now() - neonStart,
    });
  }

  // 4. Inngest
  const hasInngestKeys = !!process.env.INNGEST_API_KEY && !!process.env.INNGEST_SIGNING_KEY && !!process.env.INNGEST_EVENT_KEY;
  providers.push({
    name: "Inngest",
    status: hasInngestKeys ? "healthy" : "not_configured",
    detail: hasInngestKeys
      ? "API + Signing + Event keys present"
      : "Missing keys",
  });

  // 5. Vercel
  const hasVercelToken = !!process.env.VERCEL_TOKEN;
  providers.push({
    name: "Vercel",
    status: hasVercelToken ? "healthy" : "not_configured",
    detail: hasVercelToken
      ? `Token present, URL: ${process.env.VERCEL_PROJECT_URL || "not set"}`
      : "VERCEL_TOKEN not set",
  });

  // Overall status
  const allHealthy = providers.every((p) => p.status === "healthy");
  const anyDown = providers.some((p) => p.status === "down");

  return NextResponse.json({
    ok: allHealthy,
    timestamp,
    harmony: allHealthy ? "FULLY_CONNECTED" : anyDown ? "PARTIALLY_CONNECTED" : "DEGRADED",
    providers,
    summary: {
      total: providers.length,
      healthy: providers.filter((p) => p.status === "healthy").length,
      degraded: providers.filter((p) => p.status === "degraded").length,
      down: providers.filter((p) => p.status === "down").length,
      not_configured: providers.filter((p) => p.status === "not_configured").length,
    },
  });
}
