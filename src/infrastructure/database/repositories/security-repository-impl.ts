"use strict";

import { eq, desc } from "drizzle-orm";
import { db } from "../drizzle-client";
import { securityAudits } from "../schemas/security-audits";
import type {
  SecurityAudit,
  SecurityAuditStatus,
  SecurityFinding,
} from "@/domain/security/entity";
import type { SecurityAuditRepository } from "@/ports/repositories/security-audit-repository";

function mapRow(row: typeof securityAudits.$inferSelect): SecurityAudit {
  return {
    id: row.id,
    siteId: row.siteId,
    status: row.status as SecurityAuditStatus,
    coreIntegrityPassed: row.coreIntegrityPassed,
    suspiciousFilesCount: row.suspiciousFilesCount,
    findings: (row.findings ?? []) as SecurityFinding[],
    auditedAt: row.auditedAt,
  };
}

export class DrizzleSecurityAuditRepository
  implements SecurityAuditRepository
{
  async create(audit: Omit<SecurityAudit, "id">): Promise<SecurityAudit> {
    const rows = await db
      .insert(securityAudits)
      .values({
        siteId: audit.siteId,
        status: audit.status,
        coreIntegrityPassed: audit.coreIntegrityPassed,
        suspiciousFilesCount: audit.suspiciousFilesCount,
        findings: audit.findings as unknown as Record<string, unknown>,
        auditedAt: audit.auditedAt,
      })
      .returning();
    return mapRow(rows[0]!);
  }

  async findBySiteId(siteId: string): Promise<SecurityAudit[]> {
    const rows = await db
      .select()
      .from(securityAudits)
      .where(eq(securityAudits.siteId, siteId))
      .orderBy(desc(securityAudits.auditedAt));
    return rows.map(mapRow);
  }

  async getLatestBySiteId(siteId: string): Promise<SecurityAudit | null> {
    const rows = await db
      .select()
      .from(securityAudits)
      .where(eq(securityAudits.siteId, siteId))
      .orderBy(desc(securityAudits.auditedAt))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }
}
