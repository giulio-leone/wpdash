"use server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq } from "drizzle-orm";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";

const bridge = new WPBridgeClient();

export type SiteUpdateItem = {
  siteId: string;
  siteName: string;
  siteUrl: string;
  type: "wp_core" | "theme" | "plugin";
  name: string;
  currentVersion: string;
  newVersion: string;
  slug?: string;
};

export async function fetchAllUpdates(): Promise<
  { success: true; data: SiteUpdateItem[] } | { success: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const userSites = await db.select().from(sites).where(eq(sites.userId, user.id));

  const allUpdates: SiteUpdateItem[] = [];

  await Promise.allSettled(
    userSites.map(async (site) => {
      try {
        const result = await bridge.getUpdatesStatus(site.url, site.tokenHash);
        if (result.wp_core?.available && result.wp_core?.version) {
          allUpdates.push({
            siteId: site.id,
            siteName: site.name,
            siteUrl: site.url,
            type: "wp_core",
            name: "WordPress Core",
            currentVersion: result.wp_core.current ?? "?",
            newVersion: result.wp_core.version,
          });
        }
        if (result.theme_updates) {
          result.theme_updates.forEach((t) => {
            if (t.new_version) {
              allUpdates.push({
                siteId: site.id,
                siteName: site.name,
                siteUrl: site.url,
                type: "theme",
                name: t.name,
                currentVersion: t.current_version,
                newVersion: t.new_version,
                slug: t.slug,
              });
            }
          });
        }
      } catch {
        // Site unreachable — skip silently
      }
    })
  );

  return { success: true, data: allUpdates };
}

export async function applyCoreSiteUpdate(
  siteId: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const rows = await db.select().from(sites).where(eq(sites.id, siteId)).limit(1);
  const site = rows[0];
  if (!site || site.userId !== user.id) return { success: false, message: "Not found" };

  const result = await bridge.applyWPCoreUpdate(site.url, site.tokenHash);
  return { success: result.updated, message: result.message };
}
