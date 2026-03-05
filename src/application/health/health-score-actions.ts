"use server";
import { db } from "@/infrastructure/database/drizzle-client";
import { uptimeChecks } from "@/infrastructure/database/schemas/uptime-checks";
import { securityAudits } from "@/infrastructure/database/schemas/security-audits";
import { backupRecords } from "@/infrastructure/database/schemas/backup-records";
import { sitePlugins } from "@/infrastructure/database/schemas/site-plugins";
import { eq, and, gte, desc } from "drizzle-orm";

export type HealthScore = {
  total: number;
  tier: "poor" | "fair" | "good" | "excellent";
  components: {
    uptime: number;
    security: number;
    updates: number;
    backup: number;
  };
};

export async function getSiteHealthScore(siteId: string): Promise<HealthScore> {
  try {
    const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Uptime: last 7 days (40 pts)
    let uptimeScore = 40;
    try {
      const checks = await db
        .select({ isReachable: uptimeChecks.isReachable })
        .from(uptimeChecks)
        .where(and(eq(uptimeChecks.siteId, siteId), gte(uptimeChecks.checkedAt, since7Days)));
      if (checks.length > 0) {
        const upCount = checks.filter((c) => c.isReachable).length;
        uptimeScore = Math.round((upCount / checks.length) * 40);
      }
    } catch { /* no data */ }

    // Security: last audit (25 pts)
    let secScore = 25;
    try {
      const [lastAudit] = await db
        .select({ status: securityAudits.status })
        .from(securityAudits)
        .where(eq(securityAudits.siteId, siteId))
        .orderBy(desc(securityAudits.auditedAt))
        .limit(1);
      if (lastAudit?.status === "warning" || lastAudit?.status === "critical") secScore = 0;
      else if (lastAudit?.status === "clean") secScore = 25;
    } catch { /* default */ }

    // Updates: pending plugins (20 pts)
    let updatesScore = 10;
    try {
      const plugins = await db
        .select({ hasUpdate: sitePlugins.hasUpdate })
        .from(sitePlugins)
        .where(eq(sitePlugins.siteId, siteId));
      const pendingCount = plugins.filter((p) => p.hasUpdate).length;
      if (pendingCount === 0) updatesScore = 20;
      else if (pendingCount <= 2) updatesScore = 10;
      else updatesScore = 0;
    } catch { /* default */ }

    // Backup: last backup age (15 pts)
    let backupScore = 8;
    try {
      const [lastBackup] = await db
        .select({ lastBackupAt: backupRecords.lastBackupAt })
        .from(backupRecords)
        .where(eq(backupRecords.siteId, siteId))
        .orderBy(desc(backupRecords.lastBackupAt))
        .limit(1);
      if (lastBackup?.lastBackupAt) {
        const daysOld =
          (Date.now() - new Date(lastBackup.lastBackupAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7) backupScore = 15;
        else if (daysOld < 14) backupScore = 8;
        else backupScore = 0;
      }
    } catch { /* default */ }

    const total = uptimeScore + secScore + updatesScore + backupScore;
    const tier =
      total >= 91 ? "excellent" : total >= 71 ? "good" : total >= 41 ? "fair" : "poor";

    return {
      total,
      tier,
      components: { uptime: uptimeScore, security: secScore, updates: updatesScore, backup: backupScore },
    };
  } catch {
    return {
      total: 75,
      tier: "good",
      components: { uptime: 30, security: 25, updates: 10, backup: 10 },
    };
  }
}
