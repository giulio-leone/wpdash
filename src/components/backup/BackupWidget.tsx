"use client";

import React, { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { getBackupStatus, fetchBackupStatus } from "@/application/backup/backup-actions";
import type { BackupRecord } from "@/domain/backup/entity";

interface BackupWidgetProps {
  siteId: string;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function relativeTime(date: Date | null): string {
  if (!date) return "Never";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusIndicator(lastBackupAt: Date | null): { color: string; label: string } {
  if (!lastBackupAt) return { color: "bg-gray-400", label: "No backup" };
  const hours = (Date.now() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60);
  if (hours < 24) return { color: "bg-success-500", label: "Recent" };
  if (hours < 24 * 7) return { color: "bg-warning-500", label: "Aging" };
  return { color: "bg-error-500", label: "Stale" };
}

export default function BackupWidget({ siteId }: BackupWidgetProps) {
  const [record, setRecord] = useState<BackupRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isFetching, startFetch] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getBackupStatus(siteId);
      if (result.success) {
        setRecord(result.data);
      }
    });
  }, [siteId]);

  function handleRefresh() {
    startFetch(async () => {
      const result = await fetchBackupStatus(siteId);
      if (result.success) {
        setRecord(result.data);
      }
    });
  }

  const status = statusIndicator(record?.lastBackupAt ?? null);

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Backup Status</h3>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className={cn(
            "rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white",
            "hover:bg-brand-600 disabled:opacity-50",
          )}
        >
          {isFetching ? "Fetching…" : "Refresh"}
        </button>
      </div>

      {isPending ? (
        <div className="text-sm text-gray-400">Loading…</div>
      ) : !record ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No backup data available. Click Refresh to fetch.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Backup</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {relativeTime(record.lastBackupAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Archive Size</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatBytes(record.archiveSizeBytes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <div className="flex items-center gap-2">
              <span className={cn("inline-block h-2.5 w-2.5 rounded-full", status.color)} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {status.label}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Checked</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {new Date(record.checkedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
