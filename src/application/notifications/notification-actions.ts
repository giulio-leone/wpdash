"use server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { notifications } from "@/infrastructure/database/schemas/notifications";
import { eq, and, gte, desc } from "drizzle-orm";
import { sendSiteOfflineAlert } from "@/application/notifications/email-service";

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

async function createNotification(params: {
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

async function alreadyNotifiedToday(
  userId: string,
  siteId: string,
  type: "site_offline" | "update_available" | "backup_stale" | "info",
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.siteId, siteId),
        eq(notifications.type, type),
        gte(notifications.createdAt, today),
      ),
    )
    .limit(1);
  return existing.length > 0;
}

export async function maybeNotifyOffline(
  userId: string,
  siteId: string,
  siteName: string,
  siteUrl?: string,
): Promise<void> {
  if (await alreadyNotifiedToday(userId, siteId, "site_offline")) return;
  await createNotification({ userId, type: "site_offline", siteId, siteName, message: `${siteName} is offline` });
  // Also send email alert (fire-and-forget)
  sendSiteOfflineAlert(userId, { name: siteName, url: siteUrl ?? "" }).catch(() => {});
}

export async function maybeNotifyUpdates(
  userId: string,
  siteId: string,
  siteName: string,
  updateCount: number,
): Promise<void> {
  if (updateCount <= 0) return;
  if (await alreadyNotifiedToday(userId, siteId, "update_available")) return;
  await createNotification({
    userId,
    type: "update_available",
    siteId,
    siteName,
    message: `${updateCount} update${updateCount > 1 ? "s" : ""} available for ${siteName}`,
  });
}
