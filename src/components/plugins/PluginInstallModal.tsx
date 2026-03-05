"use client";

import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/button/Button";
import { usePluginsStore } from "@/stores/plugins-store";

interface WpPlugin {
  slug: string;
  name: string;
  version: string;
  author: string;
  rating: number;
  shortDescription: string;
  icon: string | null;
}

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

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<WpPlugin[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false); // prevents dropdown re-opening after selection

  const installPluginAction = usePluginsStore((s) => s.installPlugin);

  useEffect(() => {
    if (mode !== "slug" || value.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Skip debounce fetch if a suggestion was just selected
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(`/api/wp-org/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setSuggestions(data.plugins ?? []);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, mode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    setLoading(true);
    setError(null);
    setShowDropdown(false);

    try {
      await installPluginAction(siteId, mode, value.trim());
      setSuccess(true);
      setTimeout(onInstalled, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Installation failed");
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (plugin: WpPlugin) => {
    justSelectedRef.current = true;
    setValue(plugin.slug);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border bg-white p-6",
          "dark:border-gray-800 dark:bg-gray-900",
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
            onClick={() => { setMode("slug"); setValue(""); setSuggestions([]); }}
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
            onClick={() => { setMode("url"); setValue(""); setSuggestions([]); setShowDropdown(false); }}
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
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {mode === "slug" ? "Plugin Slug or Name" : "Plugin ZIP URL"}
          </label>

          <div ref={dropdownRef} className="relative mb-4">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              placeholder={mode === "slug" ? "e.g. akismet or Contact Form 7" : "https://example.com/plugin.zip"}
              className={cn(
                "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
                "dark:border-gray-800 dark:bg-gray-900 dark:text-white",
                "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
              )}
              autoComplete="off"
            />
            {mode === "slug" && suggestLoading && (
              <div className="absolute right-2 top-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            )}

            {/* Autocomplete dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className={cn(
                "absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border",
                "bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900",
                "max-h-64 overflow-y-auto",
              )}>
                {suggestions.map((plugin) => (
                  <button
                    key={plugin.slug}
                    type="button"
                    onClick={() => selectSuggestion(plugin)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                      "hover:bg-gray-50 dark:hover:bg-gray-800",
                    )}
                  >
                    {plugin.icon && (
                      <Image
                        src={plugin.icon}
                        alt=""
                        width={32}
                        height={32}
                        className="mt-0.5 h-8 w-8 flex-shrink-0 rounded"
                        unoptimized
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {plugin.name}
                        </span>
                        <span className="text-xs text-gray-400">{plugin.version}</span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {plugin.slug} · {plugin.author}
                      </div>
                    </div>
                    {plugin.rating > 0 && (
                      <div className="flex-shrink-0 text-xs text-yellow-500">
                        ★ {(plugin.rating / 20).toFixed(1)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading || !value.trim()}>
              {loading ? "Installing…" : "Install"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

