"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { getSiteLogs, fetchSiteLogs } from "@/application/log/log-actions";
import type { SiteLog, LogLevel } from "@/domain/log/entity";

const PAGE_SIZE = 25;

const levelColors: Record<string, string> = {
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  critical: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
  notice: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  deprecated: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
  info: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
};

interface LogViewerProps {
  siteId: string;
}

export default function LogViewer({ siteId }: LogViewerProps) {
  const [logs, setLogs] = useState<SiteLog[]>([]);
  const [level, setLevel] = useState<LogLevel | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isFetching, startFetch] = useTransition();

  const loadLogs = useCallback(() => {
    startTransition(async () => {
      const result = await getSiteLogs(siteId, {
        level: level || undefined,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      if (result.success) {
        setLogs(result.data);
      }
    });
  }, [siteId, level, search, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function handleRefresh() {
    startFetch(async () => {
      await fetchSiteLogs(siteId);
      loadLogs();
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value as LogLevel | "");
              setPage(0);
            }}
            className={cn(
              "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm",
              "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
            )}
          >
            <option value="">All Levels</option>
            <option value="critical">Critical</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="notice">Notice</option>
            <option value="deprecated">Deprecated</option>
            <option value="info">Info</option>
          </select>

          <input
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className={cn(
              "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm",
              "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
              "placeholder:text-gray-400",
            )}
          />
        </div>

        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white",
            "hover:bg-brand-600 disabled:opacity-50",
          )}
        >
          {isFetching ? "Fetching…" : "Refresh"}
        </button>
      </div>

      {/* Log list */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Time</th>
              <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Level</th>
              <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Message</th>
              <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Source</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-gray-400">
                  No log entries found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500 dark:text-gray-400">
                    {new Date(log.loggedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                        levelColors[log.level] ?? levelColors.info,
                      )}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="max-w-md truncate px-3 py-2 text-gray-900 dark:text-gray-100">
                    {log.message}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {log.source ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || isPending}
          className={cn(
            "rounded-lg border border-gray-200 px-3 py-1.5 text-sm",
            "hover:bg-gray-50 disabled:opacity-50",
            "dark:border-gray-700 dark:hover:bg-gray-800",
          )}
        >
          Previous
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">Page {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={logs.length < PAGE_SIZE || isPending}
          className={cn(
            "rounded-lg border border-gray-200 px-3 py-1.5 text-sm",
            "hover:bg-gray-50 disabled:opacity-50",
            "dark:border-gray-700 dark:hover:bg-gray-800",
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}
