export type LogLevel = "critical" | "error" | "warning" | "notice" | "info";

export interface SiteLog {
  id: string;
  siteId: string;
  level: LogLevel;
  message: string;
  source: string | null;
  loggedAt: Date;
  fetchedAt: Date;
}
