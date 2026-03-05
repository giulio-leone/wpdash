"use server";

import type { ActionResult } from "@/lib/server-auth";

import { getCurrentUserId } from "@/lib/server-auth";

import { DrizzleUptimeRepository } from "@/infrastructure/database/repositories/uptime-repository-impl";
import { DrizzleSiteRepository } from "@/infrastructure/database/repositories/site-repository-impl";
import { UPTIME_CHECK_TIMEOUT_MS, UPTIME_RETENTION_DAYS } from "@/lib/constants";
import { maybeNotifyOffline } from "@/application/notifications/notification-actions";
import type { UptimeCheck } from "@/domain/uptime/entity";


const uptimeRepo = new DrizzleUptimeRepository();
const siteRepo = new DrizzleSiteRepository();


async function verifySiteOwnership(siteId: string, userId: string) {
  const site = await siteRepo.findById(siteId);
  if (!site || site.userId !== userId) return null;
  return site;
}

export async function checkSiteUptime(
  siteId: string,
): Promise<ActionResult<UptimeCheck>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await verifySiteOwnership(siteId, userId);
  if (!site) return { success: false, error: "Site not found" };

  const start = Date.now();
  let statusCode: number | null = null;
  let isReachable = false;
  let errorMessage: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPTIME_CHECK_TIMEOUT_MS);

    const response = await fetch(site.url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    statusCode = response.status;
    isReachable = response.ok;
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Unknown error";
  }

  const responseTimeMs = Date.now() - start;

  const check = await uptimeRepo.create({
    siteId,
    statusCode,
    responseTimeMs,
    isReachable,
    errorMessage,
    checkedAt: new Date(),
  });

  if (!isReachable) {
    await maybeNotifyOffline(userId, siteId, site.name, site.url).catch(() => {});
  }

  return { success: true, data: check };
}

export async function getSiteUptimeHistory(
  siteId: string,
  days = UPTIME_RETENTION_DAYS,
): Promise<ActionResult<UptimeCheck[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await verifySiteOwnership(siteId, userId);
  if (!site) return { success: false, error: "Site not found" };

  const since = new Date();
  since.setDate(since.getDate() - days);

  const checks = await uptimeRepo.findBySiteId(siteId, since);
  return { success: true, data: checks };
}

export async function getSiteUptimeStatus(
  siteId: string,
): Promise<
  ActionResult<{
    latest: UptimeCheck | null;
    uptimePercentage: number;
  }>
> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await verifySiteOwnership(siteId, userId);
  if (!site) return { success: false, error: "Site not found" };

  const since = new Date();
  since.setDate(since.getDate() - UPTIME_RETENTION_DAYS);

  const [latest, uptimePercentage] = await Promise.all([
    uptimeRepo.getLatestBySiteId(siteId),
    uptimeRepo.getUptimePercentage(siteId, since),
  ]);

  return { success: true, data: { latest, uptimePercentage } };
}
