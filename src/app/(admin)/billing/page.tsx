import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { getUserBillingInfo } from "@/application/billing/billing-actions";
import BillingPageClient from "./BillingPageClient";

export const metadata: Metadata = {
  title: "Billing | WP Dash",
  description: "Manage your WP Dash subscription",
};

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const billingInfo = await getUserBillingInfo();

  return <BillingPageClient billingInfo={billingInfo} />;
}
