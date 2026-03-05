"use client";

import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/button/Button";
import { toast } from "@/hooks/useToast";
import type { BridgeUpdatesStatusResponse } from "@/infrastructure/wp-bridge/types";
import { checkUpdates, applyWPCoreUpdate } from "@/application/updates/update-actions";

interface Props {
  siteId: string;
}

function UpdateRow({
  label,
  current,
  latest,
  type,
  onUpdate,
  loading,
}: {
  label: string;
  current: string;
  latest: string | null;
  type: "core" | "theme";
  onUpdate?: () => void;
  loading?: boolean;
}) {
  const hasUpdate = !!latest;
  return (
    <div className="table-row-hover flex flex-wrap items-center gap-4 border-b border-gray-100 dark:border-gray-800 px-4 py-3 text-sm">
      <div className="flex min-w-[12rem] items-center gap-2">
        <span
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            hasUpdate ? "bg-yellow-400" : "bg-green-500",
          )}
        />
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        {type === "core" && (
          <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
            Core
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <span>v{current}</span>
        {hasUpdate && (
          <>
            <span className="text-gray-300 dark:text-gray-600">→</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">v{latest}</span>
          </>
        )}
        {!hasUpdate && (
          <span className="text-green-600 dark:text-green-400">Up to date</span>
        )}
      </div>
      <div className="ml-auto">
        {hasUpdate && onUpdate && (
          <Button
            size="sm"
            variant="primary"
            type="button"
            disabled={loading}
            onClick={onUpdate}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                Updating…
              </span>
            ) : (
              "Update"
            )}
          </Button>
        )}
        {!hasUpdate && (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ✓ Latest
          </span>
        )}
      </div>
    </div>
  );
}

export default function UpdatesPanel({ siteId }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BridgeUpdatesStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coreUpdating, setCoreUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await checkUpdates(siteId);
    if (result.success) {
      setData(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  const handleCoreUpdate = useCallback(async () => {
    setCoreUpdating(true);
    const result = await applyWPCoreUpdate(siteId);
    if (result.success) {
      toast.success(result.data.message || "WordPress core updated successfully");
      await load();
    } else {
      toast.error(result.error);
    }
    setCoreUpdating(false);
  }, [siteId, load]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-6 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
            <div className="h-4 w-40 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
            <div className="h-4 w-24 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
            <div className="h-4 flex-1 rounded-md bg-gray-200 animate-pulse dark:bg-gray-700/60" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
        {error}
        <Button size="sm" variant="outline" type="button" onClick={load} className="mt-3">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const totalUpdates =
    (data.wp_core.available ? 1 : 0) +
    data.theme_updates_count +
    data.plugin_updates_count;

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      {totalUpdates > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-500/30 dark:bg-yellow-500/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/20">
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{totalUpdates}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              {totalUpdates} update{totalUpdates !== 1 ? "s" : ""} available
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              {data.plugin_updates_count > 0 && `${data.plugin_updates_count} plugin${data.plugin_updates_count !== 1 ? "s" : ""}`}
              {data.plugin_updates_count > 0 && data.theme_updates_count > 0 && ", "}
              {data.theme_updates_count > 0 && `${data.theme_updates_count} theme${data.theme_updates_count !== 1 ? "s" : ""}`}
              {(data.plugin_updates_count > 0 || data.theme_updates_count > 0) && data.wp_core.available && ", "}
              {data.wp_core.available && "WordPress core"}
            </p>
          </div>
          <div className="ml-auto text-xs text-yellow-600 dark:text-yellow-500">
            Checked {new Date(data.checked_at).toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-500/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
            <span className="text-sm">✓</span>
          </div>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Everything is up to date
          </p>
        </div>
      )}

      {/* WordPress Core */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">WordPress Core</h3>
        </div>
        <UpdateRow
          label="WordPress"
          current={data.wp_core.current}
          latest={data.wp_core.available ? data.wp_core.version : null}
          type="core"
          onUpdate={handleCoreUpdate}
          loading={coreUpdating}
        />
      </div>

      {/* Theme Updates */}
      {data.theme_updates.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Theme Updates
              <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {data.theme_updates.length}
              </span>
            </h3>
          </div>
          {data.theme_updates.map((t) => (
            <UpdateRow
              key={t.slug}
              label={t.name}
              current={t.current_version}
              latest={t.new_version}
              type="theme"
            />
          ))}
        </div>
      )}

      {/* Plugin updates count */}
      {data.plugin_updates_count > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-yellow-600 dark:text-yellow-400">{data.plugin_updates_count} plugin update{data.plugin_updates_count !== 1 ? "s" : ""}</span>
            {" "}available — manage them in the{" "}
            <span className="font-medium text-brand-600 dark:text-brand-400">Plugins</span> tab.
          </p>
        </div>
      )}

      {/* Refresh */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" type="button" onClick={load}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
