import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join, extname } from "node:path";

// POST /api/upload — accepts a single file (multipart/form-data or raw body)
// and saves it to /home/z/my-project/upload/{filename}.
// This works around the broken IM-gateway file delivery: the user uploads
// via the /upload page in the Preview Panel, and the file lands directly
// on this sandbox's filesystem.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const UPLOAD_DIR = "/home/z/my-project/upload";
  try {
    mkdirSync(UPLOAD_DIR, { recursive: true });

    const contentType = req.headers.get("content-type") || "";

    let filename: string;
    let content: Buffer;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "No 'file' field in form data" }, { status: 400 });
      }
      filename = file.name || `upload-${Date.now()}`;
      content = Buffer.from(await file.arrayBuffer());
    } else {
      // Raw body — use Content-Disposition or query param for filename
      const cd = req.headers.get("content-disposition") || "";
      const m = cd.match(/filename="?([^"]+)"?/);
      filename = m?.[1] || req.nextUrl.searchParams.get("name") || `upload-${Date.now()}.txt`;
      content = Buffer.from(await req.arrayBuffer());
    }

    // Sanitize filename (no path traversal)
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (!filename) filename = `upload-${Date.now()}`;

    const filepath = join(UPLOAD_DIR, filename);
    writeFileSync(filepath, content);

    const size = content.length;
    console.log(`[upload] saved ${filename} (${size} bytes) to ${filepath}`);

    return NextResponse.json({
      ok: true,
      filename,
      size,
      path: filepath,
      message: `File saved. The agent can now read it at /home/z/my-project/upload/${filename}`,
    });
  } catch (err) {
    console.error("[upload] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "upload failed" },
      { status: 500 }
    );
  }
}

// GET /api/upload — list files in the upload directory
export async function GET() {
  const UPLOAD_DIR = "/home/z/my-project/upload";
  try {
    if (!existsSync(UPLOAD_DIR)) {
      return NextResponse.json({ ok: true, files: [] });
    }
    const { readdirSync, statSync } = await import("node:fs");
    const files = readdirSync(UPLOAD_DIR)
      .filter((f) => !f.startsWith("."))
      .map((f) => {
        const stat = statSync(resolve(UPLOAD_DIR, f));
        return { name: f, size: stat.size, modified: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
    return NextResponse.json({ ok: true, files, count: files.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
