"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  getSitePlugins,
  syncSitePlugins,
  activatePlugin,
  deactivatePlugin,
  updatePlugin,
  deletePlugin,
} from "@/application/plugin/plugin-actions";
import PluginInstallModal from "./PluginInstallModal";
import BulkUpdatePanel from "./BulkUpdatePanel";
import type { SitePlugin } from "@/domain/plugin/entity";

interface Props {
  siteId: string;
}

export default function PluginsList({ siteId }: Props) {
  const [plugins, setPlugins] = useState<SitePlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [showInstall, setShowInstall] = useState(false);
  const [bulkSlug, setBulkSlug] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    const result = await getSitePlugins(siteId);
    if (result.success) setPlugins(result.data);
    else setError(result.error);
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPlugins();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    const result = await syncSitePlugins(siteId);
    if (result.success) setPlugins(result.data);
    else setError(result.error);
    setSyncing(false);
  };

  const handleAction = async (
    action: "activate" | "deactivate" | "update" | "delete",
    slug: string,
  ) => {
    setActionLoading(slug);
    setError(null);
    let result;
    if (action === "activate") result = await activatePlugin(siteId, slug);
    else if (action === "deactivate") result = await deactivatePlugin(siteId, slug);
    else if (action === "update") result = await updatePlugin(siteId, slug);
    else result = await deletePlugin(siteId, slug);

    if (!result.success) setError(result.error);
    else await fetchPlugins();
    setActionLoading(null);
  };

  const filtered = plugins.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
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
            "dark:border-gray-700 dark:bg-gray-800 dark:text-white",
            "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
            "sm:max-w-[16rem]",
          )}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
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
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Version</th>
                <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="pb-3 pr-4 font-medium text-gray-500 dark:text-gray-400">Update</th>
                <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plugin) => (
                <tr
                  key={plugin.slug}
                  className="border-b border-gray-100 dark:border-gray-800"
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
                          onClick={() => handleAction("deactivate", plugin.slug)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === plugin.slug}
                          onClick={() => handleAction("activate", plugin.slug)}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={actionLoading === plugin.slug}
                        onClick={() => handleAction("update", plugin.slug)}
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
                            void handleAction("delete", plugin.slug);
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
            void fetchPlugins();
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
