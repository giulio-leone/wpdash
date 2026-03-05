"use client";

import React, { useState, useEffect } from "react";
import type { Site } from "@/domain/site/entity";
import SiteCard from "./SiteCard";
import AddSiteModal from "./AddSiteModal";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import { useSitesStore } from "@/stores/sites-store";

interface SitesListProps {
  initialSites: Site[];
}

export default function SitesList({ initialSites }: SitesListProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const sites = useSitesStore((s) => s.sites);
  const loading = useSitesStore((s) => s.loading);
  const regenToken = useSitesStore((s) => s.regenToken);
  const fetchSites = useSitesStore((s) => s.fetchSites);
  const deleteSiteAction = useSitesStore((s) => s.deleteSite);
  const regenerateTokenAction = useSitesStore((s) => s.regenerateToken);
  const clearRegenToken = useSitesStore((s) => s.clearRegenToken);
  const subscribeToRealtime = useSitesStore((s) => s.subscribeToRealtime);

  // Hydrate store from SSR data, subscribe to realtime
  useEffect(() => {
    useSitesStore.setState({ sites: initialSites });
    const unsubscribe = subscribeToRealtime();
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this site?")) return;
    await deleteSiteAction(id);
  }

  async function handleRegenerate(id: string) {
    if (!confirm("Regenerate the API token? The old token will stop working.")) return;
    await regenerateTokenAction(id);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sites</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your WordPress sites
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          startIcon={<PlusIcon className="h-5 w-5" />}
        >
          Add Site
        </Button>
      </div>

      {loading && (
        <div className="mb-4 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      )}

      {sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 px-6 py-16 dark:border-gray-800">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
            <PlusIcon className="h-7 w-7 text-brand-500" />
          </div>
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            No sites yet
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Add your first WordPress site to start monitoring.
          </p>
          <Button onClick={() => setModalOpen(true)}>Add Your First Site</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
            />
          ))}
        </div>
      )}

      <AddSiteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSiteAdded={fetchSites}
      />

      {/* Regenerated token dialog */}
      {regenToken && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-400/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              New Token Generated
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Copy this token now. It won&apos;t be shown again.
            </p>
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800/60">
              <code className="flex-1 overflow-x-auto break-all font-mono text-xs text-gray-800 dark:text-gray-200">
                {regenToken}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(regenToken);
                }}
                className="shrink-0 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end">
              <Button onClick={clearRegenToken}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

