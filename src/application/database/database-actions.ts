"use server";

import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import type { BridgeDBCleanupAction, BridgeDBStatusResponse } from "@/infrastructure/wp-bridge/types";

const bridge = new WPBridgeClient();

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getSiteConnection(siteId: string, userId: string) {
  const rows = await db
    .select({ url: sites.url, tokenHash: sites.tokenHash })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, userId)));
  const site = rows[0];
  if (!site) return null;
  return { url: site.url, token: site.tokenHash };
}

export async function fetchDBStatus(
  siteId: string,
): Promise<{ success: true; data: BridgeDBStatusResponse } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const data = await bridge.getDBStatus(site.url, site.token);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function optimizeDatabase(
  siteId: string,
): Promise<{ success: true; tablesOptimized: number } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const result = await bridge.optimizeDB(site.url, site.token);
    return { success: true, tablesOptimized: result.tables_optimized };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function cleanupDatabase(
  siteId: string,
  action: BridgeDBCleanupAction,
): Promise<{ success: true; message: string; rowsDeleted: number } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const result = await bridge.cleanupDB(site.url, site.token, action);
    return { success: true, message: result.message, rowsDeleted: result.rows_deleted };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
