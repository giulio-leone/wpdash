"use client";

import { useEffect, useState, useCallback } from "react";
import { toast as toastEmitter, type ToastEvent } from "@/hooks/useToast";
import { cn } from "@/lib/cn";

const icons: Record<ToastEvent["type"], string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

const styles: Record<ToastEvent["type"], string> = {
  success:
    "border-success-200 bg-success-50 text-success-800 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300",
  error:
    "border-error-200 bg-error-50 text-error-800 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300",
  warning:
    "border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300",
  info: "border-blue-light-200 bg-blue-light-50 text-blue-light-800 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-blue-light-300",
};

const iconStyles: Record<ToastEvent["type"], string> = {
  success: "bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400",
  error: "bg-error-100 text-error-600 dark:bg-error-500/20 dark:text-error-400",
  warning: "bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400",
  info: "bg-blue-light-100 text-blue-light-600 dark:bg-blue-light-500/20 dark:text-blue-light-400",
};

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastEvent & { visible: boolean };
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg",
        "transition-all duration-300 ease-out",
        item.visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0",
        styles[item.type],
      )}
      role="alert"
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          iconStyles[item.type],
        )}
      >
        {icons[item.type]}
      </span>
      <p className="flex-1 text-sm font-medium leading-relaxed">{item.message}</p>
      <button
        onClick={() => onDismiss(item.id)}
        className="ml-1 mt-0.5 shrink-0 text-current opacity-50 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 1l12 12M13 1L1 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [items, setItems] = useState<(ToastEvent & { visible: boolean })[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t)),
    );
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 350);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<ToastEvent>;
      const item = { ...ev.detail, visible: false };
      setItems((prev) => [...prev.slice(-4), item]);
      // Trigger enter animation
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setItems((prev) =>
            prev.map((t) => (t.id === item.id ? { ...t, visible: true } : t)),
          ),
        ),
      );
      // Auto dismiss
      setTimeout(() => dismiss(item.id), item.duration);
    };
    toastEmitter.addEventListener("toast", handler);
    return () => toastEmitter.removeEventListener("toast", handler);
  }, [dismiss]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[99999] flex flex-col gap-2 sm:right-6 sm:bottom-6">
      {items.map((item) => (
        <div key={item.id} className="pointer-events-auto w-full max-w-sm">
          <ToastItem item={item} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
