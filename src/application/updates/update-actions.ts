"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq, and } from "drizzle-orm";
import { maybeNotifyUpdates } from "@/application/notifications/notification-actions";
import type { BridgeUpdatesStatusResponse } from "@/infrastructure/wp-bridge/types";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const bridge = new WPBridgeClient();

async function getSiteConn(siteId: string): Promise<
  | { success: true; url: string; token: string }
  | { success: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, user.id)))
    .limit(1);

  if (!site) return { success: false, error: "Site not found" };
  return { success: true, url: site.url, token: site.tokenHash };
}

export async function checkUpdates(
  siteId: string,
): Promise<ActionResult<BridgeUpdatesStatusResponse>> {
  const conn = await getSiteConn(siteId);
  if (!conn.success) return conn;

  try {
    const data = await bridge.getUpdatesStatus(conn.url, conn.token);
    const totalUpdates =
      (data.plugin_updates_count ?? 0) +
      (data.theme_updates_count ?? 0) +
      (data.wp_core?.available ? 1 : 0);
    if (totalUpdates > 0) {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      const [site] = await db.select({ name: sites.name }).from(sites).where(eq(sites.id, siteId)).limit(1);
      if (user && site) {
        await maybeNotifyUpdates(user.id, siteId, site.name, totalUpdates).catch(() => {});
      }
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch updates" };
  }
}

export async function applyWPCoreUpdate(
  siteId: string,
): Promise<ActionResult<{ message: string; updated: boolean; new_version?: string }>> {
  const conn = await getSiteConn(siteId);
  if (!conn.success) return conn;

  try {
    const data = await bridge.applyWPCoreUpdate(conn.url, conn.token);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to apply update" };
  }
}
