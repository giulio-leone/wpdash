"use server";

import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import type {
  BridgeWooCustomer,
  BridgeWooOrder,
  BridgeWooOrderStatus,
  BridgeWooProduct,
  BridgeWooStats,
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

export async function fetchWooStats(
  siteId: string,
): Promise<{ success: true; data: BridgeWooStats } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const data = await bridge.getWooStats(site.url, site.token);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchWooOrders(
  siteId: string,
  limit = 20,
): Promise<{ success: true; data: BridgeWooOrder[] } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const data = await bridge.getWooOrders(site.url, site.token, limit);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateWooOrderStatus(
  siteId: string,
  orderId: number,
  status: BridgeWooOrderStatus,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const result = await bridge.updateWooOrderStatus(site.url, site.token, orderId, status);
    return { success: true, message: result.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchWooProducts(
  siteId: string,
  limit = 30,
): Promise<{ success: true; data: BridgeWooProduct[] } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const data = await bridge.getWooProducts(site.url, site.token, limit);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchWooCustomers(
  siteId: string,
  limit = 20,
): Promise<{ success: true; data: BridgeWooCustomer[] } | { success: false; error: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    const site = await getSiteConnection(siteId, userId);
    if (!site) throw new Error("Site not found");
    const data = await bridge.getWooCustomers(site.url, site.token, limit);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
