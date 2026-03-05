"use client";

import React, { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { getLogSummary } from "@/application/log/log-actions";
import type { SeverityCount } from "@/ports/repositories/site-log-repository";

interface LogSummaryProps {
  siteId: string;
  onViewAll?: () => void;
}

const cards: { key: keyof SeverityCount; label: string; color: string }[] = [
  {
    key: "error",
    label: "Errors",
    color: "border-error-200 bg-error-50 text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400",
  },
  {
    key: "warning",
    label: "Warnings",
    color: "border-warning-200 bg-warning-50 text-warning-600 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-400",
  },
  {
    key: "notice",
    label: "Notices",
    color: "border-blue-light-200 bg-blue-light-50 text-blue-light-500 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-blue-light-400",
  },
  {
    key: "deprecated",
    label: "Deprecated",
    color: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400",
  },
];

export default function LogSummary({ siteId, onViewAll }: LogSummaryProps) {
  const [counts, setCounts] = useState<SeverityCount | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getLogSummary(siteId);
      if (result.success) {
        setCounts(result.data);
      }
    });
  }, [siteId]);

  const total = counts
    ? counts.critical + counts.error + counts.warning + counts.notice + counts.deprecated + counts.info
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Log Summary</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-brand-500 hover:text-brand-600"
          >
            View All →
          </button>
        )}
      </div>

      {isPending ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.key}
                className={cn("rounded-xl border p-3 text-center", card.color)}
              >
                <p className="text-2xl font-bold">{counts?.[card.key] ?? 0}</p>
                <p className="text-xs font-medium">{card.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total entries: {total}
          </p>
        </>
      )}
    </div>
  );
}
