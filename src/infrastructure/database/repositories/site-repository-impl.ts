import { eq, and } from "drizzle-orm";
import { db } from "../drizzle-client";
import { sites } from "../schemas/sites";
import type { Site, CreateSiteInput, UpdateSiteInput, SiteStatus } from "@/domain/site/entity";
import type { SiteRepository } from "@/ports/repositories/site-repository";

function mapRowToSite(row: typeof sites.$inferSelect): Site {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    url: row.url,
    isActive: row.isActive,
    status: row.status as SiteStatus,
    lastCheckedAt: row.lastCheckedAt,
    wpVersion: row.wpVersion,
    phpVersion: row.phpVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSiteRepository implements SiteRepository {
  async findById(id: string): Promise<Site | null> {
    const rows = await db.select().from(sites).where(eq(sites.id, id));
    return rows[0] ? mapRowToSite(rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Site[]> {
    const rows = await db.select().from(sites).where(eq(sites.userId, userId));
    return rows.map(mapRowToSite);
  }

  async findByUrl(url: string, userId: string): Promise<Site | null> {
    const rows = await db
      .select()
      .from(sites)
      .where(and(eq(sites.url, url), eq(sites.userId, userId)));
    return rows[0] ? mapRowToSite(rows[0]) : null;
  }

  async create(input: CreateSiteInput, tokenHash: string): Promise<Site> {
    const rows = await db
      .insert(sites)
      .values({
        userId: input.userId,
        name: input.name,
        url: input.url,
        tokenHash,
      })
      .returning();
    return mapRowToSite(rows[0]!);
  }

  async update(id: string, input: UpdateSiteInput): Promise<Site | null> {
    const rows = await db
      .update(sites)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(sites.id, id))
      .returning();
    return rows[0] ? mapRowToSite(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const rows = await db.delete(sites).where(eq(sites.id, id)).returning();
    return rows.length > 0;
  }

  async findAllActive(): Promise<Site[]> {
    const rows = await db.select().from(sites).where(eq(sites.isActive, true));
    return rows.map(mapRowToSite);
  }

  async updateTokenHash(id: string, tokenHash: string): Promise<void> {
    await db
      .update(sites)
      .set({ tokenHash, updatedAt: new Date() })
      .where(eq(sites.id, id));
  }
}
