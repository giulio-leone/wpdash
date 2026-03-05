"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { getSites } from "@/application/site/site-actions";
import { bulkUpdatePlugins, type BulkUpdateResult } from "@/application/plugin/plugin-actions";
import type { Site } from "@/domain/site/entity";

interface Props {
  pluginSlug: string;
  currentSiteId: string;
  onClose: () => void;
}

export default function BulkUpdatePanel({ pluginSlug, currentSiteId, onClose }: Props) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [results, setResults] = useState<BulkUpdateResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSites() {
      const result = await getSites();
      if (result.success) {
        const otherSites = result.data.filter((s) => s.id !== currentSiteId);
        setSites(otherSites);
      }
      setLoading(false);
    }
    void fetchSites();
  }, [currentSiteId]);

  const toggleSite = (siteId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sites.length) setSelected(new Set());
    else setSelected(new Set(sites.map((s) => s.id)));
  };

  const handleBulkUpdate = async () => {
    if (selected.size === 0) return;
    setUpdating(true);
    setError(null);
    const result = await bulkUpdatePlugins(Array.from(selected), pluginSlug);
    if (result.success) setResults(result.data);
    else setError(result.error);
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border bg-white p-6",
          "dark:border-gray-800 dark:bg-gray-900",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bulk Update: {pluginSlug}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : results ? (
          /* Results summary */
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Update completed
            </p>
            {results.map((r) => {
              const site = sites.find((s) => s.id === r.siteId);
              return (
                <div
                  key={r.siteId}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                >
                  <span className="text-sm text-gray-900 dark:text-white">
                    {site?.name ?? r.siteId}
                  </span>
                  <Badge size="sm" color={r.success ? "success" : "error"}>
                    {r.success ? "Success" : r.error ?? "Failed"}
                  </Badge>
                </div>
              );
            })}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          /* Site selector */
          <div className="space-y-3">
            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            )}

            {sites.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No other sites available.
              </p>
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={selected.size === sites.length}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-brand-500 dark:border-gray-600"
                  />
                  Select all ({sites.length} sites)
                </label>

                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {sites.map((site) => (
                    <label
                      key={site.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                        selected.has(site.id)
                          ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                          : "border-gray-200 dark:border-gray-800",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(site.id)}
                        onChange={() => toggleSite(site.id)}
                        className="rounded border-gray-300 text-brand-500 dark:border-gray-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {site.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{site.url}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleBulkUpdate}
                disabled={updating || selected.size === 0}
              >
                {updating ? "Updating…" : `Update ${selected.size} Site${selected.size !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
