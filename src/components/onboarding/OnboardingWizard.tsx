"use client";
import React, { useState } from "react";
import { createSite } from "@/application/site/site-actions";
import { toast } from "@/hooks/useToast";

type Step = 1 | 2 | 3 | 4;

export default function OnboardingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", siteName);
    fd.append("url", siteUrl);
    const result = await createSite(fd);
    setSubmitting(false);
    if (result.success) {
      setStep(4);
    } else {
      toast.error(result.error ?? "Failed to connect site");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div
            key={s}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              step === s ? "bg-brand-500" : step > s ? "bg-brand-300" : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-4xl">
            🚀
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to WP Dash!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Connect your first WordPress site in 3 easy steps.
          </p>
          <button
            onClick={() => setStep(2)}
            className="mt-2 px-8 py-3 rounded-xl bg-brand-500 text-white font-semibold text-base hover:bg-brand-600 transition-colors"
          >
            Get Started
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-4xl">
            🔌
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Install the Bridge Plugin</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Download and install the <strong>WP Dash Bridge</strong> plugin on your WordPress site.
          </p>
          <ol className="text-left text-sm text-gray-600 dark:text-gray-400 space-y-2 w-full">
            <li className="flex gap-2"><span className="font-bold text-brand-500">1.</span> Download the plugin below</li>
            <li className="flex gap-2"><span className="font-bold text-brand-500">2.</span> Go to <strong>Plugins → Add New → Upload Plugin</strong></li>
            <li className="flex gap-2"><span className="font-bold text-brand-500">3.</span> Activate it and copy the generated token</li>
          </ol>
          <a
            href="/api/plugin-download"
            download="wp-dash-bridge.zip"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download wp-dash-bridge.zip
          </a>
          <button
            onClick={() => setStep(3)}
            className="text-sm text-brand-500 hover:text-brand-600 underline"
          >
            I&apos;ve installed the plugin →
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-6 max-w-md w-full">
          <div className="w-20 h-20 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-4xl">
            🔗
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">Connect Your Site</h2>
          <form onSubmit={handleConnect} className="w-full space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site Name</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="My WordPress Site"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site URL</label>
              <input
                type="url"
                required
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://mysite.com"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {submitting ? "Connecting…" : "Connect Site"}
            </button>
          </form>
          <button onClick={() => setStep(2)} className="text-xs text-gray-400 hover:text-gray-600">
            ← Back
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          {/* CSS confetti */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <span className="text-6xl animate-bounce">🎉</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">You&apos;re all set!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Your site is now connected and being monitored.
          </p>
          <a
            href="/"
            className="mt-2 px-8 py-3 rounded-xl bg-brand-500 text-white font-semibold text-base hover:bg-brand-600 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      )}
    </div>
  );
}
