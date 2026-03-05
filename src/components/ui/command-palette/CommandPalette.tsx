"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSites } from "@/application/site/site-actions";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: string;
  action: () => void;
};

type SiteEntry = { id: string; name: string; url: string };

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [paletteSites, setPaletteItems] = useState<SiteEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch sites on mount
  useEffect(() => {
    getSites().then((result) => {
      if (result.success) {
        setPaletteItems(
          result.data.map((s) => ({ id: s.id, name: s.name, url: s.url })),
        );
      }
    });
  }, []);

  // Register Cmd+K / Ctrl+K and custom event
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const customHandler = () => {
      setOpen(true);
      setQuery("");
      setSelectedIndex(0);
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("open-command-palette", customHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("open-command-palette", customHandler);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const execute = useCallback(
    (item: CommandItem) => {
      item.action();
      close();
    },
    [close],
  );

  const quickActions: CommandItem[] = [
    {
      id: "add-site",
      label: "Add new site",
      description: "Connect a WordPress site",
      icon: "➕",
      category: "Actions",
      action: () => router.push("/sites?add=true"),
    },
    {
      id: "network-updates",
      label: "Network Updates",
      description: "View pending updates across all sites",
      icon: "🔄",
      category: "Actions",
      action: () => router.push("/updates"),
    },
    {
      id: "reports",
      label: "Reports",
      description: "View network health report",
      icon: "📊",
      category: "Actions",
      action: () => router.push("/reports"),
    },
    {
      id: "settings",
      label: "Alert Settings",
      description: "Configure notification preferences",
      icon: "⚙️",
      category: "Actions",
      action: () => router.push("/settings"),
    },
  ];

  const siteItems: CommandItem[] = paletteSites.flatMap((s) => [
    {
      id: `site-${s.id}`,
      label: s.name,
      description: s.url,
      icon: "🌐",
      category: "Sites",
      action: () => router.push(`/sites/${s.id}`),
    },
    {
      id: `site-plugins-${s.id}`,
      label: `Plugins — ${s.name}`,
      description: "Manage plugins for this site",
      icon: "🔌",
      category: "Sites",
      action: () => router.push(`/sites/${s.id}?tab=Plugins`),
    },
    {
      id: `site-security-${s.id}`,
      label: `Security — ${s.name}`,
      description: "Security audit for this site",
      icon: "🔒",
      category: "Sites",
      action: () => router.push(`/sites/${s.id}?tab=Security`),
    },
  ]);

  const allItems = [...quickActions, ...siteItems];

  const filtered = query
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : [...quickActions, ...siteItems.slice(0, 5)];

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category]!.push(item);
    return acc;
  }, {});

  const flatItems = Object.values(groups).flat();

  // Arrow key navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && flatItems[selectedIndex]) {
        e.preventDefault();
        execute(flatItems[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flatItems, selectedIndex, execute]);

  if (!open) return null;

  let itemCount = 0;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh]"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/[0.1] dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.08]">
          <svg
            className="h-4 w-4 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
              fill="currentColor"
            />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search sites, actions…"
            className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 dark:text-white"
          />
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400 dark:bg-white/10">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {flatItems.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No results for &quot;{query}&quot;
            </div>
          )}
          {Object.entries(groups).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {category}
              </div>
              {items.map((item) => {
                const idx = itemCount++;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="w-6 shrink-0 text-center text-lg">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="truncate text-xs text-gray-400">{item.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="shrink-0 text-xs text-blue-500">↵</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex gap-3 border-t border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-white/[0.06]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>ESC close</span>
        </div>
      </div>
    </div>
  );
}
