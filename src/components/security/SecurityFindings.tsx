"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import type {
  SecurityFinding,
  SecurityFindingSeverity,
} from "@/domain/security/entity";

interface SecurityFindingsProps {
  findings: SecurityFinding[];
}

const severityOrder: SecurityFindingSeverity[] = [
  "critical",
  "high",
  "medium",
  "low",
];

const severityColor: Record<
  SecurityFindingSeverity,
  "error" | "warning" | "info" | "light"
> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "light",
};

type FilterValue = "all" | SecurityFindingSeverity;

export default function SecurityFindings({ findings }: SecurityFindingsProps) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered =
    filter === "all"
      ? findings
      : findings.filter((f) => f.severity === filter);

  const sorted = [...filtered].sort(
    (a, b) =>
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Filter:
        </span>
        {(["all", ...severityOrder] as FilterValue[]).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === value
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
            )}
          >
            {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {/* Findings table */}
      <div className="overflow-x-auto">
        {sorted.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No findings match the selected filter.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Severity
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  File
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Issue
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((finding, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
                >
                  <td className="px-4 py-3">
                    <Badge size="sm" color={severityColor[finding.severity]}>
                      {finding.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-gray-700 dark:text-gray-300">
                      {finding.filePath || "—"}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {finding.issue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
