"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DrizzleSiteRepository } from "@/infrastructure/database/repositories/site-repository-impl";
import { DrizzleUptimeRepository } from "@/infrastructure/database/repositories/uptime-repository-impl";
import { DrizzleSecurityAuditRepository } from "@/infrastructure/database/repositories/security-repository-impl";
import { DrizzlePluginRepository } from "@/infrastructure/database/repositories/plugin-repository-impl";
import { DrizzleSeoRepository } from "@/infrastructure/database/repositories/seo-repository-impl";
import { DrizzleBackupRepository } from "@/infrastructure/database/repositories/backup-repository-impl";
import { DrizzleLogRepository } from "@/infrastructure/database/repositories/log-repository-impl";
import { generateCSV } from "@/lib/csv";
import { UPTIME_RETENTION_DAYS } from "@/lib/constants";
import type { Site } from "@/domain/site/entity";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const siteRepo = new DrizzleSiteRepository();
const uptimeRepo = new DrizzleUptimeRepository();
const securityRepo = new DrizzleSecurityAuditRepository();
const pluginRepo = new DrizzlePluginRepository();
const seoRepo = new DrizzleSeoRepository();
const backupRepo = new DrizzleBackupRepository();
const logRepo = new DrizzleLogRepository();

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export interface NetworkOverview {
  totalSites: number;
  onlineCount: number;
  offlineCount: number;
  averageUptimePercent: number;
  sitesWithSecurityIssues: number;
  sitesWithOutdatedPlugins: number;
  sitesWithStaleBackups: number;
  healthScore: number;
}

export interface SiteReport {
  site: {
    name: string;
    url: string;
    wpVersion: string | null;
    phpVersion: string | null;
    status: string;
    lastCheckedAt: Date | null;
  };
  uptimePercent: number;
  responseTimeMs: number | null;
  securityStatus: string | null;
  securityFindingsCount: number;
  pluginsTotal: number;
  pluginsActive: number;
  pluginsOutdated: number;
  seoScore: number | null;
  logErrors: number;
  logWarnings: number;
  backupStatus: string | null;
  lastBackupAt: Date | null;
}

async function buildSiteReport(site: Site): Promise<SiteReport> {
  const sevenDaysAgo = new Date(Date.now() - UPTIME_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const [uptimeChecks, securityAudit, plugins, seoAudit, severityCounts, backupRecord, latestCheck] =
    await Promise.all([
      uptimeRepo.findBySiteId(site.id, sevenDaysAgo),
      securityRepo.getLatestBySiteId(site.id),
      pluginRepo.findBySiteId(site.id),
      seoRepo.getLatestBySiteId(site.id),
      logRepo.countBySeverity(site.id),
      backupRepo.getLatestBySiteId(site.id),
      uptimeRepo.getLatestBySiteId(site.id),
    ]);

  const totalChecks = uptimeChecks.length;
  const reachableChecks = uptimeChecks.filter((c) => c.isReachable).length;
  const uptimePercent = totalChecks > 0 ? (reachableChecks / totalChecks) * 100 : 0;

  const logErrors = severityCounts.error + severityCounts.critical;
  const logWarnings = severityCounts.warning;

  return {
    site: {
      name: site.name,
      url: site.url,
      wpVersion: site.wpVersion,
      phpVersion: site.phpVersion,
      status: site.status,
      lastCheckedAt: site.lastCheckedAt,
    },
    uptimePercent: Math.round(uptimePercent * 100) / 100,
    responseTimeMs: latestCheck?.responseTimeMs ?? null,
    securityStatus: securityAudit?.status ?? null,
    securityFindingsCount: securityAudit?.findings.length ?? 0,
    pluginsTotal: plugins.length,
    pluginsActive: plugins.filter((p) => p.isActive).length,
    pluginsOutdated: plugins.filter((p) => p.hasUpdate).length,
    seoScore: seoAudit?.score ?? null,
    logErrors,
    logWarnings,
    backupStatus: backupRecord?.status ?? null,
    lastBackupAt: backupRecord?.lastBackupAt ?? null,
  };
}

export async function getNetworkOverview(): Promise<
  ActionResult<NetworkOverview>
> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const sites = await siteRepo.findByUserId(userId);

    let totalUptimePercent = 0;
    let sitesWithSecurityIssues = 0;
    let sitesWithOutdatedPlugins = 0;
    let sitesWithStaleBackups = 0;

    const reports = await Promise.all(sites.map(buildSiteReport));

    for (const report of reports) {
      totalUptimePercent += report.uptimePercent;
      if (
        report.securityStatus === "warning" ||
        report.securityStatus === "critical"
      ) {
        sitesWithSecurityIssues++;
      }
      if (report.pluginsOutdated > 0) {
        sitesWithOutdatedPlugins++;
      }
      if (report.backupStatus === "stale" || report.backupStatus === "unknown") {
        sitesWithStaleBackups++;
      }
    }

    const totalSites = sites.length;
    const onlineCount = sites.filter((s) => s.status === "online").length;
    const offlineCount = sites.filter((s) => s.status === "offline").length;
    const averageUptimePercent =
      totalSites > 0
        ? Math.round((totalUptimePercent / totalSites) * 100) / 100
        : 0;

    // Health score: weighted combination
    const uptimeWeight = 0.4;
    const securityWeight = 0.3;
    const pluginWeight = 0.2;
    const backupWeight = 0.1;

    const uptimeScore = averageUptimePercent;
    const securityScore =
      totalSites > 0
        ? ((totalSites - sitesWithSecurityIssues) / totalSites) * 100
        : 100;
    const pluginScore =
      totalSites > 0
        ? ((totalSites - sitesWithOutdatedPlugins) / totalSites) * 100
        : 100;
    const backupScore =
      totalSites > 0
        ? ((totalSites - sitesWithStaleBackups) / totalSites) * 100
        : 100;

    const healthScore = Math.round(
      uptimeScore * uptimeWeight +
        securityScore * securityWeight +
        pluginScore * pluginWeight +
        backupScore * backupWeight,
    );

    return {
      success: true,
      data: {
        totalSites,
        onlineCount,
        offlineCount,
        averageUptimePercent,
        sitesWithSecurityIssues,
        sitesWithOutdatedPlugins,
        sitesWithStaleBackups,
        healthScore,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load overview",
    };
  }
}

