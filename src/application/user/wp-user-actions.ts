"use server";

import { getCurrentUserId } from "@/lib/server-auth";

import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import type { BridgeUserAction, BridgeUserInfo } from "@/infrastructure/wp-bridge/types";

const bridge = new WPBridgeClient();
async function getSiteConnection(siteId: string, userId: string) {
  const rows = await db
    .select({ url: sites.url, tokenHash: sites.tokenHash })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, userId)));
  const site = rows[0];
  if (!site) return null;
  return { url: site.url, token: site.tokenHash };
}

export async function fetchUsers(
  siteId: string,
  role?: string,
): Promise<{ success: true; data: BridgeUserInfo[] } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const users = await bridge.getUsers(site.url, site.token, role);
    return { success: true, data: users };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function manageUser(
  siteId: string,
  action: BridgeUserAction,
  params: Record<string, string | number>,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const result = await bridge.manageUser(site.url, site.token, action, params);
    return { success: true, message: result.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
