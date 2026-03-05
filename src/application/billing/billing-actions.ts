"use server";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { db } from "@/infrastructure/database/drizzle-client";
import { userPlans } from "@/infrastructure/database/schemas/user-plans";
import { sites } from "@/infrastructure/database/schemas/sites";
import { eq, and, sql } from "drizzle-orm";
import { stripe, PLANS, type PlanName } from "@/lib/stripe";

const isStripeConfigured =
  !!process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_placeholder");

async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserBillingInfo() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await db.select().from(userPlans).where(eq(userPlans.userId, user.id));
  const plan = rows[0] ?? { plan: "free", sitesLimit: 3, upgradedAt: null };

  const siteRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sites)
    .where(and(eq(sites.userId, user.id), sql`${sites.orgId} IS NULL`));
  const sitesUsed = siteRows[0]?.count ?? 0;

  return {
    plan: plan.plan as PlanName,
    sitesLimit: plan.sitesLimit,
    sitesUsed,
    upgradedAt: plan.upgradedAt,
    email: user.email ?? "",
    stripeConfigured: isStripeConfigured,
  };
}

export async function getBillingStatus() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await db.select().from(userPlans).where(eq(userPlans.userId, user.id));
  const plan = rows[0];
  const planName = (plan?.plan ?? "free") as PlanName;
  const sitesLimit = plan?.sitesLimit ?? 3;

  const siteRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sites)
    .where(and(eq(sites.userId, user.id), sql`${sites.orgId} IS NULL`));
  const sitesUsed = siteRows[0]?.count ?? 0;

  return {
    plan: planName,
    sitesUsed,
    sitesLimit,
    isActive: planName !== "free",
  };
}

export async function createCheckoutSession(plan: "pro" | "agency") {
  if (!isStripeConfigured) {
    return { error: "Billing not configured" } as const;
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" } as const;

  const selectedPlan = PLANS[plan];
  if (!selectedPlan.priceId) {
    return { error: `Price ID for ${plan} not configured` } as const;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email ?? undefined,
    line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  return { url: session.url } as const;
}

export async function createBillingPortalSession() {
  if (!isStripeConfigured) {
    return { error: "Billing not configured" } as const;
  }

  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" } as const;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Find or create Stripe customer by email
  const existing = await stripe.customers.list({ email: user.email ?? "", limit: 1 });
  let customerId = existing.data[0]?.id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/billing`,
  });

  return { url: portalSession.url } as const;
}
