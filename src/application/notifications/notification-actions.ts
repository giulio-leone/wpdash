"use server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { notifications } from "@/infrastructure/database/schemas/notifications";
import { eq, desc } from "drizzle-orm";

export async function getNotifications() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Unauthorized" };
  const items = await db.select().from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return { success: true as const, data: items };
}

export async function markAllRead() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: "Unauthorized" };
  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, user.id));
  return { success: true as const };
}

export async function createNotification(params: {
  userId: string;
  type: "site_offline" | "update_available" | "backup_stale" | "info";
  siteId?: string;
  siteName?: string;
  message: string;
}) {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    siteId: params.siteId,
    siteName: params.siteName,
    message: params.message,
  });
}
