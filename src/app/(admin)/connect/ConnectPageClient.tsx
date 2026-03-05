"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createSite } from "@/application/site/site-actions";
import { toast } from "@/hooks/useToast";
import {
  BoltIcon, DownloadIcon, PlugInIcon, CheckCircleIcon,
  CheckLineIcon, LockIcon, PieChartIcon, ArrowUpIcon, ArrowRightIcon,
} from "@/icons";

type Phase = "form" | "done";

export default function ConnectPageClient() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteToken, setSiteToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  function getMagicInstallUrl() {
    if (!siteUrl) return null;
    try {
      const base = siteUrl.replace(/\/$/, "");
      // Opens WP admin plugin install page — user clicks Install from there
      return `${base}/wp-admin/plugin-install.php?s=wp-dash-bridge&tab=search&type=term`;
    } catch {
      return null;
    }
  }

  async function handleVerify() {
    if (!siteUrl || !siteToken) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/sites/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl, token: siteToken }),
      });
      if (res.ok) {
        setVerified(true);
        toast.success("Connection verified! Site is reachable.");
      } else {
        toast.error("Could not connect. Check URL and token.");
      }
    } catch {
      toast.error("Verification failed. Check URL and token.");
    }
    setVerifying(false);
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!siteName || !siteUrl) return;
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", siteName);
    fd.append("url", siteUrl);
    if (siteToken) fd.append("token", siteToken);
    const result = await createSite(fd);
    setSubmitting(false);
    if (result.success) {
      setPhase("done");
    } else {
      toast.error(result.error ?? "Failed to connect site");
    }
  }

  if (phase === "done") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircleIcon className="h-14 w-14 text-green-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Site Connected!</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            <strong className="text-gray-800 dark:text-gray-200">{siteName}</strong> is now connected.
            Monitoring starts immediately.
          </p>
        </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          {[
            { icon: <PieChartIcon className="w-5 h-5 text-brand-500" />, label: "Uptime monitoring active" },
            { icon: <LockIcon className="w-5 h-5 text-gray-500" />, label: "Security audit queued" },
            { icon: <PlugInIcon className="w-5 h-5 text-blue-500" />, label: "Plugin sync ready" },
            { icon: <ArrowUpIcon className="w-5 h-5 text-green-500" />, label: "SEO audit available" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 text-left dark:bg-gray-800">
              <span className="flex items-center">{item.icon}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/sites")}
            className="rounded-xl bg-brand-500 px-8 py-3 font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => { setPhase("form"); setSiteName(""); setSiteUrl(""); setSiteToken(""); setVerified(false); }}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            Add Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/20">
          <BoltIcon className="h-7 w-7 text-brand-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connect a WordPress Site</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter your site details below. Takes less than 60 seconds.
        </p>
      </div>

      {/* Help accordion: get bridge plugin */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <button
          type="button"
          onClick={() => setHelpOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <PlugInIcon className="h-5 w-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Step 1 — Install Bridge Plugin</p>
              <p className="text-xs text-gray-400">Download & activate the WP Dash Bridge on your site</p>
            </div>
          </div>
          <ArrowRightIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${helpOpen ? "rotate-90" : ""}`} />
        </button>

        {helpOpen && (
          <div className="border-t border-gray-100 px-5 pb-5 dark:border-gray-800">
            <ol className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">1</span>
                <span>Download the bridge plugin ZIP from the button below</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">2</span>
                <span>In your WP admin: <strong>Plugins → Add New → Upload Plugin</strong>, select the ZIP</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">3</span>
                <span>Activate it — your Bearer Token appears under <strong>WP Dash Bridge → Settings</strong></span>
              </li>
            </ol>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href="/api/plugin-download"
                download="wp-dash-bridge.zip"
                className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
              >
                <DownloadIcon className="h-4 w-4" />
                Download Bridge Plugin
              </a>
              {siteUrl && getMagicInstallUrl() && (
                <a
                  href={getMagicInstallUrl()!}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-brand-200 px-4 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20 transition-colors"
                >
                  <BoltIcon className="h-4 w-4" />
                  Open WP Plugin Installer
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main connection form */}
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-5 flex items-center gap-3">
          <ArrowRightIcon className="h-5 w-5 text-brand-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Step 2 — Connect to Dashboard</p>
            <p className="text-xs text-gray-400">Enter your site details to start monitoring</p>
          </div>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Site Name
            </label>
            <input
              type="text"
              required
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="My WordPress Site"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Site URL
            </label>
            <input
              type="url"
              required
              value={siteUrl}
              onChange={(e) => { setSiteUrl(e.target.value); setVerified(false); }}
              placeholder="https://yoursite.com"
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bearer Token
              <span className="ml-1 text-xs font-normal text-gray-400">(from WP Dash Bridge → Settings)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={siteToken}
                onChange={(e) => { setSiteToken(e.target.value); setVerified(false); }}
                placeholder="Paste your token here"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={!siteUrl || !siteToken || verifying || verified}
                className="shrink-0 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
              >
                {verifying ? "Checking…" : verified ? <CheckLineIcon className="h-4 w-4 text-green-500" /> : "Test"}
              </button>
            </div>
            {verified && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <CheckLineIcon className="h-3.5 w-3.5" />
                Connection verified
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !siteName || !siteUrl}
            className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Connecting…" : "Connect Site"}
          </button>
        </form>

        {/* Security note */}
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <LockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
          <span>Your password is never stored. Communication uses encrypted Bearer Tokens only.</span>
        </div>
      </div>
    </div>
  );
}
