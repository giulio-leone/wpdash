import type { Metadata } from "next";
import { getNetworkOverview } from "@/application/report/report-actions";
import { getSites } from "@/application/site/site-actions";
import NetworkOverview from "@/components/reports/NetworkOverview";

export const metadata: Metadata = {
  title: "Reports | WP Dash",
  description: "Network reports and export",
};

export default async function ReportsPage() {
  const [overviewResult, sitesResult] = await Promise.all([
    getNetworkOverview(),
    getSites(),
  ]);

  const overview = overviewResult.success ? overviewResult.data : null;
  const sites = sitesResult.success ? sitesResult.data : [];

  return <NetworkOverview overview={overview} sites={sites} />;
}
