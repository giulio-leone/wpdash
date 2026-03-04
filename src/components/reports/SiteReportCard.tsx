"use client";

import React from "react";
import { cn } from "@/lib/cn";
import type { SiteReport } from "@/application/report/report-actions";

interface Props {
  siteId: string;
  report: SiteReport | null;
}

function statusDot(status: string) {
  const color =
    status === "online"
      ? "bg-green-500"
      : status === "offline"
        ? "bg-red-500"
        : status === "degraded"
          ? "bg-yellow-500"
          : "bg-gray-400";
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", color)}
    />
  );
}

function securityBadge(status: string | null) {
  if (!status) return <span className="text-gray-400">N/A</span>;
  const cls =
    status === "clean"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : status === "warning"
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return (
    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", cls)}>
      {status}
    </span>
  );
}

export default function SiteReportCard({ report }: Props) {
  if (!report) {
    return (
      <div className="flex items-center justify-center px-4 py-3 text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-sm sm:gap-6">
      <div className="flex min-w-[10rem] items-center gap-2">
        {statusDot(report.site.status)}
        <span className="font-medium text-gray-900 dark:text-white">
          {report.site.name}
        </span>
      </div>
      <div className="text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {report.uptimePercent.toFixed(1)}%
        </span>{" "}
        uptime
      </div>
      <div>{securityBadge(report.securityStatus)}</div>
      <div className="text-gray-500 dark:text-gray-400">
        {report.pluginsActive}/{report.pluginsTotal} plugins
        {report.pluginsOutdated > 0 && (
          <span className="ml-1 text-yellow-600 dark:text-yellow-400">
            ({report.pluginsOutdated} outdated)
          </span>
        )}
      </div>
      <div className="text-gray-500 dark:text-gray-400">
        SEO{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {report.seoScore !== null ? report.seoScore : "N/A"}
        </span>
      </div>
    </div>
  );
}
