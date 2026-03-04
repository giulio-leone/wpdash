import { eq, and } from "drizzle-orm";
import { db } from "../drizzle-client";
import { sitePlugins } from "../schemas/site-plugins";
import type { SitePlugin } from "@/domain/plugin/entity";
import type { SitePluginRepository } from "@/ports/repositories/site-plugin-repository";

type PluginRow = typeof sitePlugins.$inferSelect;

function mapRowToPlugin(row: PluginRow): SitePlugin {
  return {
    id: row.id,
    siteId: row.siteId,
    slug: row.slug,
    name: row.name,
    version: row.version,
    isActive: row.isActive,
    hasUpdate: row.hasUpdate,
    latestVersion: row.latestVersion,
    lastSyncedAt: row.lastSyncedAt,
  };
}

export class DrizzlePluginRepository implements SitePluginRepository {
  async upsert(plugin: Omit<SitePlugin, "id">): Promise<SitePlugin> {
    const existing = await db
      .select()
      .from(sitePlugins)
      .where(
        and(
          eq(sitePlugins.siteId, plugin.siteId),
          eq(sitePlugins.slug, plugin.slug),
        ),
      );

    if (existing[0]) {
      const rows = await db
        .update(sitePlugins)
        .set({
          name: plugin.name,
          version: plugin.version,
          isActive: plugin.isActive,
          hasUpdate: plugin.hasUpdate,
          latestVersion: plugin.latestVersion,
          lastSyncedAt: plugin.lastSyncedAt,
        })
        .where(
          and(
            eq(sitePlugins.siteId, plugin.siteId),
            eq(sitePlugins.slug, plugin.slug),
          ),
        )
        .returning();
      return mapRowToPlugin(rows[0]!);
    }

    const rows = await db
      .insert(sitePlugins)
      .values({
        siteId: plugin.siteId,
        slug: plugin.slug,
        name: plugin.name,
        version: plugin.version,
        isActive: plugin.isActive,
        hasUpdate: plugin.hasUpdate,
        latestVersion: plugin.latestVersion,
        lastSyncedAt: plugin.lastSyncedAt,
      })
      .returning();
    return mapRowToPlugin(rows[0]!);
  }

  async syncPlugins(
    siteId: string,
    plugins: Omit<SitePlugin, "id">[],
  ): Promise<SitePlugin[]> {
    await db
      .delete(sitePlugins)
      .where(eq(sitePlugins.siteId, siteId));

    if (plugins.length === 0) return [];

    const rows = await db
      .insert(sitePlugins)
      .values(
        plugins.map((p) => ({
          siteId: p.siteId,
          slug: p.slug,
          name: p.name,
          version: p.version,
          isActive: p.isActive,
          hasUpdate: p.hasUpdate,
          latestVersion: p.latestVersion,
          lastSyncedAt: p.lastSyncedAt,
        })),
      )
      .returning();
    return rows.map(mapRowToPlugin);
  }

  async findBySiteId(siteId: string): Promise<SitePlugin[]> {
    const rows = await db
      .select()
      .from(sitePlugins)
      .where(eq(sitePlugins.siteId, siteId));
    return rows.map(mapRowToPlugin);
  }

  async findBySlug(siteId: string, slug: string): Promise<SitePlugin | null> {
    const rows = await db
      .select()
      .from(sitePlugins)
      .where(
        and(
          eq(sitePlugins.siteId, siteId),
          eq(sitePlugins.slug, slug),
        ),
      );
    return rows[0] ? mapRowToPlugin(rows[0]) : null;
  }

  async findOutdated(siteId: string): Promise<SitePlugin[]> {
    const rows = await db
      .select()
      .from(sitePlugins)
      .where(
        and(
          eq(sitePlugins.siteId, siteId),
          eq(sitePlugins.hasUpdate, true),
        ),
      );
    return rows.map(mapRowToPlugin);
  }

  async delete(siteId: string, slug: string): Promise<boolean> {
    const rows = await db
      .delete(sitePlugins)
      .where(
        and(
          eq(sitePlugins.siteId, siteId),
          eq(sitePlugins.slug, slug),
        ),
      )
      .returning();
    return rows.length > 0;
  }
}
