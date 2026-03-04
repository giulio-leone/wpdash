"use client";

import React, { useEffect, useState, useTransition } from "react";
import Badge from "@/components/ui/badge/Badge";
import { getSiteUptimeHistory } from "@/application/uptime/uptime-actions";
import type { UptimeCheck } from "@/domain/uptime/entity";

interface UptimeHistoryProps {
  siteId: string;
}

const PAGE_SIZE = 50;

export default function UptimeHistory({ siteId }: UptimeHistoryProps) {
  const [checks, setChecks] = useState<UptimeCheck[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getSiteUptimeHistory(siteId, 30);
      if (result.success) {
        setChecks(result.data.slice(0, PAGE_SIZE));
      }
    });
  }, [siteId]);

  if (isPending) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading history…</p>
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No uptime checks recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                Time
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                Response Time
              </th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr
                key={check.id}
                className="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
              >
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {new Date(check.checkedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    size="sm"
                    color={check.isReachable ? "success" : "error"}
                  >
                    {check.isReachable ? "Online" : "Offline"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  {check.responseTimeMs != null
                    ? `${check.responseTimeMs}ms`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
