import type { SiteLog, LogLevel } from "@/domain/log/entity";

export interface FindSiteLogOptions {
  level?: LogLevel;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface SeverityCount {
  error: number;
  warning: number;
  notice: number;
  deprecated: number;
  critical: number;
  info: number;
}

export interface SiteLogRepository {
  create(log: Omit<SiteLog, "id">): Promise<SiteLog>;
  createBatch(logs: Omit<SiteLog, "id">[]): Promise<SiteLog[]>;
  findBySiteId(siteId: string, options?: FindSiteLogOptions): Promise<SiteLog[]>;
  getLatestBySiteId(siteId: string, limit?: number): Promise<SiteLog[]>;
  countBySeverity(siteId: string): Promise<SeverityCount>;
  deleteOlderThan(siteId: string, days: number): Promise<number>;
}
