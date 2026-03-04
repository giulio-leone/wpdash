import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { exportNetworkCSV } from "@/application/report/report-actions";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await exportNetworkCSV();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return new NextResponse(result.data, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="network-report-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
