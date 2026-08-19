import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { runContradictionScan, MODULE_ID } from "@/lib/contradiction-scan";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Scan all src/lib/*.ts files
    const libDir = path.join(process.cwd(), "src", "lib");
    const files = fs.readdirSync(libDir).filter((f) => f.endsWith(".ts") && !f.includes(".test."));
    const inputs = files.map((f) => ({
      file: `src/lib/${f}`,
      content: fs.readFileSync(path.join(libDir, f), "utf8"),
    }));
    const report = runContradictionScan(inputs);
    return NextResponse.json({ ok: true, moduleId: MODULE_ID, ...report });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
