"use server";

import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DrizzlePluginRepository } from "@/infrastructure/database/repositories/plugin-repository-impl";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import type { SitePlugin } from "@/domain/plugin/entity";
import type { BridgePluginInfo, BridgePluginInstallSource } from "@/infrastructure/wp-bridge/types";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface BulkUpdateResult {
  siteId: string;
  success: boolean;
  error?: string;
}

const repo = new DrizzlePluginRepository();
const bridge = new WPBridgeClient();

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getSiteConnection(siteId: string, userId: string) {
  const rows = await db
    .select({ url: sites.url, tokenHash: sites.tokenHash, userId: sites.userId })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, userId)));
  const site = rows[0];
  if (!site) return null;
  return { url: site.url, token: site.tokenHash };
}

function mapBridgeToPlugin(
  siteId: string,
  bp: BridgePluginInfo,
): Omit<SitePlugin, "id"> {
  return {
    siteId,
    slug: bp.slug,
    name: bp.name,
    version: bp.version,
    isActive: bp.is_active,
    hasUpdate: bp.has_update,
    latestVersion: bp.update_version,
    lastSyncedAt: new Date(),
  };
}

export async function syncSitePlugins(
  siteId: string,
): Promise<ActionResult<SitePlugin[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  try {
    const bridgePlugins = await bridge.getPlugins(conn.url, conn.token);
    const mapped = bridgePlugins.map((bp) => mapBridgeToPlugin(siteId, bp));
    const synced = await repo.syncPlugins(siteId, mapped);
    return { success: true, data: synced };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync plugins";
    return { success: false, error: message };
  }
}

export async function getSitePlugins(
  siteId: string,
): Promise<ActionResult<SitePlugin[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  let plugins = await repo.findBySiteId(siteId);

  // Auto-sync from WP Bridge when local cache is empty
  if (plugins.length === 0) {
    try {
      const bridgePlugins = await bridge.getPlugins(conn.url, conn.token);
      const mapped = bridgePlugins.map((bp) => mapBridgeToPlugin(siteId, bp));
      plugins = await repo.syncPlugins(siteId, mapped);
    } catch {
      // Return empty array if bridge is unreachable
    }
  }

  return { success: true, data: plugins };
}

export async function activatePlugin(
  siteId: string,
  pluginSlug: string,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  try {
    await bridge.managePlugin(conn.url, conn.token, "activate", pluginSlug);
    await repo.upsert({
      siteId,
      slug: pluginSlug,
      name: pluginSlug,
      version: "",
      isActive: true,
      hasUpdate: false,
      latestVersion: null,
      lastSyncedAt: new Date(),
    });
    // Re-sync to get accurate state
    const bridgePlugins = await bridge.getPlugins(conn.url, conn.token);
    const mapped = bridgePlugins.map((bp) => mapBridgeToPlugin(siteId, bp));
    await repo.syncPlugins(siteId, mapped);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to activate plugin";
    return { success: false, error: message };
  }
}

export async function deactivatePlugin(
  siteId: string,
  pluginSlug: string,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  try {
    await bridge.managePlugin(conn.url, conn.token, "deactivate", pluginSlug);
    const bridgePlugins = await bridge.getPlugins(conn.url, conn.token);
    const mapped = bridgePlugins.map((bp) => mapBridgeToPlugin(siteId, bp));
    await repo.syncPlugins(siteId, mapped);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to deactivate plugin";
    return { success: false, error: message };
  }
}

export async function updatePlugin(
  siteId: string,
  pluginSlug: string,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  try {
    await bridge.managePlugin(conn.url, conn.token, "update", pluginSlug);
    const bridgePlugins = await bridge.getPlugins(conn.url, conn.token);
    const mapped = bridgePlugins.map((bp) => mapBridgeToPlugin(siteId, bp));
    await repo.syncPlugins(siteId, mapped);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update plugin";
    return { success: false, error: message };
  }
}

export async function installPlugin(
  siteId: string,
  source: string,
  value: string,
): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  try {
    await bridge.installPlugin(
      conn.url,
      conn.token,
      source as BridgePluginInstallSource,
      value,
    );
    const bridgePlugins = await bridge.getPlugins(conn.url, conn.token);
    const mapped = bridgePlugins.map((bp) => mapBridgeToPlugin(siteId, bp));
    await repo.syncPlugins(siteId, mapped);
    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to install plugin";
    return { success: false, error: message };
  }
}

export async function bulkUpdatePlugins(
  siteIds: string[],
  pluginSlug: string,
): Promise<ActionResult<BulkUpdateResult[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const results: BulkUpdateResult[] = [];

  for (const siteId of siteIds) {
    const conn = await getSiteConnection(siteId, userId);
    if (!conn) {
      results.push({ siteId, success: false, error: "Site not found" });
      continue;
    }

    try {
      await bridge.managePlugin(conn.url, conn.token, "update", pluginSlug);
      const bridgePlugins = await bridge.getPlugins(conn.url, conn.token);
      const mapped = bridgePlugins.map((bp) => mapBridgeToPlugin(siteId, bp));
      await repo.syncPlugins(siteId, mapped);
      results.push({ siteId, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      results.push({ siteId, success: false, error: message });
    }
  }

  return { success: true, data: results };
}
