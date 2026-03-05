import type { Metadata } from "next";
import NetworkUpdatesClient from "@/components/updates/NetworkUpdatesClient";

export const metadata: Metadata = {
  title: "Updates | WP Dash",
  description: "Manage pending updates across all your WordPress sites",
};

export default function UpdatesPage() {
  return <NetworkUpdatesClient />;
}