export async function getSiteReport(
  siteId: string,
): Promise<ActionResult<SiteReport>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const site = await siteRepo.findById(siteId);
    if (!site || site.userId !== userId)
      return { success: false, error: "Site not found" };

    const report = await buildSiteReport(site);
    return { success: true, data: report };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load report",
    };
  }
}

export async function exportNetworkCSV(): Promise<ActionResult<string>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const sites = await siteRepo.findByUserId(userId);
    const reports = await Promise.all(sites.map(buildSiteReport));

    const headers = [
      "Site Name",
      "URL",
      "Status",
      "Uptime %",
      "Security",
      "Plugins (Active/Total)",
      "SEO Score",
      "Last Backup",
      "Last Checked",
    ];

    const rows = reports.map((r) => [
      r.site.name,
      r.site.url,
      r.site.status,
      r.uptimePercent.toFixed(2),
      r.securityStatus ?? "N/A",
      `${r.pluginsActive}/${r.pluginsTotal}`,
      r.seoScore !== null ? r.seoScore.toString() : "N/A",
      r.lastBackupAt ? r.lastBackupAt.toISOString() : "Never",
      r.site.lastCheckedAt ? r.site.lastCheckedAt.toISOString() : "Never",
    ]);

    return { success: true, data: generateCSV(headers, rows) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export CSV",
    };
  }
}

export async function exportSiteReportCSV(
  siteId: string,
): Promise<ActionResult<string>> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const site = await siteRepo.findById(siteId);
    if (!site || site.userId !== userId)
      return { success: false, error: "Site not found" };

    const report = await buildSiteReport(site);

    const headers = ["Metric", "Value"];
    const rows = [
      ["Site Name", report.site.name],
      ["URL", report.site.url],
      ["Status", report.site.status],
      ["WP Version", report.site.wpVersion ?? "N/A"],
      ["PHP Version", report.site.phpVersion ?? "N/A"],
      ["Uptime %", report.uptimePercent.toFixed(2)],
      [
        "Response Time (ms)",
        report.responseTimeMs !== null ? report.responseTimeMs.toString() : "N/A",
      ],
      ["Security Status", report.securityStatus ?? "N/A"],
      ["Security Findings", report.securityFindingsCount.toString()],
      ["Plugins (Total)", report.pluginsTotal.toString()],
      ["Plugins (Active)", report.pluginsActive.toString()],
      ["Plugins (Outdated)", report.pluginsOutdated.toString()],
      ["SEO Score", report.seoScore !== null ? report.seoScore.toString() : "N/A"],
      ["Log Errors", report.logErrors.toString()],
      ["Log Warnings", report.logWarnings.toString()],
      ["Backup Status", report.backupStatus ?? "N/A"],
      [
        "Last Backup",
        report.lastBackupAt ? report.lastBackupAt.toISOString() : "Never",
      ],
      [
        "Last Checked",
        report.site.lastCheckedAt
          ? report.site.lastCheckedAt.toISOString()
          : "Never",
      ],
    ];

    return { success: true, data: generateCSV(headers, rows) };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export site CSV",
    };
  }
}
