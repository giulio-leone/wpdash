"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { fetchThemes, manageTheme } from "@/application/theme/theme-actions";
import type { BridgeThemeInfo } from "@/infrastructure/wp-bridge/types";

interface Props {
  siteId: string;
}

export default function ThemesList({ siteId }: Props) {
  const [themes, setThemes] = useState<BridgeThemeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchThemes(siteId);
    if (result.success) {
      setThemes(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const handleAction = useCallback(
    async (action: "activate" | "delete" | "update", slug: string) => {
      setActionLoading(slug);
      const result = await manageTheme(siteId, action, slug);
      if (!result.success) {
        setError(result.error);
      }
      setActionLoading(null);
      await load();
    },
    [siteId, load],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {themes.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No themes found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <div
              key={theme.slug}
              className={cn(
                "rounded-xl border bg-white p-4 shadow-sm",
                "dark:border-gray-800 dark:bg-gray-900",
                theme.is_active && "ring-2 ring-brand-500",
              )}
            >
              {/* Screenshot placeholder */}
              {theme.screenshot_url ? (
                <Image
                  src={theme.screenshot_url}
                  alt={theme.name}
                  width={300}
                  height={128}
                  className="mb-3 h-32 w-full rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <span className="text-xs text-gray-400">No preview</span>
                </div>
              )}

              {/* Header */}
              <div className="mb-2 flex flex-wrap items-start gap-2">
                <span className="flex-1 font-medium text-gray-900 dark:text-white">
                  {theme.name}
                </span>
                {theme.is_active && (
                  <Badge size="sm" color="success">Active</Badge>
                )}
                {theme.has_update && (
                  <Badge size="sm" color="warning">Update available</Badge>
                )}
              </div>

              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                v{theme.version} · {theme.author}
              </p>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={theme.is_active || actionLoading === theme.slug}
                  onClick={() => handleAction("activate", theme.slug)}
                >
                  {actionLoading === theme.slug ? (
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      Working…
                    </span>
                  ) : (
                    "Activate"
                  )}
                </Button>

                {theme.has_update && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={actionLoading === theme.slug}
                    onClick={() => handleAction("update", theme.slug)}
                  >
                    Update
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={theme.is_active || actionLoading === theme.slug}
                  onClick={() => {
                    if (window.confirm(`Delete theme "${theme.name}"? This action cannot be undone.`)) {
                      void handleAction("delete", theme.slug);
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
