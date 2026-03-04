import { eq, desc } from "drizzle-orm";
import { db } from "../drizzle-client";
import { seoAudits } from "../schemas/seo-audits";
import type { SeoAudit, HeadersStructure } from "@/domain/seo/entity";
import type { SeoAuditRepository } from "@/ports/repositories/seo-audit-repository";

type AuditRow = typeof seoAudits.$inferSelect;

const DEFAULT_HEADERS: HeadersStructure = { h1: [], h2: [], h3: [] };

function mapRowToAudit(row: AuditRow): SeoAudit {
  return {
    id: row.id,
    siteId: row.siteId,
    pageUrl: row.pageUrl,
    title: row.title,
    metaDescription: row.metaDescription,
    metaKeywords: row.metaKeywords,
    headersStructure: (row.headersStructure as HeadersStructure) ?? DEFAULT_HEADERS,
    score: row.score ?? 0,
    auditedAt: row.auditedAt,
  };
}

export class DrizzleSeoRepository implements SeoAuditRepository {
  async create(audit: Omit<SeoAudit, "id">): Promise<SeoAudit> {
    const rows = await db
      .insert(seoAudits)
      .values({
        siteId: audit.siteId,
        pageUrl: audit.pageUrl,
        title: audit.title,
        metaDescription: audit.metaDescription,
        metaKeywords: audit.metaKeywords,
        headersStructure: audit.headersStructure,
        score: audit.score,
        auditedAt: audit.auditedAt,
      })
      .returning();
    return mapRowToAudit(rows[0]!);
  }

  async findBySiteId(siteId: string, limit?: number): Promise<SeoAudit[]> {
    let query = db
      .select()
      .from(seoAudits)
      .where(eq(seoAudits.siteId, siteId))
      .orderBy(desc(seoAudits.auditedAt));

    if (limit !== undefined) {
      query = query.limit(limit) as typeof query;
    }

    const rows = await query;
    return rows.map(mapRowToAudit);
  }

  async getLatestBySiteId(siteId: string): Promise<SeoAudit | null> {
    const rows = await db
      .select()
      .from(seoAudits)
      .where(eq(seoAudits.siteId, siteId))
      .orderBy(desc(seoAudits.auditedAt))
      .limit(1);
    return rows[0] ? mapRowToAudit(rows[0]) : null;
  }
}
