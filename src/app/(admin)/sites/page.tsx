import type { Metadata } from "next";
import { getSites } from "@/application/site/site-actions";
import SitesList from "@/components/sites/SitesList";

export const metadata: Metadata = {
  title: "Sites | WP Dash",
  description: "Manage your WordPress sites",
};

export default async function SitesPage() {
  const result = await getSites();
  const sites = result.success ? result.data : [];
  return <SitesList initialSites={sites} />;
}
