import type { Metadata } from "next";
import { getSiteById } from "@/application/site/site-actions";
import { notFound } from "next/navigation";
import SiteDetailClient from "./SiteDetailClient";

export const metadata: Metadata = {
  title: "Site Details | WP Dash",
  description: "View and manage your WordPress site",
};

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSiteById(id);

  if (!result.success) {
    notFound();
  }

  return <SiteDetailClient site={result.data} />;
}
