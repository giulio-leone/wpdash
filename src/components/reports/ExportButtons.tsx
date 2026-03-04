"use client";

import React, { useCallback } from "react";
import { cn } from "@/lib/cn";
import type { Site } from "@/domain/site/entity";

interface Props {
  sites: Site[];
}

export default function ExportButtons({ sites }: Props) {
  const downloadFile = useCallback(
    async (url: string, fallbackName: string) => {
      const response = await fetch(url);
      if (!response.ok) return;
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="?(.+?)"?$/)?.[1] ?? fallbackName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    },
    [],
  );

  const handleNetworkExport = useCallback(() => {
    downloadFile("/api/reports/network/csv", "network-report.csv");
  }, [downloadFile]);

  const handleAllSitesExport = useCallback(async () => {
    for (const site of sites) {
      await downloadFile(
        `/api/reports/sites/${site.id}/csv`,
        `site-report-${site.id}.csv`,
      );
    }
  }, [downloadFile, sites]);

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleNetworkExport}
        className={cn(
          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
          "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        )}
      >
        Export Network CSV
      </button>
      <button
        type="button"
        onClick={handleAllSitesExport}
        className={cn(
          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
          "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
        )}
      >
        Export All Sites
      </button>
    </div>
  );
}
