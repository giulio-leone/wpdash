import { Metadata } from "next";
import ConnectPageClient from "./ConnectPageClient";

export const metadata: Metadata = {
  title: "Connect WordPress Site | WP Dash",
  description: "Connect a new WordPress site to your WP Dash dashboard",
};

export default function ConnectPage() {
  return <ConnectPageClient />;
}
