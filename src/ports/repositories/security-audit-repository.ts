import type { SecurityAudit } from "@/domain/security/entity";

export interface SecurityAuditRepository {
  create(audit: Omit<SecurityAudit, "id">): Promise<SecurityAudit>;
  findBySiteId(siteId: string): Promise<SecurityAudit[]>;
  getLatestBySiteId(siteId: string): Promise<SecurityAudit | null>;
}
