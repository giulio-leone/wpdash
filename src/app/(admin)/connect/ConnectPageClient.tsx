"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createSite } from "@/application/site/site-actions";
import { toast } from "@/hooks/useToast";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: "Welcome" },
  { id: 2, label: "Download Plugin" },
  { id: 3, label: "Install & Activate" },
  { id: 4, label: "Connect Site" },
  { id: 5, label: "Done!" },
];

export default function ConnectPageClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteToken, setSiteToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

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
      setStep(5);
    } else {
      toast.error(result.error ?? "Failed to connect site");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-start py-12 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Connect a WordPress Site</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Follow the steps to add a site to your dashboard</p>
      </div>

      {/* Step indicator */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 z-0" />
          {STEPS.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  step === s.id
                    ? "bg-brand-500 border-brand-500 text-white"
                    : step > s.id
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-400"
                }`}
              >
                {step > s.id ? "✓" : s.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.id ? "text-brand-500" : step > s.id ? "text-green-500" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div className="p-10 flex flex-col items-center text-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-5xl">
              🚀
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to WP Dash!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-base max-w-md mx-auto">
                Connect your WordPress site in 4 easy steps. We&apos;ll guide you through installing the bridge plugin
                and linking your site securely.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full mt-2">
              {[
                { icon: "🔒", title: "Secure", desc: "Bearer token auth, no password stored" },
                { icon: "⚡", title: "Lightweight", desc: "Plugin responds only when dashboard asks" },
                { icon: "🔌", title: "Compatible", desc: "Works with any WP hosting & security plugins" },
              ].map((f) => (
                <div key={f.title} className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-center">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{f.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{f.desc}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              className="mt-2 px-10 py-3 rounded-xl bg-brand-500 text-white font-semibold text-base hover:bg-brand-600 transition-colors"
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Step 2 — Download plugin */}
        {step === 2 && (
          <div className="p-10 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-4xl">
              📦
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Download the Bridge Plugin</h2>
              <p className="text-gray-500 dark:text-gray-400">
                The WP Dash Bridge is an ultra-lightweight WordPress plugin that lets the dashboard communicate
                securely with your site.
              </p>
            </div>
            <div className="w-full rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📋</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">What the plugin does:</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {[
                  "Exposes secure REST API endpoints under /wp-json/wpdash/v1/",
                  "Authenticates every request via a unique Bearer Token",
                  "Responds only when the dashboard calls it (no background processes)",
                  "Works alongside Wordfence, iThemes, and other security plugins",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <a
              href="/api/plugin-download"
              download="wp-dash-bridge.zip"
              className="flex items-center gap-3 px-8 py-4 rounded-xl bg-blue-500 text-white font-semibold text-base hover:bg-blue-600 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download wp-dash-bridge.zip
            </a>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(1)} className="px-6 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors">
                ← Back
              </button>
              <button onClick={() => setStep(3)} className="px-6 py-2 rounded-lg bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors">
                Downloaded →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Install & get token */}
        {step === 3 && (
          <div className="p-10 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-4xl">
              🔧
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Install &amp; Get Your Token</h2>
              <p className="text-gray-500 dark:text-gray-400">Follow these steps in your WordPress admin panel</p>
            </div>
            <div className="w-full space-y-4">
              {[
                {
                  step: "1",
                  title: "Upload the plugin",
                  desc: 'Go to Plugins → Add New → Upload Plugin, then select the downloaded ZIP file and click "Install Now"',
                  icon: "📂",
                },
                {
                  step: "2",
                  title: "Activate the plugin",
                  desc: 'After installation, click "Activate Plugin" to enable it on your WordPress site',
                  icon: "✅",
                },
                {
                  step: "3",
                  title: "Copy your Bearer Token",
                  desc: 'Go to WP Dash Bridge → Settings in your WP admin. Your unique token is displayed there. Copy it — you\'ll need it in the next step.',
                  icon: "🔑",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{item.title}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setStep(2)} className="px-6 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors">
                ← Back
              </button>
              <button onClick={() => setStep(4)} className="px-6 py-2 rounded-lg bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors">
                I have my token →
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Connect */}
        {step === 4 && (
          <div className="p-10 flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-4xl">
              🔗
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Site</h2>
              <p className="text-gray-500 dark:text-gray-400">Enter your site details to complete the connection</p>
            </div>
            <form onSubmit={handleConnect} className="w-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="My WordPress Site"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Site URL
                </label>
                <input
                  type="url"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://yoursite.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Bearer Token <span className="text-gray-400 font-normal">(from WP Dash Bridge plugin)</span>
                </label>
                <input
                  type="text"
                  value={siteToken}
                  onChange={(e) => { setSiteToken(e.target.value); setVerified(false); }}
                  placeholder="Paste your token here"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
                />
              </div>
              {siteUrl && siteToken && !verified && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-brand-500 text-brand-500 font-semibold text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors disabled:opacity-50"
                >
                  {verifying ? "Verifying connection…" : "🔍 Test Connection"}
                </button>
              )}
              {verified && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <span className="text-green-500 text-lg">✅</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">Connection verified! Site is reachable.</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !siteName || !siteUrl}
                  className="flex-1 px-6 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Connecting…" : "Connect Site →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 5 — Done */}
        {step === 5 && (
          <div className="p-10 flex flex-col items-center text-center gap-6">
            <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-5xl animate-bounce">
              🎉
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Site Connected!</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                <strong className="text-gray-800 dark:text-gray-200">{siteName}</strong> is now connected to your
                WP Dash dashboard. Monitoring starts immediately.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-2">
              {[
                { icon: "📊", label: "Uptime monitoring active" },
                { icon: "🔒", label: "Security audit queued" },
                { icon: "🔌", label: "Plugin sync ready" },
                { icon: "📈", label: "SEO audit available" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-left">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => router.push("/sites")}
                className="px-8 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
              >
                View Sites Dashboard
              </button>
              <button
                onClick={() => { setStep(1); setSiteName(""); setSiteUrl(""); setSiteToken(""); setVerified(false); }}
                className="px-8 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
              >
                + Connect Another Site
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom help text */}
      {step < 5 && (
        <p className="mt-6 text-sm text-gray-400 dark:text-gray-600">
          Need help?{" "}
          <a href="/mcp" className="text-brand-500 hover:underline">
            Check the MCP / AI docs
          </a>{" "}
          or{" "}
          <a href="mailto:support@wpdash.io" className="text-brand-500 hover:underline">
            contact support
          </a>
        </p>
      )}
    </div>
  );
}
