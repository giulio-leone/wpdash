"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/button/Button";
import { CheckLineIcon, CloseLineIcon } from "@/icons";
import {
  fetchDBStatus,
  optimizeDatabase,
  cleanupDatabase,
} from "@/application/database/database-actions";
import type { BridgeDBStatusResponse, BridgeDBCleanupAction } from "@/infrastructure/wp-bridge/types";

interface Props {
  siteId: string;
}

export default function DatabaseManager({ siteId }: Props) {
  const [status, setStatus] = useState<BridgeDBStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchDBStatus(siteId);
    if (result.success) {
      setStatus(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleOptimize = useCallback(async () => {
    setActionLoading("optimize");
    setActionResult(null);
    const result = await optimizeDatabase(siteId);
    if (result.success) {
      setActionResult({ success: true, message: `Optimized ${result.tablesOptimized} table${result.tablesOptimized !== 1 ? "s" : ""}.` });
    } else {
      setActionResult({ success: false, message: result.error ?? "Unknown error" });
    }
    setActionLoading(null);
    await load();
  }, [siteId, load]);

  const handleCleanup = useCallback(
    async (action: BridgeDBCleanupAction) => {
      setActionLoading(action);
      setActionResult(null);
      const result = await cleanupDatabase(siteId, action);
      if (result.success) {
        setActionResult({ success: true, message: `${result.message} (${result.rowsDeleted} rows deleted)` });
      } else {
        setActionResult({ success: false, message: result.error ?? "Unknown error" });
      }
      setActionLoading(null);
      await load();
    },
    [siteId, load],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse dark:bg-gray-700/60" />
          ))}
        </div>
        <div className="h-48 rounded-xl bg-gray-200 animate-pulse dark:bg-gray-700/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {error}
      </div>
    );
  }

  if (!status) return null;

  const { pending_cleanup: pc } = status;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card-hover rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Total DB Size</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {status.total_size_mb.toFixed(2)} MB
          </p>
        </div>
        <div className="card-hover rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Total Tables</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {status.total_tables}
          </p>
        </div>
        <div className="card-hover rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">DB Version</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {status.db_version}
          </p>
        </div>
        <div className="card-hover rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Pending Cleanup</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {pc.total.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Pending cleanup detail */}
      <div className={cn(
        "rounded-xl border border-gray-200 bg-white p-4",
        "dark:border-gray-800 dark:bg-gray-900",
      )}>
        <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          Pending Cleanup
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Transients: </span>
            <span className="font-medium text-gray-900 dark:text-white">{pc.transients.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Spam: </span>
            <span className="font-medium text-gray-900 dark:text-white">{pc.spam_comments.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Revisions: </span>
            <span className="font-medium text-gray-900 dark:text-white">{pc.revisions.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Auto-drafts: </span>
            <span className="font-medium text-gray-900 dark:text-white">{pc.auto_drafts.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Action feedback */}
      {actionResult && (
        <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${actionResult.success ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400" : "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"}`}>
          {actionResult.success
            ? <CheckLineIcon className="h-4 w-4 shrink-0" />
            : <CloseLineIcon className="h-4 w-4 shrink-0" />}
          {actionResult.message}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="primary"
          type="button"
          disabled={actionLoading !== null}
          onClick={() => void handleOptimize()}
        >
          {actionLoading === "optimize" ? (
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              Optimizing…
            </span>
          ) : (
            "Optimize All Tables"
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          type="button"
          disabled={actionLoading !== null}
          onClick={() => void handleCleanup("clean_all")}
        >
          {actionLoading === "clean_all" ? "Cleaning…" : "Clean All"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          type="button"
          disabled={actionLoading !== null || pc.transients === 0}
          onClick={() => void handleCleanup("clean_transients")}
        >
          Clean Transients ({pc.transients})
        </Button>

        <Button
          size="sm"
          variant="outline"
          type="button"
          disabled={actionLoading !== null || pc.spam_comments === 0}
          onClick={() => void handleCleanup("clean_spam_comments")}
        >
          Clean Spam ({pc.spam_comments})
        </Button>

        <Button
          size="sm"
          variant="outline"
          type="button"
          disabled={actionLoading !== null || pc.revisions === 0}
          onClick={() => void handleCleanup("clean_post_revisions")}
        >
          Clean Revisions ({pc.revisions})
        </Button>

        <Button
          size="sm"
          variant="outline"
          type="button"
          disabled={actionLoading !== null || pc.auto_drafts === 0}
          onClick={() => void handleCleanup("clean_auto_drafts")}
        >
          Clean Auto-drafts ({pc.auto_drafts})
        </Button>
      </div>

      {/* Tables list */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          Largest Tables
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Rows</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Data (MB)</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total (MB)</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Engine</th>
              </tr>
            </thead>
            <tbody>
              {[...status.tables]
                .sort((a, b) => b.total_size_mb - a.total_size_mb)
                .slice(0, 20)
                .map((table) => (
                  <tr key={table.name} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-900 dark:text-white">
                      {table.name}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                      {table.rows.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                      {table.data_size_mb.toFixed(3)}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                      {table.total_size_mb.toFixed(3)}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{table.engine}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
