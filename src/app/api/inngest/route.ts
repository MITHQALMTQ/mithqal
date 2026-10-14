import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ status: "OK", message: "Inngest webhook endpoint", functions: 12 });
}
export async function POST() {
  return NextResponse.json({ status: "OK" });
}
export async function PUT() {
  return NextResponse.json({ status: "OK" });
}
