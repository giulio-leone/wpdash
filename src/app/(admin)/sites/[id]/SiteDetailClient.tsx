"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Site } from "@/domain/site/entity";
import { regenerateToken, fetchSiteHealth } from "@/application/site/site-actions";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import LogSummary from "@/components/logs/LogSummary";
import LogViewer from "@/components/logs/LogViewer";
import BackupWidget from "@/components/backup/BackupWidget";
import BackupHistory from "@/components/backup/BackupHistory";
import BackupAlert from "@/components/backup/BackupAlert";
import UptimeWidget from "@/components/uptime/UptimeWidget";
import UptimeHistory from "@/components/uptime/UptimeHistory";
import SecurityWidget from "@/components/security/SecurityWidget";
import PluginsList from "@/components/plugins/PluginsList";
import SeoWidget from "@/components/seo/SeoWidget";
import SeoDetails from "@/components/seo/SeoDetails";
import ThemesList from "@/components/themes/ThemesList";
import UsersList from "@/components/users/UsersList";
import ContentList from "@/components/content/ContentList";
import WooCommerceHub from "@/components/woocommerce/WooCommerceHub";
import DatabaseManager from "@/components/database/DatabaseManager";
import { cn } from "@/lib/cn";

const tabs = ["Overview", "Uptime", "Security", "Plugins", "SEO", "Logs", "Backup", "Themes", "Users", "Content", "WooCommerce", "Database"] as const;

function statusBadgeColor(status: string): "success" | "error" | "light" {
  if (status === "online") return "success";
  if (status === "offline" || status === "degraded") return "error";
  return "light";
}

export default function SiteDetailClient({ site }: { site: Site }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [healthData, setHealthData] = useState<{
    wpVersion: string | null;
    phpVersion: string | null;
  }>({ wpVersion: site.wpVersion, phpVersion: site.phpVersion });
  const [healthLoading, setHealthLoading] = useState(false);

  const loadHealth = useCallback(async () => {
    if (healthData.wpVersion && healthData.phpVersion) return;
    setHealthLoading(true);
    try {
      const result = await fetchSiteHealth(site.id);
      if (result.success) {
        setHealthData({
          wpVersion: result.data.wpVersion,
          phpVersion: result.data.phpVersion,
        });
      }
    } finally {
      setHealthLoading(false);
    }
  }, [site.id, healthData.wpVersion, healthData.phpVersion]);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);
  const [regenToken, setRegenToken] = useState<string | null>(null);
  const [seoRefreshKey, setSeoRefreshKey] = useState(0);

  async function handleRegenerate() {
    if (!confirm("Regenerate the API token? The old token will stop working.")) return;
    const result = await regenerateToken(site.id);
    if (result.success) setRegenToken(result.data.token);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{site.name}</h1>
            <Badge size="sm" color={statusBadgeColor(site.status)}>
              {site.status}
            </Badge>
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
          >
            {site.url}
          </a>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRegenerate}>
            Regenerate Token
          </Button>
        </div>
      </div>

      {/* Regen token banner */}
      {regenToken && (
        <div className="mb-6 rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/10">
          <p className="mb-2 text-sm font-medium text-warning-700 dark:text-warning-400">
            New token generated — copy it now, it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-white p-2 dark:bg-gray-900">
            <code className="flex-1 text-xs break-all text-gray-800 dark:text-gray-200">
              {regenToken}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(regenToken)}
              className="shrink-0 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <InfoCard
          label="WP Version"
          value={healthLoading ? "Loading…" : (healthData.wpVersion ?? "—")}
        />
        <InfoCard
          label="PHP Version"
          value={healthLoading ? "Loading…" : (healthData.phpVersion ?? "—")}
        />
        <InfoCard
          label="Last Checked"
          value={site.lastCheckedAt ? new Date(site.lastCheckedAt).toLocaleString() : "Never"}
        />
        <InfoCard label="Status" value={site.isActive ? "Active" : "Inactive"} />
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {activeTab === "Overview" ? (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Site Health</h3>
            {healthLoading ? (
              <p className="text-sm text-gray-500">Fetching health data from WordPress…</p>
            ) : healthData.wpVersion ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoCard label="WordPress" value={healthData.wpVersion} />
                <InfoCard label="PHP" value={healthData.phpVersion ?? "—"} />
                <InfoCard label="Status" value={site.status ?? "unknown"} />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Could not reach the WordPress site. Ensure the WP Bridge plugin is installed and the token is configured.
              </p>
            )}
            <button
              onClick={loadHealth}
              disabled={healthLoading}
              className="mt-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {healthLoading ? "Checking…" : "Refresh Health"}
            </button>
          </div>
        ) : activeTab === "Uptime" ? (
          <div className="space-y-6">
            <UptimeWidget siteId={site.id} />
            <UptimeHistory siteId={site.id} />
          </div>
        ) : activeTab === "Security" ? (
          <SecurityWidget siteId={site.id} />
        ) : activeTab === "Plugins" ? (
          <PluginsList siteId={site.id} />
        ) : activeTab === "SEO" ? (
          <div className="space-y-6">
            <SeoWidget
              siteId={site.id}
              onAuditComplete={() => setSeoRefreshKey((k) => k + 1)}
            />
            <SeoDetails siteId={site.id} refreshKey={seoRefreshKey} />
          </div>
        ) : activeTab === "Logs" ? (
          <div className="space-y-6">
            <LogSummary siteId={site.id} />
            <LogViewer siteId={site.id} />
          </div>
        ) : activeTab === "Backup" ? (
          <div className="space-y-6">
            <BackupAlert siteId={site.id} />
            <BackupWidget siteId={site.id} />
            <BackupHistory siteId={site.id} />
          </div>
        ) : activeTab === "Themes" ? (
          <ThemesList siteId={site.id} />
        ) : activeTab === "Users" ? (
          <UsersList siteId={site.id} />
        ) : activeTab === "Content" ? (
          <ContentList siteId={site.id} />
        ) : activeTab === "WooCommerce" ? (
          <WooCommerceHub siteId={site.id} />
        ) : activeTab === "Database" ? (
          <DatabaseManager siteId={site.id} />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTab} data will be available once your site is connected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
