"use client";

import { create } from "zustand";
import type { SitePlugin } from "@/domain/plugin/entity";
import {
  getSitePlugins,
  syncSitePlugins,
  activatePlugin,
  deactivatePlugin,
  updatePlugin,
  deletePlugin,
  installPlugin,
} from "@/application/plugin/plugin-actions";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { toast } from "@/hooks/useToast";

type PluginAction = "activate" | "deactivate" | "update" | "delete";

interface PluginsState {
  // per-site plugin lists
  plugins: Record<string, SitePlugin[]>;
  loading: Record<string, boolean>;
  syncing: Record<string, boolean>;
  actionLoading: Record<string, string | null>; // siteId → slug | null
  error: Record<string, string | null>;

  // actions
  fetchPlugins: (siteId: string) => Promise<void>;
  syncPlugins: (siteId: string) => Promise<void>;
  runAction: (siteId: string, action: PluginAction, slug: string) => Promise<void>;
  installPlugin: (siteId: string, source: "slug" | "url", value: string) => Promise<void>;
  subscribeToRealtime: (siteId: string) => () => void;
}

export const usePluginsStore = create<PluginsState>((set, get) => ({
  plugins: {},
  loading: {},
  syncing: {},
  actionLoading: {},
  error: {},

  fetchPlugins: async (siteId) => {
    set((s) => ({ loading: { ...s.loading, [siteId]: true }, error: { ...s.error, [siteId]: null } }));
    try {
      const result = await getSitePlugins(siteId);
      if (result.success) {
        set((s) => ({ plugins: { ...s.plugins, [siteId]: result.data } }));
      } else {
        set((s) => ({ error: { ...s.error, [siteId]: result.error } }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load plugins";
      set((s) => ({ error: { ...s.error, [siteId]: msg } }));
    } finally {
      set((s) => ({ loading: { ...s.loading, [siteId]: false } }));
    }
  },

  syncPlugins: async (siteId) => {
    set((s) => ({ syncing: { ...s.syncing, [siteId]: true }, error: { ...s.error, [siteId]: null } }));
    try {
      const result = await syncSitePlugins(siteId);
      if (result.success) {
        set((s) => ({ plugins: { ...s.plugins, [siteId]: result.data } }));
        toast.success(`Synced ${result.data.length} plugins`);
      } else {
        set((s) => ({ error: { ...s.error, [siteId]: result.error } }));
        toast.error(result.error ?? "Sync failed");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to sync plugins";
      set((s) => ({ error: { ...s.error, [siteId]: msg } }));
      toast.error(msg);
    } finally {
      set((s) => ({ syncing: { ...s.syncing, [siteId]: false } }));
    }
  },

  runAction: async (siteId, action, slug) => {
    set((s) => ({
      actionLoading: { ...s.actionLoading, [siteId]: slug },
      error: { ...s.error, [siteId]: null },
    }));

    let result;
    if (action === "activate") result = await activatePlugin(siteId, slug);
    else if (action === "deactivate") result = await deactivatePlugin(siteId, slug);
    else if (action === "update") result = await updatePlugin(siteId, slug);
    else result = await deletePlugin(siteId, slug);

    if (!result.success) {
      set((s) => ({ error: { ...s.error, [siteId]: result.error } }));
      toast.error(result.error ?? `Failed to ${action} plugin`);
    } else {
      const labels: Record<typeof action, string> = {
        activate: "Plugin activated",
        deactivate: "Plugin deactivated",
        update: "Plugin updated successfully",
        delete: "Plugin deleted",
      };
      toast.success(labels[action]);
      await get().fetchPlugins(siteId);
    }
    set((s) => ({ actionLoading: { ...s.actionLoading, [siteId]: null } }));
  },

  installPlugin: async (siteId, source, value) => {
    const result = await installPlugin(siteId, source, value);
    if (result.success) {
      toast.success("Plugin installed successfully");
      await get().fetchPlugins(siteId);
    } else {
      toast.error(result.error ?? "Installation failed");
    }
    return result.success ? undefined : Promise.reject(new Error(result.error));
  },

  subscribeToRealtime: (siteId) => {
    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel(`site_plugins:${siteId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "site_plugins",
            filter: `site_id=eq.${siteId}`,
          },
          () => {
            get().fetchPlugins(siteId);
          },
        )
        .subscribe();

      return () => {
        try { supabase.removeChannel(channel); } catch { /* ok */ }
      };
    } catch {
      // Realtime unavailable (dev/firewall) — fetching still works independently
      return () => {};
    }
  },
}));
