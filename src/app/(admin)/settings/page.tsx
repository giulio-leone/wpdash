"use client";
import { useEffect, useState } from "react";
import { getAlertSettings, updateAlertSettings, type AlertSettings } from "@/application/settings/settings-actions";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function AlertSettingsPage() {
  const [settings, setSettings] = useState<AlertSettings>({
    notifyOffline: true,
    notifyUpdates: true,
    notifyBackupStale: true,
    backupStaleDays: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getAlertSettings().then((res) => {
      if (res.success) setSettings(res.data);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await updateAlertSettings(settings);
    setSaving(false);
    setToast(res.success ? "Settings saved!" : "Failed to save settings.");
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-8 px-4">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Alert Settings</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 space-y-6">
        <Toggle
          checked={settings.notifyOffline}
          onChange={(v) => setSettings((s) => ({ ...s, notifyOffline: v }))}
          label="Site offline alerts"
          description="Notify when a site fails an uptime check"
        />
        <div className="border-t border-gray-100 dark:border-gray-800" />
        <Toggle
          checked={settings.notifyUpdates}
          onChange={(v) => setSettings((s) => ({ ...s, notifyUpdates: v }))}
          label="Update available alerts"
          description="Notify when WordPress, plugins, or themes have updates"
        />
        <div className="border-t border-gray-100 dark:border-gray-800" />
        <Toggle
          checked={settings.notifyBackupStale}
          onChange={(v) => setSettings((s) => ({ ...s, notifyBackupStale: v }))}
          label="Stale backup alerts"
          description="Notify when no recent backup is found"
        />
        <div className="border-t border-gray-100 dark:border-gray-800" />
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
            Backup stale after
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={settings.backupStaleDays}
            onChange={(e) =>
              setSettings((s) => ({ ...s, backupStaleDays: parseInt(e.target.value, 10) || 7 }))
            }
            className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-gray-900">
          {toast}
        </div>
      )}
    </div>
  );
}
