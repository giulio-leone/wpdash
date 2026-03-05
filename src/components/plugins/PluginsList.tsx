"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import PluginInstallModal from "./PluginInstallModal";
import BulkUpdatePanel from "./BulkUpdatePanel";
import { usePluginsStore } from "@/stores/plugins-store";
import { SkeletonTable } from "@/components/ui/skeleton/Skeleton";
import type { SitePlugin } from "@/domain/plugin/entity";

// Stable empty array — prevents infinite re-render when siteId not yet in store
const EMPTY_PLUGINS: SitePlugin[] = [];

interface Props {
  siteId: string;
}

export default function PluginsList({ siteId }: Props) {
  const [search, setSearch] = useState("");
  const [showInstall, setShowInstall] = useState(false);
  const [bulkSlug, setBulkSlug] = useState<string | null>(null);

  const plugins = usePluginsStore((s) => s.plugins[siteId] ?? EMPTY_PLUGINS);
  const loading = usePluginsStore((s) => s.loading[siteId] ?? false);
  const syncing = usePluginsStore((s) => s.syncing[siteId] ?? false);
  const actionLoading = usePluginsStore((s) => s.actionLoading[siteId] ?? null);
  const error = usePluginsStore((s) => s.error[siteId] ?? null);
  const fetchPlugins = usePluginsStore((s) => s.fetchPlugins);
  const syncPlugins = usePluginsStore((s) => s.syncPlugins);
  const runAction = usePluginsStore((s) => s.runAction);
  const subscribeToRealtime = usePluginsStore((s) => s.subscribeToRealtime);

  useEffect(() => {
    void fetchPlugins(siteId);
  }, [siteId, fetchPlugins]);

  useEffect(() => {
    const unsubscribe = subscribeToRealtime(siteId);
    return unsubscribe;
  }, [siteId, subscribeToRealtime]);

  const filtered = plugins.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-9 w-full rounded-lg bg-gray-200 animate-pulse dark:bg-gray-700/60 sm:max-w-[16rem]" />
          <div className="flex gap-2">
            <div className="h-8 w-28 rounded-lg bg-gray-200 animate-pulse dark:bg-gray-700/60" />
            <div className="h-8 w-28 rounded-lg bg-gray-200 animate-pulse dark:bg-gray-700/60" />
          </div>
        </div>
        <SkeletonTable rows={4} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search plugins…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn(
            "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
            "dark:border-gray-800 dark:bg-gray-900 dark:text-white",
            "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
            "sm:max-w-[16rem]",
          )}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => syncPlugins(siteId)} disabled={syncing}>
            {syncing ? "Syncing…" : "Sync Plugins"}
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowInstall(true)}>
            Install Plugin
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          {plugins.length === 0
            ? "No plugins found. Click \"Sync Plugins\" to fetch from your site."
            : "No plugins match your search."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Version</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Update</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plugin) => (
                <tr
                  key={plugin.slug}
                  className="table-row-hover border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                    {plugin.name}
                    <span className="ml-2 text-xs text-gray-400">{plugin.slug}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">
                    {plugin.version}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      size="sm"
                      color={plugin.isActive ? "success" : "light"}
                    >
                      {plugin.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    {plugin.hasUpdate ? (
                      <Badge size="sm" color="warning">
                        {plugin.latestVersion ?? "Available"}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {plugin.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === plugin.slug}
                          onClick={() => runAction(siteId, "deactivate", plugin.slug)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === plugin.slug}
                          onClick={() => runAction(siteId, "activate", plugin.slug)}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={actionLoading === plugin.slug}
                        onClick={() => runAction(siteId, "update", plugin.slug)}
                      >
                        Update
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          actionLoading === plugin.slug ||
                          plugin.isActive ||
                          plugin.slug === "wp-dash-bridge"
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete plugin "${plugin.name}"? This action cannot be undone.`,
                            )
                          ) {
                            void runAction(siteId, "delete", plugin.slug);
                          }
                        }}
                      >
                        Delete
                      </Button>
                      {plugin.hasUpdate && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setBulkSlug(plugin.slug)}
                          >
                            Bulk Update
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showInstall && (
        <PluginInstallModal
          siteId={siteId}
          onClose={() => setShowInstall(false)}
          onInstalled={() => {
            setShowInstall(false);
            void fetchPlugins(siteId);
          }}
        />
      )}

      {bulkSlug && (
        <BulkUpdatePanel
          pluginSlug={bulkSlug}
          currentSiteId={siteId}
          onClose={() => setBulkSlug(null)}
        />
      )}
    </div>
  );
}
