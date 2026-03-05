"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { organizations, orgMembers, userPlans } from "@/infrastructure/database/schemas";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq, and, sql } from "drizzle-orm";
import crypto from "crypto";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Get the current user's plan (creates free plan if doesn't exist)
export async function getUserPlan() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const rows = await db.select().from(userPlans).where(eq(userPlans.userId, userId));
  if (rows[0]) return rows[0];

  // Create default free plan
  await db.insert(userPlans).values({ userId }).onConflictDoNothing();
  const created = await db.select().from(userPlans).where(eq(userPlans.userId, userId));
  return created[0] ?? null;
}

// Get user's organizations (as member or owner)
export async function getUserOrgs() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const rows = await db
    .select({ org: organizations, member: orgMembers })
    .from(orgMembers)
    .innerJoin(organizations, eq(orgMembers.orgId, organizations.id))
    .where(eq(orgMembers.userId, userId));

  return rows.map(({ org, member }) => ({ ...org, role: member.role }));
}

// Create a new organization
export async function createOrg(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false as const, error: "Not authenticated" };

  const name = formData.get("name")?.toString().trim();
  if (!name) return { success: false as const, error: "Name is required" };

  let slug =
    formData.get("slug")?.toString().trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  // Ensure slug uniqueness by appending a short suffix if needed
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug));
  if (existing.length > 0) {
    slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
  }

  const [org] = await db
    .insert(organizations)
    .values({ ownerId: userId, name, slug })
    .returning();

  if (!org) return { success: false as const, error: "Failed to create organization" };

  await db.insert(orgMembers).values({
    orgId: org.id,
    userId,
    role: "owner",
    inviteAccepted: true,
  });

  return { success: true as const, data: org };
}

// Invite a member by email
export async function inviteMember(orgId: string, email: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false as const, error: "Not authenticated" };

  // Verify caller is owner or admin of the org
  const membership = await db
    .select()
    .from(orgMembers)
    .where(
      and(
        eq(orgMembers.orgId, orgId),
        eq(orgMembers.userId, userId),
      ),
    );
  const role = membership[0]?.role;
  if (!role || (role !== "owner" && role !== "admin")) {
    return { success: false as const, error: "Insufficient permissions" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(orgMembers).values({
    orgId,
    userId: "00000000-0000-0000-0000-000000000000", // placeholder until accepted
    role: "member",
    inviteEmail: email,
    inviteToken: token,
    inviteAccepted: false,
  });

  return { success: true as const, data: { token } };
}

// Accept an invite
export async function acceptInvite(token: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false as const, error: "Not authenticated" };

  const rows = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.inviteToken, token));

  if (!rows[0] || rows[0].inviteAccepted) {
    return { success: false as const, error: "Invalid or already used invite token" };
  }

  await db
    .update(orgMembers)
    .set({
      userId,
      inviteAccepted: true,
      acceptedAt: new Date(),
      inviteToken: null,
    })
    .where(eq(orgMembers.inviteToken, token));

  return { success: true as const };
}

// Remove a member
export async function removeMember(orgId: string, memberId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false as const, error: "Not authenticated" };

  // Verify caller is owner or admin
  const membership = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
  const role = membership[0]?.role;
  if (!role || (role !== "owner" && role !== "admin")) {
    return { success: false as const, error: "Insufficient permissions" };
  }

  await db
    .delete(orgMembers)
    .where(and(eq(orgMembers.id, memberId), eq(orgMembers.orgId, orgId)));

  return { success: true as const };
}

// List org members
export async function getOrgMembers(orgId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // Verify caller is a member
  const membership = await db
    .select()
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)));
  if (!membership[0]) return [];

  const rows = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.orgId, orgId));

  return rows;
}

// Check if user can add more sites (quota check)
export async function canAddSite(
  orgId?: string | null,
): Promise<{ allowed: boolean; current: number; limit: number; plan: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { allowed: false, current: 0, limit: 0, plan: "free" };

  if (orgId) {
    const orgRows = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId));
    const org = orgRows[0];
    if (!org) return { allowed: false, current: 0, limit: 0, plan: "free" };

    const siteRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.orgId, orgId));
    const current = siteRows[0]?.count ?? 0;
    const limit = org.sitesLimit;
    return {
      allowed: limit === -1 || current < limit,
      current,
      limit,
      plan: org.plan,
    };
  }

  // Personal quota
  const plan = await getUserPlan();
  const sitesLimit = plan?.sitesLimit ?? 3;
  const planName = plan?.plan ?? "free";

  const siteRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sites)
    .where(and(eq(sites.userId, userId), sql`${sites.orgId} IS NULL`));
  const current = siteRows[0]?.count ?? 0;

  return {
    allowed: sitesLimit === -1 || current < sitesLimit,
    current,
    limit: sitesLimit,
    plan: planName,
  };
}
