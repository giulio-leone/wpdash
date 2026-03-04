"use client";

import React, { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { checkBackupFreshness } from "@/application/backup/backup-actions";

interface BackupAlertProps {
  siteId: string;
  thresholdDays?: number;
}

export default function BackupAlert({ siteId, thresholdDays = 7 }: BackupAlertProps) {
  const [isStale, setIsStale] = useState(false);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await checkBackupFreshness(siteId, thresholdDays);
      if (result.success) {
        setIsStale(result.data.isStale);
        setDaysSince(result.data.daysSinceBackup);
      }
    });
  }, [siteId, thresholdDays]);

  if (!isStale || dismissed) return null;

  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between rounded-xl border px-4 py-3",
        "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10",
      )}
    >
      <p className="text-sm font-medium text-error-700 dark:text-error-400">
        {daysSince !== null
          ? `⚠ Last backup was ${daysSince} days ago — exceeds ${thresholdDays}-day threshold.`
          : `⚠ No backup found — consider setting up automated backups.`}
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="ml-4 shrink-0 text-sm font-medium text-error-500 hover:text-error-700 dark:text-error-400"
      >
        Dismiss
      </button>
    </div>
  );
}
