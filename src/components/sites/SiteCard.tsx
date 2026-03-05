"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { Site } from "@/domain/site/entity";
import Badge from "@/components/ui/badge/Badge";
import HealthScoreBadge from "@/components/health/HealthScoreBadge";
import { getSiteHealthScore, type HealthScore } from "@/application/health/health-score-actions";
import { cn } from "@/lib/cn";

interface SiteCardProps {
  site: Site;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
}

function statusColor(status: string): "success" | "error" | "light" {
  if (status === "online") return "success";
  if (status === "offline" || status === "degraded") return "error";
  return "light";
}

function statusDotClass(status: string): string {
  if (status === "online") return "bg-success-500";
  if (status === "offline" || status === "degraded") return "bg-error-500";
  return "bg-gray-400";
}

export default function SiteCard({ site, onDelete, onRegenerate }: SiteCardProps) {
  const [hs, setHs] = useState<HealthScore | null>(null);

  useEffect(() => {
    getSiteHealthScore(site.id).then(setHs);
  }, [site.id]);
  return (
    <div
      className={cn(
        "card-hover rounded-2xl border border-gray-200 bg-white p-5",
        "dark:border-gray-800 dark:bg-gray-900",
      )}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn("inline-block h-2.5 w-2.5 rounded-full", statusDotClass(site.status))}
          />
          <Link
            href={`/sites/${site.id}`}
            className="text-base font-semibold text-gray-900 hover:text-brand-500 dark:text-white dark:hover:text-brand-400"
          >
            {site.name}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {hs && <HealthScoreBadge score={hs.total} tier={hs.tier} size="sm" />}
          <Badge size="sm" color={statusColor(site.status)}>
            {site.status}
          </Badge>
        </div>
      </div>

      <a
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-4 block truncate text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
      >
        {site.url}
      </a>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        {site.wpVersion && <span>WP {site.wpVersion}</span>}
        {site.phpVersion && <span>PHP {site.phpVersion}</span>}
        {site.lastCheckedAt && (
          <span>Checked {new Date(site.lastCheckedAt).toLocaleDateString()}</span>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        <Link
          href={`/sites/${site.id}`}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10"
        >
          View
        </Link>
        <button
          onClick={() => onRegenerate(site.id)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Regen Token
        </button>
        <button
          onClick={() => onDelete(site.id)}
          className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
