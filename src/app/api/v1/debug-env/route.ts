import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({
    groq: !!process.env.GROQ_API_KEY ? "SET" : "MISSING",
    openrouter: !!process.env.OPENROUTER_API_KEY ? "SET" : "MISSING",
    nvidia: !!process.env.NVIDIA_API_KEY ? "SET" : "MISSING",
    gemini: !!process.env.GEMINI_API_KEY ? "SET" : "MISSING",
    huggingface: !!process.env.HUGGINGFACE_API_KEY ? "SET" : "MISSING",
    turso: !!process.env.TURSO_DATABASE_URL ? "SET" : "MISSING",
    inngest: !!process.env.INNGEST_API_KEY ? "SET" : "MISSING",
    neon: !!process.env.NEON_DATABASE_URL ? "SET" : "MISSING",
    allKeys: Object.keys(process.env).filter(k => k.includes("API_KEY") || k.includes("TOKEN") || k.includes("DATABASE")).sort(),
  });
}
