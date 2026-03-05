import type { Metadata } from "next";
import React from "react";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { notifications } from "@/infrastructure/database/schemas/notifications";
import { sitePlugins } from "@/infrastructure/database/schemas/site-plugins";
import { securityAudits } from "@/infrastructure/database/schemas/security-audits";
import { eq, desc, inArray, and } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircleIcon, AlertIcon, BoltIcon, BellIcon, GridIcon, CloseLineIcon, InfoIcon, PieChartIcon } from "@/icons";

export const metadata: Metadata = {
  title: "Dashboard | WP Dash",
  description: "Manage your WordPress sites from a single dashboard",
};

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function issueBadgeClass(issue: string): string {
  if (issue.includes("critical") || issue === "Offline")
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (issue === "Degraded" || issue.includes("warning"))
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (issue.includes("Update"))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
}

function notifIcon(type: string): React.ReactNode {
  if (type === "site_offline") return <CloseLineIcon className="w-4 h-4 text-error-500" />;
  if (type === "update_available") return <BoltIcon className="w-4 h-4 text-brand-500" />;
  if (type === "backup_stale") return <AlertIcon className="w-4 h-4 text-warning-500" />;
  return <InfoIcon className="w-4 h-4 text-gray-400" />;
}

function StatCard({
  label,
  value,
  icon,
  borderClass,
  valueClass = "text-gray-900 dark:text-white",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  borderClass: string;
  valueClass?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 dark:bg-gray-900 ${borderClass}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Fetch all user's sites
  const allSites = await db
    .select()
    .from(sites)
    .where(eq(sites.userId, user.id));
  const siteIds = allSites.map((s) => s.id);

  const totalSites = allSites.length;
  const onlineSites = allSites.filter((s) => s.status === "online").length;

  // Batch independent queries in parallel after sites are loaded
  const [updatesRows, recentNotifications, secRows] = await Promise.all([
    siteIds.length > 0
      ? db
          .selectDistinct({ siteId: sitePlugins.siteId })
          .from(sitePlugins)
          .where(and(eq(sitePlugins.hasUpdate, true), inArray(sitePlugins.siteId, siteIds)))
      : Promise.resolve([]),
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(5),
    siteIds.length > 0
      ? db
          .select({ siteId: securityAudits.siteId, status: securityAudits.status })
          .from(securityAudits)
          .where(inArray(securityAudits.siteId, siteIds))
          .orderBy(desc(securityAudits.auditedAt))
      : Promise.resolve([]),
  ]);

  const sitesWithUpdatesIds = updatesRows.map((r) => r.siteId);
  const criticalAlerts = recentNotifications.filter((n) => !n.read).length;

  // Build "sites needing attention" map
  const attentionMap = new Map<string, { siteId: string; issues: string[] }>();

  allSites
    .filter((s) => s.status === "offline" || s.status === "degraded")
    .forEach((s) => {
      const entry = attentionMap.get(s.id) ?? { siteId: s.id, issues: [] };
      entry.issues.push(s.status === "offline" ? "Offline" : "Degraded");
      attentionMap.set(s.id, entry);
    });

  sitesWithUpdatesIds.forEach((id) => {
    const entry = attentionMap.get(id) ?? { siteId: id, issues: [] };
    entry.issues.push("Updates pending");
    attentionMap.set(id, entry);
  });

  // Security issues (latest audit per site)
  if (secRows.length > 0) {
    const latestPerSite = new Map<string, string>();
    for (const row of secRows) {
      if (!latestPerSite.has(row.siteId)) latestPerSite.set(row.siteId, row.status);
    }
    latestPerSite.forEach((status, siteId) => {
      if (status === "warning" || status === "critical") {
        const entry = attentionMap.get(siteId) ?? { siteId, issues: [] };
        entry.issues.push(status === "critical" ? "Security critical" : "Security warning");
        attentionMap.set(siteId, entry);
      }
    });
  }

  const siteById = new Map(allSites.map((s) => [s.id, s]));
  const attentionSites = Array.from(attentionMap.values())
    .map((entry) => ({ site: siteById.get(entry.siteId)!, issues: entry.issues }))
    .filter((e) => e.site)
    .sort((a, b) => {
      const score = (issues: string[]) => {
        if (issues.some((i) => i.includes("critical"))) return 3;
        if (issues.includes("Offline")) return 2;
        if (issues.some((i) => i.includes("warning"))) return 1;
        return 0;
      };
      return score(b.issues) - score(a.issues);
    });

  return (
    <div className="space-y-6">
      {/* Page header + quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-2 text-xl font-bold text-gray-900 dark:text-white">Overview</h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link
            href="/sites?add=true"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <span>+</span> Add Site
          </Link>
          <Link
            href="/updates"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <BoltIcon className="h-4 w-4" />
            Network Updates
          </Link>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <PieChartIcon className="h-4 w-4" />
            Export Report
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Sites"
          value={totalSites}
          icon={<GridIcon className="w-5 h-5 text-gray-400" />}
          borderClass="border-gray-200 dark:border-gray-700"
        />
        <StatCard
          label="Sites Online"
          value={onlineSites}
          icon={<CheckCircleIcon className="w-5 h-5 text-green-500" />}
          borderClass="border-green-200 dark:border-green-900/50"
          valueClass="text-green-600 dark:text-green-400"
        />
        <StatCard
          label="Pending Updates"
          value={sitesWithUpdatesIds.length}
          icon={<BoltIcon className="w-5 h-5 text-yellow-500" />}
          borderClass="border-yellow-200 dark:border-yellow-900/50"
          valueClass={
            sitesWithUpdatesIds.length > 0
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-gray-900 dark:text-white"
          }
        />
        <StatCard
          label="Unread Alerts"
          value={criticalAlerts}
          icon={<BellIcon className="w-5 h-5 text-red-500" />}
          borderClass="border-red-200 dark:border-red-900/50"
          valueClass={
            criticalAlerts > 0
              ? "text-red-600 dark:text-red-400"
              : "text-gray-900 dark:text-white"
          }
        />
      </div>

      {/* Two-column section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sites needing attention */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Sites Needing Attention
          </h2>
          {attentionSites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircleIcon className="mb-2 h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                All systems go!
              </p>
              <p className="mt-1 text-xs text-gray-400">All sites are healthy.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {attentionSites.map(({ site, issues }) => (
                <li
                  key={site.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                      {site.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">{site.url}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {issues.map((issue) => (
                        <span
                          key={issue}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${issueBadgeClass(issue)}`}
                        >
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/sites/${site.id}`}
                    className="mt-0.5 shrink-0 text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Fix →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent notifications */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Notifications
            </h2>
            <Link
              href="/notifications"
              className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              View all →
            </Link>
          </div>
          {recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircleIcon className="mb-2 h-10 w-10 text-green-500" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">All clear!</p>
              <p className="mt-1 text-xs text-gray-400">No recent alerts.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentNotifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 py-3 first:pt-0 last:pb-0 ${!n.read ? "opacity-100" : "opacity-60"}`}
                >
                  <span className="mt-0.5 shrink-0 flex items-center">{notifIcon(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-gray-700 dark:text-gray-300">
                      {n.message}
                    </p>
                    {n.siteName && (
                      <p className="mt-0.5 text-xs text-gray-400">{n.siteName}</p>
                    )}
                  </div>
                  <span className="mt-0.5 shrink-0 text-xs text-gray-400">
                    {timeAgo(n.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
