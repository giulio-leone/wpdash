"use server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { userSettings } from "@/infrastructure/database/schemas/user-settings";
import { eq } from "drizzle-orm";

export type AlertSettings = {
  notifyOffline: boolean;
  notifyUpdates: boolean;
  notifyBackupStale: boolean;
  backupStaleDays: number;
};

export async function getAlertSettings(): Promise<
  { success: true; data: AlertSettings } | { success: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const [row] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, user.id))
    .limit(1);

  if (!row) {
    return {
      success: true,
      data: { notifyOffline: true, notifyUpdates: true, notifyBackupStale: true, backupStaleDays: 7 },
    };
  }

  return {
    success: true,
    data: {
      notifyOffline: row.notifyOffline,
      notifyUpdates: row.notifyUpdates,
      notifyBackupStale: row.notifyBackupStale,
      backupStaleDays: row.backupStaleDays,
    },
  };
}

export async function updateAlertSettings(
  settings: AlertSettings,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  await db
    .insert(userSettings)
    .values({
      userId: user.id,
      ...settings,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { ...settings, updatedAt: new Date() },
    });

  return { success: true };
}
