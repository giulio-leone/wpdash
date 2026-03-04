import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { exportSiteReportCSV } from "@/application/report/report-actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await exportSiteReportCSV(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return new NextResponse(result.data, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="site-report-${id}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
