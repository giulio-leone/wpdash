"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DrizzleSiteRepository } from "@/infrastructure/database/repositories/site-repository-impl";
import { DrizzleLogRepository } from "@/infrastructure/database/repositories/log-repository-impl";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import type { LogLevel } from "@/domain/log/entity";
import type { BridgeLogLevel } from "@/infrastructure/wp-bridge/types";
import type { FindSiteLogOptions, SeverityCount } from "@/ports/repositories/site-log-repository";
import type { SiteLog } from "@/domain/log/entity";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const siteRepo = new DrizzleSiteRepository();
const logRepo = new DrizzleLogRepository();
const bridge = new WPBridgeClient();

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function getSiteForUser(siteId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const site = await siteRepo.findById(siteId);
  if (!site || site.userId !== userId) return null;
  return site;
}

/** Fetch logs from the WP Bridge and store them in the database. */
export async function fetchSiteLogs(
  siteId: string,
  options?: { lines?: number; level?: BridgeLogLevel | "all" },
): Promise<ActionResult<SiteLog[]>> {
  const site = await getSiteForUser(siteId);
  if (!site) return { success: false, error: "Site not found" };

  try {
    const response = await bridge.getLogs(
      site.url,
      site.id, // token placeholder — bridge uses site URL + token
      options?.lines,
      options?.level,
    );

    const now = new Date();
    const logs = response.entries.map((entry) => ({
      siteId,
      level: entry.level as LogLevel,
      message: entry.message,
      source: entry.file ? `${entry.file}${entry.line ? `:${entry.line}` : ""}` : null,
      loggedAt: new Date(entry.timestamp),
      fetchedAt: now,
    }));

    const created = await logRepo.createBatch(logs);
    return { success: true, data: created };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch logs";
    return { success: false, error: message };
  }
}

/** Get cached logs from the database with filters. */
export async function getSiteLogs(
  siteId: string,
  filters?: FindSiteLogOptions,
): Promise<ActionResult<SiteLog[]>> {
  const site = await getSiteForUser(siteId);
  if (!site) return { success: false, error: "Site not found" };

  const logs = await logRepo.findBySiteId(siteId, filters);
  return { success: true, data: logs };
}

/** Get count of logs by severity level. */
export async function getLogSummary(
  siteId: string,
): Promise<ActionResult<SeverityCount>> {
  const site = await getSiteForUser(siteId);
  if (!site) return { success: false, error: "Site not found" };

  const counts = await logRepo.countBySeverity(siteId);
  return { success: true, data: counts };
}
