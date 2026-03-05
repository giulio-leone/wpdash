import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { notifications } from "@/infrastructure/database/schemas/notifications";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq } from "drizzle-orm";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userSites = await db.select({ id: sites.id, name: sites.name }).from(sites).where(eq(sites.userId, user.id)).limit(1);
  const site = userSites[0];

  const samples = [
    {
      userId: user.id,
      type: "update_available" as const,
      siteId: site?.id,
      siteName: site?.name ?? "My WP Site",
      message: "WordPress 6.8.1 is available for this site",
    },
    {
      userId: user.id,
      type: "site_offline" as const,
      siteId: site?.id,
      siteName: site?.name ?? "My WP Site",
      message: "Site went offline for 2 minutes (resolved)",
      read: true,
    },
    {
      userId: user.id,
      type: "backup_stale" as const,
      siteId: site?.id,
      siteName: site?.name ?? "My WP Site",
      message: "No backup detected in the last 7 days",
    },
  ];

  await db.insert(notifications).values(samples);
  return NextResponse.json({ success: true, count: samples.length });
}
