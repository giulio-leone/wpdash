"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createBillingPortalSession } from "@/application/billing/billing-actions";
import { PLANS, type PlanName } from "@/lib/stripe";

interface BillingInfo {
  plan: PlanName;
  sitesLimit: number;
  sitesUsed: number;
  upgradedAt: Date | null;
  email: string;
  stripeConfigured: boolean;
}

interface Props {
  billingInfo: BillingInfo | null;
}

const planFeatures: Record<PlanName, string[]> = {
  free: ["Up to 3 sites", "Basic uptime monitoring", "Weekly reports", "Email alerts"],
  pro: [
    "Up to 20 sites",
    "All monitoring features",
    "Real-time alerts",
    "Plugin updates",
    "Security audits",
    "Priority email support",
  ],
  agency: [
    "Unlimited sites",
    "All Pro features",
    "Priority support",
    "Advanced reports",
    "Multi-organization",
    "Custom integrations",
  ],
};

function PlanBadge({ plan }: { plan: PlanName }) {
  const colors: Record<PlanName, string> = {
    free: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    agency: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colors[plan]}`}>
      {PLANS[plan].name}
    </span>
  );
}

export default function BillingPageClient({ billingInfo }: Props) {
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!billingInfo) {
    return (
      <div className="mx-auto max-w-3xl py-8 text-center text-gray-500 dark:text-gray-400">
        Unable to load billing information.
      </div>
    );
  }

  const { plan, sitesUsed, sitesLimit, stripeConfigured } = billingInfo;
  const usagePct = sitesLimit === -1 ? 0 : Math.min(100, (sitesUsed / sitesLimit) * 100);
  const sitesDisplay = sitesLimit === -1 ? "Unlimited" : String(sitesLimit);

  function handleUpgrade(targetPlan: "pro" | "agency") {
    setLoadingPlan(targetPlan);
    startTransition(async () => {
      const result = await createCheckoutSession(targetPlan);
      if ("url" in result && result.url) {
        window.location.href = result.url;
      } else {
        alert(("error" in result ? result.error : null) ?? "Failed to start checkout");
        setLoadingPlan(null);
      }
    });
  }

  function handleManageBilling() {
    setLoadingPlan("portal");
    startTransition(async () => {
      const result = await createBillingPortalSession();
      if ("url" in result && result.url) {
        window.location.href = result.url;
      } else {
        alert(("error" in result ? result.error : null) ?? "Failed to open billing portal");
        setLoadingPlan(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
        {plan !== "free" && stripeConfigured && (
          <button
            onClick={handleManageBilling}
            disabled={isPending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {loadingPlan === "portal" ? "Loading…" : "Manage Billing"}
          </button>
        )}
      </div>

      {!stripeConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
          💳 Billing not configured — contact us to upgrade your plan.
        </div>
      )}

      {/* Current plan summary */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Plan</p>
            <div className="mt-1 flex items-center gap-2">
              <PlanBadge plan={plan} />
              {plan !== "free" && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  €{PLANS[plan].price}/month
                </span>
              )}
            </div>
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Sites used</span>
              <span>
                {sitesUsed} of {sitesDisplay}
              </span>
            </div>
            {sitesLimit !== -1 && (
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full transition-all ${
                    usagePct >= 100
                      ? "bg-red-500"
                      : usagePct >= 80
                        ? "bg-amber-400"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
            {sitesLimit === -1 && (
              <div className="mt-2 h-2 w-full rounded-full bg-purple-200 dark:bg-purple-900" />
            )}
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Free */}
        <div
          className={`relative rounded-xl border p-6 ${
            plan === "free"
              ? "border-gray-400 bg-gray-50 dark:border-gray-500 dark:bg-gray-800/50"
              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
          }`}
        >
          {plan === "free" && (
            <span className="mb-3 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              Current Plan
            </span>
          )}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Free</h3>
          <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
            €0<span className="text-base font-normal text-gray-500">/mo</span>
          </p>
          <ul className="mt-4 space-y-2">
            {planFeatures.free.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="mt-0.5 text-green-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {plan === "free" ? (
            <div className="mt-6 rounded-lg bg-gray-200 py-2 text-center text-sm font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              Current Plan
            </div>
          ) : null}
        </div>

        {/* Pro */}
        <div
          className={`relative rounded-xl border p-6 ${
            plan === "pro"
              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
              : "border-blue-200 bg-white dark:border-blue-800/40 dark:bg-gray-900"
          }`}
        >
          <span className="mb-3 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {plan === "pro" ? "Current Plan" : "⭐ Most Popular"}
          </span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pro</h3>
          <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
            €29<span className="text-base font-normal text-gray-500">/mo</span>
          </p>
          <ul className="mt-4 space-y-2">
            {planFeatures.pro.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="mt-0.5 text-blue-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {plan !== "pro" ? (
            <button
              onClick={() => handleUpgrade("pro")}
              disabled={!stripeConfigured || isPending}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              {loadingPlan === "pro" ? "Loading…" : "Upgrade to Pro"}
            </button>
          ) : (
            <div className="mt-6 rounded-lg bg-blue-100 py-2 text-center text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              Current Plan
            </div>
          )}
        </div>

        {/* Agency */}
        <div
          className={`relative rounded-xl border p-6 ${
            plan === "agency"
              ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20"
              : "border-purple-200 bg-white dark:border-purple-800/40 dark:bg-gray-900"
          }`}
        >
          {plan === "agency" && (
            <span className="mb-3 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              Current Plan
            </span>
          )}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agency</h3>
          <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">
            €99<span className="text-base font-normal text-gray-500">/mo</span>
          </p>
          <ul className="mt-4 space-y-2">
            {planFeatures.agency.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="mt-0.5 text-purple-500">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {plan !== "agency" ? (
            <button
              onClick={() => handleUpgrade("agency")}
              disabled={!stripeConfigured || isPending}
              className="mt-6 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60 dark:bg-purple-500 dark:hover:bg-purple-400"
            >
              {loadingPlan === "agency" ? "Loading…" : "Upgrade to Agency"}
            </button>
          ) : (
            <div className="mt-6 rounded-lg bg-purple-100 py-2 text-center text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Current Plan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
