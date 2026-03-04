import type { SeoAudit } from "@/domain/seo/entity";

export interface SeoAuditRepository {
  create(audit: Omit<SeoAudit, "id">): Promise<SeoAudit>;
  findBySiteId(siteId: string): Promise<SeoAudit[]>;
  getLatestBySiteId(siteId: string): Promise<SeoAudit | null>;
}
