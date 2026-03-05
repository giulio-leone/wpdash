import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-02-25.clover",
});

export const PLANS = {
  free: { name: "Free", sites: 3, price: 0, priceId: null },
  pro: {
    name: "Pro",
    sites: 20,
    price: 29,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
  },
  agency: {
    name: "Agency",
    sites: 9999,
    price: 99,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID ?? null,
  },
} as const;

export type PlanName = keyof typeof PLANS;
