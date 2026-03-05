import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { stripe, PLANS } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isConfigured =
    !!process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_placeholder");
  if (!isConfigured) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  let plan: "pro" | "agency";
  try {
    const body = (await request.json()) as { plan?: string };
    if (body.plan !== "pro" && body.plan !== "agency") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    plan = body.plan;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const selectedPlan = PLANS[plan];
  if (!selectedPlan.priceId) {
    return NextResponse.json({ error: `Price ID for ${plan} not configured` }, { status: 503 });
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

  return NextResponse.json({ url: session.url });
}
