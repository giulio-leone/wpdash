"use client";

import { create } from "zustand";
import type { Site } from "@/domain/site/entity";
import { getSites, deleteSite, regenerateToken } from "@/application/site/site-actions";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/client";

interface SitesState {
  sites: Site[];
  loading: boolean;
  error: string | null;
  regenToken: string | null;

  fetchSites: () => Promise<void>;
  deleteSite: (id: string) => Promise<void>;
  regenerateToken: (id: string) => Promise<void>;
  clearRegenToken: () => void;
  subscribeToRealtime: () => () => void;
}

export const useSitesStore = create<SitesState>((set, get) => ({
  sites: [],
  loading: false,
  error: null,
  regenToken: null,

  fetchSites: async () => {
    set({ loading: true, error: null });
    const result = await getSites();
    if (result.success) set({ sites: result.data });
    else set({ error: result.error });
    set({ loading: false });
  },

  deleteSite: async (id) => {
    const result = await deleteSite(id);
    if (result.success) await get().fetchSites();
    else set({ error: result.error });
  },

  regenerateToken: async (id) => {
    const result = await regenerateToken(id);
    if (result.success) set({ regenToken: result.data.token });
    else set({ error: result.error });
  },

  clearRegenToken: () => set({ regenToken: null }),

  subscribeToRealtime: () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const channel = supabase
        .channel("sites:all")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "sites" },
          () => {
            get().fetchSites();
          },
        )
        .subscribe();

      return () => {
        try { supabase.removeChannel(channel); } catch { /* ok */ }
      };
    } catch {
      return () => {};
    }
  },
}));
