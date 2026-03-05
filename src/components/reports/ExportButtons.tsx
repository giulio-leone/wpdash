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
    await Promise.all(
      sites.map((site) =>
        downloadFile(`/api/reports/sites/${site.id}/csv`, `site-report-${site.id}.csv`),
      ),
    );
  }, [downloadFile, sites]);

  const handlePdfExport = useCallback(async () => {
    // Dynamic import to keep PDF lib out of initial bundle
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    const date = new Date().toLocaleDateString("en-GB");

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text("WP Dash — Network Health Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${date}  |  Total sites: ${sites.length}`, 14, 25);

    // Table
    autoTable(doc, {
      startY: 32,
      head: [["Site Name", "URL", "Status", "ID"]],
      body: sites.map((s) => [
        s.name,
        s.url,
        s.status ?? "unknown",
        s.id.slice(0, 8) + "…",
      ]),
      headStyles: { fillColor: [30, 58, 138] },
      alternateRowStyles: { fillColor: [240, 244, 255] },
      styles: { fontSize: 9 },
    });

    doc.save(`wpdash-report-${date.replace(/\//g, "-")}.pdf`);
  }, [sites]);

  const btnClass = cn(
    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
    "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
  );

  return (
    <div className="flex gap-2">
      <button type="button" onClick={handleNetworkExport} className={btnClass}>
        Export Network CSV
      </button>
      <button type="button" onClick={handleAllSitesExport} className={btnClass}>
        Export All Sites
      </button>
      <button
        type="button"
        onClick={handlePdfExport}
        data-testid="export-pdf"
        className={cn(btnClass, "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-600 dark:bg-brand-900/20 dark:text-brand-300")}
      >
        📄 Export PDF Report
      </button>
    </div>
  );
}
