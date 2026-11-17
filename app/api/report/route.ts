import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { loadReport } from "@/lib/report";
import { REVIEW_STATUS_LABELS } from "@/lib/labels";

// GET /api/report?cycle=<id>  →  CSV download of the completion report. HR only.
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.me || session.me.role !== "hr_admin") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const cycleId = request.nextUrl.searchParams.get("cycle") ?? undefined;
  const { cycle, rows } = await loadReport(createUserClient(), cycleId);
  if (!cycle) return NextResponse.json({ error: "No cycle" }, { status: 404 });

  // Quote every cell and double any quotes inside it (standard CSV escaping).
  // A leading ' stops spreadsheet apps from treating text like "=SUM()" as a formula.
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const header = ["Employee", "Email", "Designation", "Department", "Manager", "Goals approved", "Goals total", "Weightage total", "Review status", "Self rating", "Manager rating"];
  const lines = rows.map((r) =>
    [
      r.employee.full_name,
      r.employee.email,
      r.employee.designation,
      r.employee.department,
      r.employee.manager?.full_name,
      r.goals.approved,
      r.goals.count,
      r.goals.total,
      REVIEW_STATUS_LABELS[r.reviewStatus],
      r.review?.overall_self_rating,
      r.review?.overall_manager_rating,
    ].map(cell).join(","),
  );
  const csv = [header.map(cell).join(","), ...lines].join("\r\n");
  const filename = `pms-report-${cycle.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
