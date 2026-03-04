"use client";

import React, { useState } from "react";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/button/Button";
import { installPlugin } from "@/application/plugin/plugin-actions";

interface Props {
  siteId: string;
  onClose: () => void;
  onInstalled: () => void;
}

export default function PluginInstallModal({ siteId, onClose, onInstalled }: Props) {
  const [mode, setMode] = useState<"slug" | "url">("slug");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    setError(null);
    const result = await installPlugin(siteId, mode, value.trim());

    if (result.success) {
      setSuccess(true);
      setTimeout(onInstalled, 1500);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border bg-white p-6",
          "dark:border-gray-700 dark:bg-gray-900",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Install Plugin
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Mode selector */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("slug")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "slug"
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            WordPress.org Slug
          </button>
          <button
            onClick={() => setMode("url")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "url"
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
            )}
          >
            Paste URL
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {mode === "slug" ? "Plugin Slug" : "Plugin ZIP URL"}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "slug" ? "e.g. akismet" : "https://example.com/plugin.zip"}
            className={cn(
              "mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
              "dark:border-gray-700 dark:bg-gray-800 dark:text-white",
              "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
            )}
          />

          {error && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
              Plugin installed successfully!
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" disabled={loading || !value.trim()}>
              {loading ? "Installing…" : "Install"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
