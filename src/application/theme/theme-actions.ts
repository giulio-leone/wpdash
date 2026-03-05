"use server";

import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import type {
  BridgeThemeAction,
  BridgeThemeInfo,
  BridgeUpdatesStatusResponse,
} from "@/infrastructure/wp-bridge/types";

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

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export async function fetchThemes(
  siteId: string,
): Promise<{ success: true; data: BridgeThemeInfo[] } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const themes = await bridge.getThemes(site.url, site.token);
    return { success: true, data: themes };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function manageTheme(
  siteId: string,
  action: BridgeThemeAction,
  slug: string,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const result = await bridge.manageTheme(site.url, site.token, action, slug);
    return { success: true, message: result.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function installTheme(
  siteId: string,
  slug: string,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const result = await bridge.installTheme(site.url, site.token, slug);
    return { success: true, message: result.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

export async function fetchUpdatesStatus(
  siteId: string,
): Promise<{ success: true; data: BridgeUpdatesStatusResponse } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const data = await bridge.getUpdatesStatus(site.url, site.token);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function applyWPCoreUpdate(
  siteId: string,
): Promise<{ success: true; message: string; updated: boolean; newVersion?: string } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const result = await bridge.applyWPCoreUpdate(site.url, site.token);
    return { success: true, message: result.message, updated: result.updated, newVersion: result.new_version };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
