"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { userPlans, adminUsers, organizations } from "@/infrastructure/database/schemas";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq, sql } from "drizzle-orm";

function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireAdmin(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.userId, user.id));
  return rows[0] ? user.id : null;
}

// Get all users with their plans and site counts
export async function adminGetAllUsers() {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false as const, error: "Forbidden" };

  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
  if (error) return { success: false as const, error: error.message };

  const users = data.users;

  const planRows = await db.select().from(userPlans);
  const planMap = new Map(planRows.map((p) => [p.userId, p]));

  const siteRows = await db
    .select({
      userId: sites.userId,
      count: sql<number>`count(*)::int`,
    })
    .from(sites)
    .groupBy(sites.userId);
  const siteCountMap = new Map(siteRows.map((r) => [r.userId, r.count]));

  const adminRows = await db.select().from(adminUsers);
  const adminSet = new Set(adminRows.map((a) => a.userId));

  return {
    success: true as const,
    data: users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      createdAt: u.created_at,
      plan: planMap.get(u.id)?.plan ?? "free",
      sitesLimit: planMap.get(u.id)?.sitesLimit ?? 3,
      siteCount: siteCountMap.get(u.id) ?? 0,
      isAdmin: adminSet.has(u.id),
    })),
  };
}

// Get platform stats
export async function adminGetStats() {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false as const, error: "Forbidden" };

  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
  if (error) return { success: false as const, error: error.message };

  const totalUsers = data.users.length;

  const [siteCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sites);
  const totalSites = siteCountRow?.count ?? 0;

  const [orgCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organizations);
  const totalOrgs = orgCountRow?.count ?? 0;

  const planRows = await db.select({ plan: userPlans.plan }).from(userPlans);
  const planCounts: Record<string, number> = {};
  for (const { plan } of planRows) {
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
  }
  // Users without a plan row are on free
  const freeWithPlanRow = planCounts["free"] ?? 0;
  const usersWithPlanRow = planRows.length;
  planCounts["free"] = freeWithPlanRow + (totalUsers - usersWithPlanRow);

  return {
    success: true as const,
    data: { totalUsers, totalSites, totalOrgs, planCounts },
  };
}

// Change user plan
export async function adminChangePlan(userId: string, plan: string, sitesLimit: number) {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false as const, error: "Forbidden" };

  await db
    .insert(userPlans)
    .values({ userId, plan, sitesLimit })
    .onConflictDoUpdate({
      target: userPlans.userId,
      set: { plan, sitesLimit, updatedAt: new Date() },
    });

  return { success: true as const };
}

// Toggle admin status for a user
export async function adminToggleAdmin(userId: string, isAdmin: boolean) {
  const adminId = await requireAdmin();
  if (!adminId) return { success: false as const, error: "Forbidden" };

  if (isAdmin) {
    await db.insert(adminUsers).values({ userId }).onConflictDoNothing();
  } else {
    await db.delete(adminUsers).where(eq(adminUsers.userId, userId));
  }

  return { success: true as const };
}
