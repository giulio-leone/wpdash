"use client";

import React, { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { getSiteUptimeHistory } from "@/application/uptime/uptime-actions";
import type { UptimeCheck } from "@/domain/uptime/entity";

interface UptimeChartProps {
  siteId: string;
  checks?: UptimeCheck[];
}

export default function UptimeChart({ siteId, checks: externalChecks }: UptimeChartProps) {
  const [checks, setChecks] = useState<UptimeCheck[]>(externalChecks ?? []);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (externalChecks && externalChecks.length > 0) {
      setChecks(externalChecks);
      return;
    }
    startTransition(async () => {
      const result = await getSiteUptimeHistory(siteId, 7);
      if (result.success) {
        setChecks(result.data);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Group checks into hourly buckets for the last 7 days
  const now = new Date();
  const bucketCount = 7 * 24; // 168 hours
  const buckets: Array<{ hour: Date; status: "up" | "down" | "none"; avgMs: number }> = [];

  for (let i = bucketCount - 1; i >= 0; i--) {
    const hour = new Date(now);
    hour.setMinutes(0, 0, 0);
    hour.setHours(hour.getHours() - i);

    const hourEnd = new Date(hour);
    hourEnd.setHours(hourEnd.getHours() + 1);

    const hourChecks = checks.filter((c) => {
      const t = new Date(c.checkedAt).getTime();
      return t >= hour.getTime() && t < hourEnd.getTime();
    });

    if (hourChecks.length === 0) {
      buckets.push({ hour, status: "none", avgMs: 0 });
    } else {
      const allUp = hourChecks.every((c) => c.isReachable);
      const avgMs = Math.round(
        hourChecks.reduce((s, c) => s + (c.responseTimeMs ?? 0), 0) /
          hourChecks.length,
      );
      buckets.push({ hour, status: allUp ? "up" : "down", avgMs });
    }
  }

  if (isPending) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading chart…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
        Uptime — Last 7 Days
      </h3>
      <div className="flex items-end gap-px overflow-x-auto">
        {buckets.map((b, i) => (
          <div
            key={i}
            title={`${b.hour.toLocaleString()}${b.status !== "none" ? ` — ${b.avgMs}ms` : ""}`}
            className={cn(
              "h-6 w-1 flex-shrink-0 rounded-sm transition-colors",
              b.status === "up" && "bg-success-500",
              b.status === "down" && "bg-error-500",
              b.status === "none" && "bg-gray-200 dark:bg-gray-700",
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>7d ago</span>
        <span>Now</span>
      </div>
      {/* Legend */}
      <div className="mt-3 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-success-500" />
          Online
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-error-500" />
          Offline
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-gray-200 dark:bg-gray-700" />
          No data
        </span>
      </div>
    </div>
  );
}
