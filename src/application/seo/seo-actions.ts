"use server";

import { getCurrentUserId } from "@/lib/server-auth";

import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DrizzleSeoRepository } from "@/infrastructure/database/repositories/seo-repository-impl";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import {
  SEO_TITLE_MIN_LENGTH,
  SEO_TITLE_MAX_LENGTH,
  SEO_META_DESC_MIN_LENGTH,
  SEO_META_DESC_MAX_LENGTH,
} from "@/lib/constants";
import type { SeoAudit } from "@/domain/seo/entity";
import type { BridgeSeoAuditResponse } from "@/infrastructure/wp-bridge/types";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const repo = new DrizzleSeoRepository();
const bridge = new WPBridgeClient();


async function getSiteConnection(siteId: string, userId: string) {
  const rows = await db
    .select({ url: sites.url, tokenHash: sites.tokenHash, userId: sites.userId })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, userId)));
  const site = rows[0];
  if (!site) return null;
  return { url: site.url, token: site.tokenHash };
}

function calculateSeoScore(audit: BridgeSeoAuditResponse): number {
  let score = 0;

  // Title (25 pts)
  if (audit.title) {
    score += 15;
    const len = audit.title.length;
    if (len >= SEO_TITLE_MIN_LENGTH && len <= SEO_TITLE_MAX_LENGTH) score += 10;
    else if (len > 0) score += 5;
  }

  // Meta description (25 pts)
  if (audit.meta_description) {
    score += 15;
    const len = audit.meta_description.length;
    if (len >= SEO_META_DESC_MIN_LENGTH && len <= SEO_META_DESC_MAX_LENGTH) score += 10;
    else if (len > 0) score += 5;
  }

  // H1 (20 pts)
  const h1Count = audit.headings.h1.count;
  if (h1Count === 1) score += 20;
  else if (h1Count > 0) score += 10;

  // H2 (10 pts)
  if (audit.headings.h2.count > 0) score += 10;

  // Images without alt (10 pts)
  if (audit.images_without_alt === 0) score += 10;
  else if (audit.images_without_alt <= 2) score += 5;

  // Canonical (5 pts)
  if (audit.canonical) score += 5;

  // OG tags (5 pts)
  if (audit.og_title) score += 3;
  if (audit.og_description) score += 2;

  return Math.min(score, 100);
}

export async function runSeoAudit(
  siteId: string,
  pageUrl?: string,
): Promise<ActionResult<SeoAudit>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  const targetUrl = pageUrl ?? conn.url;

  try {
    const result = await bridge.runSeoAudit(conn.url, conn.token, targetUrl);
    const score = calculateSeoScore(result);

    const audit = await repo.create({
      siteId,
      pageUrl: result.url,
      title: result.title,
      metaDescription: result.meta_description,
      metaKeywords: result.meta_keywords,
      headersStructure: {
        h1: result.headings.h1.content,
        h2: result.headings.h2.content,
        h3: result.headings.h3.content,
      },
      score,
      auditedAt: new Date(result.audited_at),
    });

    return { success: true, data: audit };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to run SEO audit";
    return { success: false, error: message };
  }
}

export async function getSeoAuditHistory(
  siteId: string,
): Promise<ActionResult<SeoAudit[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  const audits = await repo.findBySiteId(siteId, 20);
  return { success: true, data: audits };
}

export async function getLatestSeoStatus(
  siteId: string,
): Promise<ActionResult<SeoAudit | null>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const conn = await getSiteConnection(siteId, userId);
  if (!conn) return { success: false, error: "Site not found" };

  let audit = await repo.getLatestBySiteId(siteId);

  // Auto-run SEO audit when no cached data
  if (!audit) {
    const result = await runSeoAudit(siteId);
    if (result.success) audit = result.data;
  }

  return { success: true, data: audit };
}
