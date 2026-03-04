import type { SitePlugin } from "@/domain/plugin/entity";

export interface SitePluginRepository {
  upsert(plugin: Omit<SitePlugin, "id">): Promise<SitePlugin>;
  syncPlugins(siteId: string, plugins: Omit<SitePlugin, "id">[]): Promise<SitePlugin[]>;
  findBySiteId(siteId: string): Promise<SitePlugin[]>;
  findBySlug(siteId: string, slug: string): Promise<SitePlugin | null>;
  findOutdated(siteId: string): Promise<SitePlugin[]>;
  delete(siteId: string, slug: string): Promise<boolean>;
}
