import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";

// GET /api/admin/interests — list Formation Committee submissions.
// Auth-gated: requires an authenticated operator session. The public
// cannot reach this endpoint. Optional ?role= filter applies ONLY to the
// rows returned; the totals and byRole breakdown always reflect the FULL
// dataset so the dashboard stats remain stable as the operator filters.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const url = new URL(req.url);
  const role = url.searchParams.get("role")?.trim();
  const where = role && role !== "all" ? { role } : undefined;

  try {
    await ensureSchema()
    // Overall totals — always unfiltered.
    const [rows, overallTotal, overallByRoleAgg] = await Promise.all([
      db.formationInterest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      db.formationInterest.count(),
      db.formationInterest.groupBy({
        by: ["role"],
        _count: { _all: true },
      }),
    ]);

    const byRole: Record<string, number> = {};
    for (const r of overallByRoleAgg) byRole[r.role] = r._count._all;

    return NextResponse.json({
      total: overallTotal,
      byRole,
      filtered: rows.length,
      rows: rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        org: r.org ?? "",
        role: r.role,
        message: r.message ?? "",
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("admin interests failed", err);
    return NextResponse.json({ error: "Could not load submissions." }, { status: 500 });
  }
}
