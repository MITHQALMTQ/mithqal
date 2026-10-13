import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  generateAllBankDocuments,
  generateExecutiveThesis,
  generateBankProductBrief,
  generatePilotSpecification,
  generateLegalAccountingRegulatoryPack,
  generateRiskSecurityResiliencePack,
  BANK_DOCUMENT_GENERATOR_STATUS,
  BANK_DOCUMENT_GENERATOR_VERSION,
  BANK_DOCUMENT_GENERATOR_SOURCE,
  type DocumentId,
} from "@/lib/bank-document-generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("bank-documents", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const docId = url.searchParams.get("docId") as DocumentId | null;

  if (docId === "EXEC_THESIS") {
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: BANK_DOCUMENT_GENERATOR_SOURCE },
      document: generateExecutiveThesis(),
    });
  }
  if (docId === "BANK_PRODUCT_BRIEF") {
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: BANK_DOCUMENT_GENERATOR_SOURCE },
      document: generateBankProductBrief(),
    });
  }
  if (docId === "PILOT_SPECIFICATION") {
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: BANK_DOCUMENT_GENERATOR_SOURCE },
      document: generatePilotSpecification(),
    });
  }
  if (docId === "LEGAL_ACCOUNTING_REGULATORY_PACK") {
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: BANK_DOCUMENT_GENERATOR_SOURCE },
      document: generateLegalAccountingRegulatoryPack(),
    });
  }
  if (docId === "RISK_SECURITY_RESILIENCE_PACK") {
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: BANK_DOCUMENT_GENERATOR_SOURCE },
      document: generateRiskSecurityResiliencePack(),
    });
  }

  // Default: return all 5 documents
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: BANK_DOCUMENT_GENERATOR_SOURCE,
      version: BANK_DOCUMENT_GENERATOR_VERSION,
      status: BANK_DOCUMENT_GENERATOR_STATUS,
      overrideRule: "Bank-facing document set generated from canonical machine-readable source data. NOT a duplication of the master blueprint.",
    },
    documentCount: 5,
    documents: generateAllBankDocuments().map(d => ({
      documentId: d.documentId,
      title: d.title,
      subtitle: d.subtitle,
      targetPageCount: d.targetPageCount,
      audience: d.audience,
      sectionCount: d.sections.length,
      generatedFrom: d.generatedFrom,
      evidenceStatus: d.evidenceStatus,
    })),
    rule: "5 bank-facing documents generated from canonical machine-readable source data (v25.3.2-v25.3.11). The master blueprint remains the technical/institutional archive. Use ?docId=X to retrieve a specific document.",
  });
}
