"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DrizzleSiteRepository } from "@/infrastructure/database/repositories/site-repository-impl";
import { generateSiteToken, hashToken } from "./token-service";
import { createSiteSchema, updateSiteSchema } from "./validation";
import type { Site } from "@/domain/site/entity";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites as sitesSchema } from "@/infrastructure/database/schemas/sites";
import { eq } from "drizzle-orm";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const repo = new DrizzleSiteRepository();

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createSite(
  formData: FormData,
): Promise<ActionResult<{ site: Site; token: string }>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const parsed = createSiteSchema.safeParse({
    name: formData.get("name"),
    url: formData.get("url"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const { name, url } = parsed.data;

  const existing = await repo.findByUrl(url, userId);
  if (existing) {
    return { success: false, error: "A site with this URL already exists" };
  }

  const token = generateSiteToken();
  const tokenHash = await hashToken(token);
  const site = await repo.create({ userId, name, url }, tokenHash);

  return { success: true, data: { site, token } };
}

export async function updateSite(
  siteId: string,
  formData: FormData,
): Promise<ActionResult<Site>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await repo.findById(siteId);
  if (!site || site.userId !== userId) {
    return { success: false, error: "Site not found" };
  }

  const parsed = updateSiteSchema.safeParse({
    name: formData.get("name") || undefined,
    url: formData.get("url") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" };
  }

  const updated = await repo.update(siteId, parsed.data);
  if (!updated) return { success: false, error: "Failed to update site" };

  return { success: true, data: updated };
}

export async function deleteSite(siteId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await repo.findById(siteId);
  if (!site || site.userId !== userId) {
    return { success: false, error: "Site not found" };
  }

  // eslint-disable-next-line drizzle/enforce-delete-with-where
  const deleted = await repo.delete(siteId);
  if (!deleted) return { success: false, error: "Failed to delete site" };

  return { success: true, data: undefined };
}

export async function regenerateToken(
  siteId: string,
): Promise<ActionResult<{ token: string }>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await repo.findById(siteId);
  if (!site || site.userId !== userId) {
    return { success: false, error: "Site not found" };
  }

  const token = generateSiteToken();
  const tokenHash = await hashToken(token);
  await repo.updateTokenHash(siteId, tokenHash);

  return { success: true, data: { token } };
}

export async function getSites(): Promise<ActionResult<Site[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const sites = await repo.findByUserId(userId);
  return { success: true, data: sites };
}

export async function getSiteById(id: string): Promise<ActionResult<Site>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await repo.findById(id);
  if (!site || site.userId !== userId) {
    return { success: false, error: "Site not found" };
  }

  return { success: true, data: site };
}

/**
 * Fetch health data from WP Bridge and update the site record
 * (wpVersion, phpVersion, status).
 */
export async function fetchSiteHealth(
  siteId: string,
): Promise<ActionResult<{ wpVersion: string; phpVersion: string }>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await repo.findById(siteId);
  if (!site || site.userId !== userId)
    return { success: false, error: "Site not found" };

  // Get token from DB
  const rows = await db
    .select({ tokenHash: sitesSchema.tokenHash })
    .from(sitesSchema)
    .where(eq(sitesSchema.id, siteId));
  const token = rows[0]?.tokenHash;
  if (!token) return { success: false, error: "No bridge token configured" };

  try {
    const bridge = new WPBridgeClient();
    const health = await bridge.getHealth(site.url, token);

    await repo.update(siteId, {
      wpVersion: health.wp_version,
      phpVersion: health.php_version,
      status: "online",
    });

    return {
      success: true,
      data: {
        wpVersion: health.wp_version,
        phpVersion: health.php_version,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Health check failed",
    };
  }
}
