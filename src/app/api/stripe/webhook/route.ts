import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, PLANS, type PlanName } from "@/lib/stripe";
import { db } from "@/infrastructure/database/drizzle-client";
import { userPlans } from "@/infrastructure/database/schemas/user-plans";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function planNameFromPriceId(priceId: string): PlanName | null {
  for (const [key, val] of Object.entries(PLANS) as [PlanName, (typeof PLANS)[PlanName]][]) {
    if (val.priceId === priceId) return key;
  }
  return null;
}

function sitesLimitForPlan(plan: PlanName): number {
  if (plan === "agency") return -1;
  return PLANS[plan].sites;
}

async function updateUserPlan(userId: string, plan: PlanName): Promise<void> {
  const sitesLimit = sitesLimitForPlan(plan);
  await db
    .insert(userPlans)
    .values({ userId, plan, sitesLimit, upgradedAt: new Date() })
    .onConflictDoUpdate({
      target: userPlans.userId,
      set: { plan, sitesLimit, upgradedAt: new Date(), updatedAt: new Date() },
    });
}

async function downgradeUser(userId: string): Promise<void> {
  await db
    .update(userPlans)
    .set({ plan: "free", sitesLimit: 3, updatedAt: new Date() })
    .where(eq(userPlans.userId, userId));
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.["userId"];
      if (!userId || session.mode !== "subscription") break;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (!subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      if (!priceId) break;

      const plan = planNameFromPriceId(priceId);
      if (plan && plan !== "free") await updateUserPlan(userId, plan);
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata["userId"];
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price.id;
      if (!priceId) break;

      const plan = planNameFromPriceId(priceId);
      if (plan && plan !== "free") await updateUserPlan(userId, plan);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata["userId"];
      if (!userId) break;

      await downgradeUser(userId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
