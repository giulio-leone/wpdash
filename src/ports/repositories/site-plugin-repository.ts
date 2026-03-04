import type { SitePlugin } from "@/domain/plugin/entity";

export interface SitePluginRepository {
  syncPlugins(siteId: string, plugins: Omit<SitePlugin, "id">[]): Promise<SitePlugin[]>;
  findBySiteId(siteId: string): Promise<SitePlugin[]>;
  findOutdated(siteId: string): Promise<SitePlugin[]>;
}
