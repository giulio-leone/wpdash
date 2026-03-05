import { cache } from "react";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq } from "drizzle-orm";

/**
 * Per-request deduplicated site-list fetch.
 * React cache() ensures this runs at most once per SSR render tree,
 * even if called from multiple server components.
 */
export const getCachedSitesByUser = cache(async (userId: string) => {
  return db.select().from(sites).where(eq(sites.userId, userId));
});

/** Per-request deduplicated single-site fetch. */
export const getCachedSiteById = cache(async (siteId: string, userId: string) => {
  const rows = await db
    .select()
    .from(sites)
    .where(eq(sites.id, siteId))
    .limit(1);
  const site = rows[0];
  if (!site || site.userId !== userId) return null;
  return site;
});
