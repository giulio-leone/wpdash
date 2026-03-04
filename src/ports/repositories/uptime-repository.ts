import type { UptimeCheck } from "@/domain/uptime/entity";

export interface UptimeRepository {
  create(check: Omit<UptimeCheck, "id">): Promise<UptimeCheck>;
  findBySiteId(siteId: string, since: Date): Promise<UptimeCheck[]>;
  getLatestBySiteId(siteId: string): Promise<UptimeCheck | null>;
  deleteOlderThan(date: Date): Promise<number>;
  getUptimePercentage(siteId: string, since: Date): Promise<number>;
}
