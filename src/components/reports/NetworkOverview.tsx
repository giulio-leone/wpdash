"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { NetworkOverview as NetworkOverviewData } from "@/application/report/report-actions";
import type { SiteReport } from "@/application/report/report-actions";
import type { Site } from "@/domain/site/entity";
import SiteReportCard from "./SiteReportCard";
import ExportButtons from "./ExportButtons";

interface Props {
  overview: NetworkOverviewData | null;
  sites: Site[];
}

function healthColor(score: number): string {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-yellow-500";
  return "text-red-500";
}

function healthBg(score: number): string {
  if (score >= 90) return "bg-green-50 dark:bg-green-900/20";
  if (score >= 70) return "bg-yellow-50 dark:bg-yellow-900/20";
  return "bg-red-50 dark:bg-red-900/20";
}

export default function NetworkOverview({ overview, sites }: Props) {
  const [siteReports, setSiteReports] = useState<Record<string, SiteReport>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const { getSiteReport } = await import(
          "@/application/report/report-actions"
        );
        const results = await Promise.all(
          sites.map(async (site) => {
            const result = await getSiteReport(site.id);
            return { id: site.id, report: result.success ? result.data : null };
          }),
        );
        const map: Record<string, SiteReport> = {};
        for (const r of results) {
          if (r.report) map[r.id] = r.report;
        }
        setSiteReports(map);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [sites]);

  if (!overview) {
    return (
      <div className="p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Failed to load report data.
        </p>
      </div>
    );
  }

  const cards = [
    { label: "Total Sites", value: overview.totalSites.toString() },
    {
      label: "Online",
      value: `${overview.totalSites > 0 ? Math.round((overview.onlineCount / overview.totalSites) * 100) : 0}%`,
    },
    {
      label: "Security Issues",
      value: overview.sitesWithSecurityIssues.toString(),
      alert: overview.sitesWithSecurityIssues > 0,
    },
    {
      label: "Outdated Plugins",
      value: overview.sitesWithOutdatedPlugins.toString(),
      alert: overview.sitesWithOutdatedPlugins > 0,
    },
    {
      label: "Stale Backups",
      value: overview.sitesWithStaleBackups.toString(),
      alert: overview.sitesWithStaleBackups > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Network Reports
        </h1>
        <ExportButtons sites={sites} />
      </div>

      {/* Health Score */}
      <div
        className={cn(
          "flex items-center gap-4 rounded-xl border p-6",
          "border-gray-200 dark:border-gray-700",
          healthBg(overview.healthScore),
        )}
      >
        <div
          className={cn(
            "text-5xl font-bold",
            healthColor(overview.healthScore),
          )}
        >
          {overview.healthScore}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Overall Health Score
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Avg. uptime {overview.averageUptimePercent.toFixed(1)}% over 7 days
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-xl border p-4",
              "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
            )}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold",
                card.alert
                  ? "text-red-500"
                  : "text-gray-900 dark:text-white",
              )}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Site Health Table */}
      <div
        className={cn(
          "rounded-xl border",
          "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        )}
      >
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Site Health
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading site reports…
          </div>
        ) : sites.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No sites found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sites.map((site) => (
              <SiteReportCard
                key={site.id}
                siteId={site.id}
                report={siteReports[site.id] ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
