export interface SitePlugin {
  id: string;
  siteId: string;
  slug: string;
  name: string;
  version: string;
  isActive: boolean;
  hasUpdate: boolean;
  latestVersion: string | null;
  lastSyncedAt: Date;
}
