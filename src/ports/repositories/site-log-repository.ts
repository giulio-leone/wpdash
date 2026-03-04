import type { SiteLog, LogLevel } from "@/domain/log/entity";

export interface FindSiteLogOptions {
  level?: LogLevel;
  limit?: number;
  offset?: number;
}

export interface SiteLogRepository {
  create(log: Omit<SiteLog, "id">): Promise<SiteLog>;
  findBySiteId(siteId: string, options?: FindSiteLogOptions): Promise<SiteLog[]>;
}
