"use client";
import React, { useState, useEffect, useRef } from "react";
import { getNotifications, markAllRead } from "@/application/notifications/notification-actions";
import { toast } from "@/hooks/useToast";
import { CloseLineIcon, BoltIcon, AlertIcon, InfoIcon } from "@/icons";

type Notification = {
  id: string;
  type: string;
  siteName: string | null;
  message: string;
  read: boolean;
  createdAt: Date;
};

const typeIcon = (type: string): React.ReactNode => {
  if (type === "site_offline") return <CloseLineIcon className="w-4 h-4 text-error-500" />;
  if (type === "update_available") return <BoltIcon className="w-4 h-4 text-brand-500" />;
  if (type === "backup_stale") return <AlertIcon className="w-4 h-4 text-warning-500" />;
  return <InfoIcon className="w-4 h-4 text-gray-400" />;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter(n => !n.read).length;

  async function load() {
    const r = await getNotifications();
    if (r.success) setItems(r.data as Notification[]);
  }

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleMarkAllRead() {
    await markAllRead();
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-gray-900 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
            <span className="text-sm font-semibold text-gray-800 dark:text-white">Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-blue-500 hover:text-blue-600">Mark all read</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-white/[0.05]">
            {items.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No notifications</div>
            ) : items.map(n => (
              <div key={n.id} className={`flex gap-3 px-4 py-3 transition-colors ${!n.read ? "bg-blue-50/60 dark:bg-blue-900/10" : ""}`}>
                <span className="mt-0.5 shrink-0 flex items-center">{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  {n.siteName && <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{n.siteName}</p>}
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">{n.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
