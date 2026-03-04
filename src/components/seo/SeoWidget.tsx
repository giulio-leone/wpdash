"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { getLatestSeoStatus, runSeoAudit } from "@/application/seo/seo-actions";
import type { SeoAudit } from "@/domain/seo/entity";

interface Props {
  siteId: string;
  onAuditComplete?: () => void;
}

function scoreColor(score: number): "success" | "warning" | "error" {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "error";
}

export default function SeoWidget({ siteId, onAuditComplete }: Props) {
  const [audit, setAudit] = useState<SeoAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      const result = await getLatestSeoStatus(siteId);
      if (result.success) setAudit(result.data);
      setLoading(false);
    }
    void fetch();
  }, [siteId]);

  const handleRunAudit = async () => {
    setRunning(true);
    setError(null);
    const result = await runSeoAudit(siteId);
    if (result.success) {
      setAudit(result.data);
      onAuditComplete?.();
    } else {
      setError(result.error);
    }
    setRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          SEO Overview
        </h3>
        <Button size="sm" variant="primary" onClick={handleRunAudit} disabled={running}>
          {running ? "Scanning…" : "Run Audit"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {!audit ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          No SEO audit yet. Click &quot;Run Audit&quot; to analyze your site.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Score */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {audit.score}
              </span>
              <Badge size="sm" color={scoreColor(audit.score)}>
                /100
              </Badge>
            </div>
          </div>

          {/* Title */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Title</p>
            <Badge size="sm" color={audit.title ? "success" : "error"}>
              {audit.title ? "Present" : "Missing"}
            </Badge>
          </div>

          {/* Meta Description */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Meta Description</p>
            <Badge
              size="sm"
              color={audit.metaDescription ? "success" : "error"}
            >
              {audit.metaDescription ? "Present" : "Missing"}
            </Badge>
          </div>

          {/* Headers */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Headers</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              H1: {audit.headersStructure.h1.length} · H2: {audit.headersStructure.h2.length} · H3: {audit.headersStructure.h3.length}
            </p>
          </div>

          {/* Last Audit */}
          <div
            className={cn(
              "col-span-2 rounded-xl border border-gray-200 bg-white p-4 sm:col-span-4",
              "dark:border-gray-800 dark:bg-gray-900",
            )}
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last Audit: {new Date(audit.auditedAt).toLocaleString()} — {audit.pageUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
