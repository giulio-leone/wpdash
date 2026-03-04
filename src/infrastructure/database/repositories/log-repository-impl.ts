import { eq, and, desc, sql, gte, lte, ilike, or } from "drizzle-orm";
import { db } from "../drizzle-client";
import { siteLogs } from "../schemas/site-logs";
import type { SiteLog, LogLevel } from "@/domain/log/entity";
import type {
  SiteLogRepository,
  FindSiteLogOptions,
  SeverityCount,
} from "@/ports/repositories/site-log-repository";

function mapRow(row: typeof siteLogs.$inferSelect): SiteLog {
  return {
    id: row.id,
    siteId: row.siteId,
    level: row.level as LogLevel,
    message: row.message,
    source: row.source,
    loggedAt: row.loggedAt,
    fetchedAt: row.fetchedAt,
  };
}

export class DrizzleLogRepository implements SiteLogRepository {
  async create(log: Omit<SiteLog, "id">): Promise<SiteLog> {
    const rows = await db
      .insert(siteLogs)
      .values({
        siteId: log.siteId,
        level: log.level,
        message: log.message,
        source: log.source,
        loggedAt: log.loggedAt,
        fetchedAt: log.fetchedAt,
      })
      .returning();
    return mapRow(rows[0]!);
  }

  async createBatch(logs: Omit<SiteLog, "id">[]): Promise<SiteLog[]> {
    if (logs.length === 0) return [];
    const rows = await db
      .insert(siteLogs)
      .values(
        logs.map((log) => ({
          siteId: log.siteId,
          level: log.level,
          message: log.message,
          source: log.source,
          loggedAt: log.loggedAt,
          fetchedAt: log.fetchedAt,
        })),
      )
      .returning();
    return rows.map(mapRow);
  }

  async findBySiteId(
    siteId: string,
    options?: FindSiteLogOptions,
  ): Promise<SiteLog[]> {
    const conditions = [eq(siteLogs.siteId, siteId)];

    if (options?.level) {
      conditions.push(eq(siteLogs.level, options.level));
    }
    if (options?.dateFrom) {
      conditions.push(gte(siteLogs.loggedAt, options.dateFrom));
    }
    if (options?.dateTo) {
      conditions.push(lte(siteLogs.loggedAt, options.dateTo));
    }
    if (options?.search) {
      conditions.push(
        or(
          ilike(siteLogs.message, `%${options.search}%`),
          ilike(siteLogs.source, `%${options.search}%`),
        )!,
      );
    }

    const limit = options?.limit ?? 25;
    const offset = options?.offset ?? 0;

    const rows = await db
      .select()
      .from(siteLogs)
      .where(and(...conditions))
      .orderBy(desc(siteLogs.loggedAt))
      .limit(limit)
      .offset(offset);

    return rows.map(mapRow);
  }

  async getLatestBySiteId(siteId: string, limit = 10): Promise<SiteLog[]> {
    const rows = await db
      .select()
      .from(siteLogs)
      .where(eq(siteLogs.siteId, siteId))
      .orderBy(desc(siteLogs.loggedAt))
      .limit(limit);
    return rows.map(mapRow);
  }

  async countBySeverity(siteId: string): Promise<SeverityCount> {
    const rows = await db
      .select({
        level: siteLogs.level,
        count: sql<number>`count(*)::int`,
      })
      .from(siteLogs)
      .where(eq(siteLogs.siteId, siteId))
      .groupBy(siteLogs.level);

    const result: SeverityCount = {
      critical: 0,
      error: 0,
      warning: 0,
      notice: 0,
      deprecated: 0,
      info: 0,
    };

    for (const row of rows) {
      const key = row.level as keyof SeverityCount;
      if (key in result) {
        result[key] = row.count;
      }
    }

    return result;
  }

  async deleteOlderThan(siteId: string, days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const rows = await db
      .delete(siteLogs)
      .where(and(eq(siteLogs.siteId, siteId), lte(siteLogs.loggedAt, cutoff)))
      .returning();

    return rows.length;
  }
}
