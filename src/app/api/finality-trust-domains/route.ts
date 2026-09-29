import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  TRUST_DOMAINS,
  CROSS_DOMAIN_ISOLATION_RULES,
  SEVEN_TECHNICAL_ENFORCEMENT_LAYERS,
  getTrustDomain,
  canRoleAccessDomain,
  TRUST_DOMAINS_STATUS,
  TRUST_DOMAINS_VERSION,
  TRUST_DOMAINS_SOURCE,
} from "@/lib/finality-trust-domains";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("finality-trust-domains", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      domainsSource: TRUST_DOMAINS_SOURCE,
      domainsVersion: TRUST_DOMAINS_VERSION,
      status: TRUST_DOMAINS_STATUS,
      overrideRule:
        "Three trust domains. Keys/credentials/deployment/roles/audit separated. 7 technical layers preserved but NOT 7 institutional controls.",
    },
    domains: TRUST_DOMAINS,
    crossDomainIsolationRules: CROSS_DOMAIN_ISOLATION_RULES,
    sevenTechnicalEnforcementLayers: SEVEN_TECHNICAL_ENFORCEMENT_LAYERS,
    rule: "Three trust domains: A (Policy/Authorization), B (Finality Attestation), C (Execution). Each domain has its OWN keys, credentials, deployment permissions, roles, and audit evidence. Cross-domain isolation enforced. The 7 technical enforcement layers are PRESERVED but NOT described as 7 independently owned institutional controls.",
    // Helpful API surface mirrors (so callers can verify without importing):
    api: {
      getTrustDomain: typeof getTrustDomain,
      canRoleAccessDomain: typeof canRoleAccessDomain,
    },
  });
}
