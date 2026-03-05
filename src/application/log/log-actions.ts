"use server";

import type { ActionResult } from "@/lib/server-auth";

import { getCurrentUserId } from "@/lib/server-auth";

import { DrizzleSiteRepository } from "@/infrastructure/database/repositories/site-repository-impl";
import { DrizzleLogRepository } from "@/infrastructure/database/repositories/log-repository-impl";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import type { LogLevel } from "@/domain/log/entity";
import type { BridgeLogLevel } from "@/infrastructure/wp-bridge/types";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq } from "drizzle-orm";
import type { FindSiteLogOptions, SeverityCount } from "@/ports/repositories/site-log-repository";
import type { SiteLog } from "@/domain/log/entity";


const siteRepo = new DrizzleSiteRepository();
const logRepo = new DrizzleLogRepository();
const bridge = new WPBridgeClient();


async function getSiteForUser(siteId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const site = await siteRepo.findById(siteId);
  if (!site || site.userId !== userId) return null;
  return site;
}

async function getSiteWithToken(siteId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const site = await siteRepo.findById(siteId);
  if (!site || site.userId !== userId) return null;
  const rows = await db
    .select({ tokenHash: sites.tokenHash })
    .from(sites)
    .where(eq(sites.id, siteId));
  if (!rows[0]?.tokenHash) return null;
  return { ...site, token: rows[0].tokenHash };
}

/** Fetch logs from the WP Bridge and store them in the database. */
export async function fetchSiteLogs(
  siteId: string,
  options?: { lines?: number; level?: BridgeLogLevel | "all" },
): Promise<ActionResult<SiteLog[]>> {
  const site = await getSiteWithToken(siteId);
  if (!site) return { success: false, error: "Site not found" };

  try {
    const response = await bridge.getLogs(
      site.url,
      site.token,
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

  let logs = await logRepo.findBySiteId(siteId, filters);

  // Auto-fetch from WP Bridge when no cached logs
  if (logs.length === 0) {
    const result = await fetchSiteLogs(siteId);
    if (result.success) {
      logs = await logRepo.findBySiteId(siteId, filters);
    }
  }

  return { success: true, data: logs };
}

/** Get count of logs by severity level. */
export async function getLogSummary(
  siteId: string,
): Promise<ActionResult<SeverityCount>> {
  const site = await getSiteForUser(siteId);
  if (!site) return { success: false, error: "Site not found" };

  let counts = await logRepo.countBySeverity(siteId);

  // Auto-fetch logs from bridge if nothing cached
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    await fetchSiteLogs(siteId);
    counts = await logRepo.countBySeverity(siteId);
  }

  return { success: true, data: counts };
}
