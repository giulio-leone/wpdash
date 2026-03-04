"use strict";

import { eq, gte, desc, lt, sql, and, count } from "drizzle-orm";
import { db } from "../drizzle-client";
import { uptimeChecks } from "../schemas/uptime-checks";
import type { UptimeCheck } from "@/domain/uptime/entity";
import type { UptimeRepository } from "@/ports/repositories/uptime-repository";

function mapRow(row: typeof uptimeChecks.$inferSelect): UptimeCheck {
  return {
    id: row.id,
    siteId: row.siteId,
    statusCode: row.statusCode,
    responseTimeMs: row.responseTimeMs,
    isReachable: row.isReachable,
    errorMessage: row.errorMessage,
    checkedAt: row.checkedAt,
  };
}

export class DrizzleUptimeRepository implements UptimeRepository {
  async create(check: Omit<UptimeCheck, "id">): Promise<UptimeCheck> {
    const rows = await db
      .insert(uptimeChecks)
      .values({
        siteId: check.siteId,
        statusCode: check.statusCode,
        responseTimeMs: check.responseTimeMs,
        isReachable: check.isReachable,
        errorMessage: check.errorMessage,
        checkedAt: check.checkedAt,
      })
      .returning();
    return mapRow(rows[0]!);
  }

  async findBySiteId(siteId: string, since: Date): Promise<UptimeCheck[]> {
    const rows = await db
      .select()
      .from(uptimeChecks)
      .where(
        and(
          eq(uptimeChecks.siteId, siteId),
          gte(uptimeChecks.checkedAt, since),
        ),
      )
      .orderBy(desc(uptimeChecks.checkedAt));
    return rows.map(mapRow);
  }

  async getLatestBySiteId(siteId: string): Promise<UptimeCheck | null> {
    const rows = await db
      .select()
      .from(uptimeChecks)
      .where(eq(uptimeChecks.siteId, siteId))
      .orderBy(desc(uptimeChecks.checkedAt))
      .limit(1);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async getUptimePercentage(siteId: string, since: Date): Promise<number> {
    const result = await db
      .select({
        total: count(),
        reachable: count(
          sql`CASE WHEN ${uptimeChecks.isReachable} = true THEN 1 END`,
        ),
      })
      .from(uptimeChecks)
      .where(
        and(
          eq(uptimeChecks.siteId, siteId),
          gte(uptimeChecks.checkedAt, since),
        ),
      );

    const row = result[0];
    if (!row || row.total === 0) return 100;
    return Math.round((row.reachable / row.total) * 10000) / 100;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const rows = await db
      .delete(uptimeChecks)
      .where(lt(uptimeChecks.checkedAt, date))
      .returning();
    return rows.length;
  }
}
