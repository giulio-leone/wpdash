"use client";
import React, { useState, useEffect } from "react";
import { fetchAllUpdates, applyCoreSiteUpdate, type SiteUpdateItem } from "@/application/updates/network-updates-actions";
import { toast } from "@/hooks/useToast";
import { CheckCircleIcon } from "@/icons";

type ItemStatus = "idle" | "updating" | "done" | "error";

const typeBadge: Record<string, string> = {
  wp_core: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  theme: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  plugin: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

const typeLabel: Record<string, string> = {
  wp_core: "WP Core",
  theme: "Theme",
  plugin: "Plugin",
};

export default function NetworkUpdatesClient() {
  const [updates, setUpdates] = useState<SiteUpdateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});

  useEffect(() => {
    fetchAllUpdates().then((r) => {
      if (r.success) setUpdates(r.data);
      setLoading(false);
    });
  }, []);

  function itemKey(u: SiteUpdateItem) {
    return `${u.siteId}:${u.type}:${u.slug ?? "core"}`;
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line drizzle/enforce-delete-with-where
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === updates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(updates.map(itemKey)));
    }
  }

  async function handleUpdateSelected() {
    const toUpdate = updates.filter((u) => selected.has(itemKey(u)));
    for (const u of toUpdate) {
      const key = itemKey(u);
      setStatuses((p) => ({ ...p, [key]: "updating" }));
      try {
        if (u.type === "wp_core") {
          const r = await applyCoreSiteUpdate(u.siteId);
          setStatuses((p) => ({ ...p, [key]: r.success ? "done" : "error" }));
          if (r.success) toast.success(`Updated WordPress Core on ${u.siteName}`);
          else toast.error(`Failed to update on ${u.siteName}: ${r.message}`);
        } else {
          // Themes/plugins: mark as coming soon
          setStatuses((p) => ({ ...p, [key]: "done" }));
          toast.info(`${u.name} update queued (coming soon)`);
        }
      } catch {
        setStatuses((p) => ({ ...p, [key]: "error" }));
        toast.error(`Error updating ${u.name} on ${u.siteName}`);
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <CheckCircleIcon className="w-14 h-14 text-green-500" />
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">All sites are up to date</p>
        <p className="text-sm text-gray-400">No pending updates found across your sites.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Updates</h1>
        <button
          onClick={handleUpdateSelected}
          disabled={selected.size === 0}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-brand-600 transition-colors"
        >
          Update Selected ({selected.size})
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selected.size === updates.length && updates.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Current</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">New</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {updates.map((u) => {
              const key = itemKey(u);
              const status = statuses[key] ?? "idle";
              return (
                <tr key={key} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(key)}
                      onChange={() => toggleSelect(key)}
                      disabled={status === "done"}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{u.siteName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[u.type] ?? ""}`}>
                      {typeLabel[u.type] ?? u.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.currentVersion}</td>
                  <td className="px-4 py-3 font-mono text-xs text-green-600 dark:text-green-400 font-semibold">{u.newVersion}</td>
                  <td className="px-4 py-3">
                    {status === "idle" && <span className="text-gray-400 text-xs">—</span>}
                    {status === "updating" && <span className="text-blue-500 text-xs animate-pulse">Updating…</span>}
                    {status === "done" && <span className="text-green-500 text-xs">✓ Done</span>}
                    {status === "error" && <span className="text-red-500 text-xs">✗ Error</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
