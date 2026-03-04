"use client";

import React, { useEffect, useState, useTransition } from "react";
import { getBackupHistory } from "@/application/backup/backup-actions";
import type { BackupRecord } from "@/domain/backup/entity";

interface BackupHistoryProps {
  siteId: string;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function BackupHistory({ siteId }: BackupHistoryProps) {
  const [records, setRecords] = useState<BackupRecord[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getBackupHistory(siteId);
      if (result.success) {
        setRecords(result.data);
      }
    });
  }, [siteId]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Backup History</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Size</th>
              <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-gray-400">
                  No backup records found.
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="whitespace-nowrap px-3 py-2 text-gray-900 dark:text-gray-100">
                    {rec.lastBackupAt
                      ? new Date(rec.lastBackupAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                    {formatBytes(rec.archiveSizeBytes)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        rec.status === "recent"
                          ? "text-success-500"
                          : rec.status === "stale"
                            ? "text-error-500"
                            : "text-gray-400"
                      }
                    >
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
