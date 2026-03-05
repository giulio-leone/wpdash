"use server";

import { getCurrentUserId } from "@/lib/server-auth";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { DrizzleSecurityAuditRepository } from "@/infrastructure/database/repositories/security-repository-impl";
import { DrizzleSiteRepository } from "@/infrastructure/database/repositories/site-repository-impl";
import type {
  SecurityAudit,
  SecurityAuditStatus,
  SecurityFinding,
  SecurityFindingSeverity,
} from "@/domain/security/entity";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";
import type { BridgeSecurityFinding } from "@/infrastructure/wp-bridge/types";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites as sitesSchema } from "@/infrastructure/database/schemas/sites";
import { eq } from "drizzle-orm";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

const securityRepo = new DrizzleSecurityAuditRepository();
const siteRepo = new DrizzleSiteRepository();
const bridgeClient = new WPBridgeClient();


async function verifySiteOwnership(siteId: string, userId: string) {
  const site = await siteRepo.findById(siteId);
  if (!site || site.userId !== userId) return null;
  return site;
}

function mapBridgeSeverity(severity: BridgeSecurityFinding["severity"]): SecurityFindingSeverity {
  switch (severity) {
    case "critical":
      return "critical";
    case "warning":
      return "high";
    case "info":
      return "low";
    default:
      return "medium";
  }
}

function deriveStatus(findings: SecurityFinding[]): SecurityAuditStatus {
  if (findings.some((f) => f.severity === "critical")) return "critical";
  if (findings.some((f) => f.severity === "high")) return "warning";
  return "clean";
}

export async function runSecurityAudit(
  siteId: string,
  bridgeToken?: string,
): Promise<ActionResult<SecurityAudit>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await verifySiteOwnership(siteId, userId);
  if (!site) return { success: false, error: "Site not found" };

  // Get token from DB if not provided
  let token = bridgeToken;
  if (!token) {
    const rows = await db
      .select({ tokenHash: sitesSchema.tokenHash })
      .from(sitesSchema)
      .where(eq(sitesSchema.id, siteId));
    token = rows[0]?.tokenHash;
  }
  if (!token) return { success: false, error: "No bridge token configured" };

  try {
    const response = await bridgeClient.getSecurityAudit(
      site.url,
      token,
    );

    const findings: SecurityFinding[] = response.findings.map((f) => ({
      filePath: f.file ?? "",
      issue: f.message,
      severity: mapBridgeSeverity(f.severity),
    }));

    const status = deriveStatus(findings);
    const suspiciousFilesCount = findings.filter(
      (f) => f.severity === "critical" || f.severity === "high",
    ).length;

    const audit = await securityRepo.create({
      siteId,
      status,
      coreIntegrityPassed: !findings.some((f) => f.severity === "critical"),
      suspiciousFilesCount,
      findings,
      auditedAt: new Date(),
    });

    return { success: true, data: audit };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Security audit failed",
    };
  }
}

export async function getSecurityAuditHistory(
  siteId: string,
): Promise<ActionResult<SecurityAudit[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await verifySiteOwnership(siteId, userId);
  if (!site) return { success: false, error: "Site not found" };

  const audits = await securityRepo.findBySiteId(siteId);
  return { success: true, data: audits };
}

export async function getLatestSecurityStatus(
  siteId: string,
): Promise<ActionResult<SecurityAudit | null>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  const site = await verifySiteOwnership(siteId, userId);
  if (!site) return { success: false, error: "Site not found" };

  let audit = await securityRepo.getLatestBySiteId(siteId);

  // Auto-run security audit when no cached data
  if (!audit) {
    const result = await runSecurityAudit(siteId);
    if (result.success) audit = result.data;
  }

  return { success: true, data: audit };
}
