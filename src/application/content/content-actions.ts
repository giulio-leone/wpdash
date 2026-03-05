"use server";

import { getCurrentUserId } from "@/lib/server-auth";

import { eq, and } from "drizzle-orm";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import type { BridgeContentAction, BridgeContentItem } from "@/infrastructure/wp-bridge/types";

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

export async function fetchContent(
  siteId: string,
  type: "all" | "posts" | "pages" = "all",
): Promise<{ success: true; data: BridgeContentItem[] } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const items = await bridge.getContent(site.url, site.token, type);
    return { success: true, data: items };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function manageContent(
  siteId: string,
  action: BridgeContentAction,
  postId: number,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const result = await bridge.manageContent(site.url, site.token, action, postId);
    return { success: true, message: result.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
