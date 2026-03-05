"use server";

import type { ActionResult } from "@/lib/server-auth";

import { getCurrentUserId } from "@/lib/server-auth";

import { DrizzleSiteRepository } from "@/infrastructure/database/repositories/site-repository-impl";
import { DrizzleBackupRepository } from "@/infrastructure/database/repositories/backup-repository-impl";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import { BACKUP_STALE_THRESHOLD_DAYS } from "@/lib/constants";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq } from "drizzle-orm";
import type { BackupRecord, BackupStatus } from "@/domain/backup/entity";


const siteRepo = new DrizzleSiteRepository();
const backupRepo = new DrizzleBackupRepository();
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

function computeStatus(lastBackupAt: string | null): BackupStatus {
  if (!lastBackupAt) return "unknown";
  const age = Date.now() - new Date(lastBackupAt).getTime();
  const days = age / (1000 * 60 * 60 * 24);
  return days <= BACKUP_STALE_THRESHOLD_DAYS ? "recent" : "stale";
}

/** Fetch backup status from WP Bridge and store it. */
export async function fetchBackupStatus(
  siteId: string,
): Promise<ActionResult<BackupRecord>> {
  const site = await getSiteWithToken(siteId);
  if (!site) return { success: false, error: "Site not found" };

  try {
    const response = await bridge.getBackupStatus(site.url, site.token);

    const record = await backupRepo.upsert({
      siteId,
      lastBackupAt: response.last_backup_at ? new Date(response.last_backup_at) : null,
      archiveSizeBytes: response.archive_size_bytes,
      status: computeStatus(response.last_backup_at),
      checkedAt: new Date(response.checked_at),
    });

    return { success: true, data: record };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch backup status";
    return { success: false, error: message };
  }
}

/** Get cached backup status from the database. */
export async function getBackupStatus(
  siteId: string,
): Promise<ActionResult<BackupRecord | null>> {
  const site = await getSiteForUser(siteId);
  if (!site) return { success: false, error: "Site not found" };

  let record = await backupRepo.getLatestBySiteId(siteId);

  // Auto-fetch from WP Bridge when no cached data
  if (!record) {
    const result = await fetchBackupStatus(siteId);
    if (result.success) record = result.data;
  }

  return { success: true, data: record };
}

/** Check if backup is stale (older than threshold days). */
export async function checkBackupFreshness(
  siteId: string,
  thresholdDays = BACKUP_STALE_THRESHOLD_DAYS,
): Promise<ActionResult<{ isStale: boolean; daysSinceBackup: number | null }>> {
  const site = await getSiteForUser(siteId);
  if (!site) return { success: false, error: "Site not found" };

  const record = await backupRepo.getLatestBySiteId(siteId);
  if (!record?.lastBackupAt) {
    return { success: true, data: { isStale: true, daysSinceBackup: null } };
  }

  const age = Date.now() - record.lastBackupAt.getTime();
  const daysSinceBackup = Math.floor(age / (1000 * 60 * 60 * 24));

  return {
    success: true,
    data: { isStale: daysSinceBackup > thresholdDays, daysSinceBackup },
  };
}

/** Get backup history for a site. */
export async function getBackupHistory(
  siteId: string,
): Promise<ActionResult<BackupRecord[]>> {
  const site = await getSiteForUser(siteId);
  if (!site) return { success: false, error: "Site not found" };

  const records = await backupRepo.findBySiteId(siteId);
  return { success: true, data: records };
}
