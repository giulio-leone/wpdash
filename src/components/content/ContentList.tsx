"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { fetchContent, manageContent } from "@/application/content/content-actions";
import type { BridgeContentItem } from "@/infrastructure/wp-bridge/types";

interface Props {
  siteId: string;
}

type ContentTab = "posts" | "pages";

const STATUS_COLORS: Record<
  BridgeContentItem["status"],
  "success" | "warning" | "error" | "info" | "dark"
> = {
  publish: "success",
  draft: "warning",
  pending: "dark",
  private: "info",
  trash: "error",
};

export default function ContentList({ siteId }: Props) {
  const [tab, setTab] = useState<ContentTab>("posts");
  const [items, setItems] = useState<BridgeContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async (type: ContentTab) => {
    setLoading(true);
    setError(null);
    const result = await fetchContent(siteId, type);
    if (result.success) {
      setItems(result.data);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(tab);
  }, [load, tab]);

  const handleAction = useCallback(
    async (
      action: "publish" | "draft" | "private" | "trash" | "delete",
      postId: number,
      confirmMsg?: string,
    ) => {
      if (confirmMsg && !window.confirm(confirmMsg)) return;
      setActionLoading(postId);
      const result = await manageContent(siteId, action, postId);
      if (!result.success) setError(result.error);
      setActionLoading(null);
      await load(tab);
    },
    [siteId, tab, load],
  );

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["posts", "pages"] as ContentTab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
          No {tab} found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Title</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Type</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Author</th>
                <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Modified</th>
                <th className="pb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 pr-4">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {item.title || "(no title)"}
                    </a>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge size="sm" color={STATUS_COLORS[item.status]}>
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 capitalize text-gray-600 dark:text-gray-300">
                    {item.type}
                  </td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{item.author}</td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                    {new Date(item.modified_at).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {/* Publish / Draft toggle */}
                      {item.status === "publish" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === item.id}
                          onClick={() => void handleAction("draft", item.id)}
                        >
                          Draft
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === item.id || item.status === "trash"}
                          onClick={() => void handleAction("publish", item.id)}
                        >
                          Publish
                        </Button>
                      )}
                      {/* Trash */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === item.id || item.status === "trash"}
                        onClick={() =>
                          void handleAction(
                            "trash",
                            item.id,
                            `Move "${item.title}" to trash?`,
                          )
                        }
                      >
                        Trash
                      </Button>
                      {/* Delete permanently */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoading === item.id}
                        onClick={() =>
                          void handleAction(
                            "delete",
                            item.id,
                            `Permanently delete "${item.title}"? This cannot be undone.`,
                          )
                        }
                      >
                        {actionLoading === item.id ? (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            Working…
                          </span>
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
