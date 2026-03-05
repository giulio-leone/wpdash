import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Find or create Stripe customer
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

  return NextResponse.json({ url: portalSession.url });
}
