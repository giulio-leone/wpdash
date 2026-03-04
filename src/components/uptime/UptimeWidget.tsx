"use client";

import React, { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  checkSiteUptime,
  getSiteUptimeStatus,
} from "@/application/uptime/uptime-actions";
import type { UptimeCheck } from "@/domain/uptime/entity";
import UptimeChart from "./UptimeChart";

interface UptimeWidgetProps {
  siteId: string;
}

type UptimeStatus = "online" | "offline" | "degraded" | "unknown";

function deriveStatus(check: UptimeCheck | null): UptimeStatus {
  if (!check) return "unknown";
  if (check.isReachable) return "online";
  if (check.statusCode && check.statusCode >= 500) return "degraded";
  return "offline";
}

const statusConfig: Record<
  UptimeStatus,
  { label: string; color: "success" | "error" | "warning" | "light"; dotClass: string }
> = {
  online: {
    label: "Online",
    color: "success",
    dotClass: "bg-success-500",
  },
  offline: {
    label: "Offline",
    color: "error",
    dotClass: "bg-error-500",
  },
  degraded: {
    label: "Degraded",
    color: "warning",
    dotClass: "bg-warning-500",
  },
  unknown: {
    label: "Unknown",
    color: "light",
    dotClass: "bg-gray-400",
  },
};

export default function UptimeWidget({ siteId }: UptimeWidgetProps) {
  const [latest, setLatest] = useState<UptimeCheck | null>(null);
  const [percentage, setPercentage] = useState<number>(100);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  function loadStatus() {
    startTransition(async () => {
      const result = await getSiteUptimeStatus(siteId);
      if (result.success) {
        setLatest(result.data.latest);
        setPercentage(result.data.uptimePercentage);
      }
    });
  }

  function handleCheck() {
    startTransition(async () => {
      const result = await checkSiteUptime(siteId);
      if (result.success) {
        setLatest(result.data);
        loadStatus();
      }
    });
  }

  const status = deriveStatus(latest);
  const config = statusConfig[status];

  return (
    <div className="space-y-6">
      {/* Status overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Current status */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn("inline-block h-2.5 w-2.5 rounded-full", config.dotClass)}
            />
            <Badge size="sm" color={config.color}>
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Uptime percentage */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Uptime (7d)</p>
          <p
            className={cn(
              "mt-2 text-xl font-bold",
              percentage >= 99
                ? "text-success-600 dark:text-success-400"
                : percentage >= 95
                  ? "text-warning-600 dark:text-warning-400"
                  : "text-error-600 dark:text-error-400",
            )}
          >
            {percentage}%
          </p>
        </div>

        {/* Response time */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Response Time</p>
          <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
            {latest?.responseTimeMs != null ? `${latest.responseTimeMs}ms` : "—"}
          </p>
        </div>

        {/* Last checked */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Last Checked</p>
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {latest?.checkedAt
              ? new Date(latest.checkedAt).toLocaleString()
              : "Never"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleCheck} disabled={isPending}>
          {isPending ? "Checking…" : "Check Now"}
        </Button>
      </div>

      {/* Chart */}
      <UptimeChart siteId={siteId} />
    </div>
  );
}
