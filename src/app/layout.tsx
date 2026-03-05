import { Inter } from "next/font/google";
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import type { Metadata } from "next";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: { default: "WP Dash", template: "%s | WP Dash" },
  description: "Centralized WordPress monitoring and maintenance dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Load __name polyfill before Turbopack/esbuild-compiled dependency chunks execute */}
      <Script src="/polyfill.js" strategy="beforeInteractive" />
      <body className={`${inter.className} dark:bg-gray-950`}>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
