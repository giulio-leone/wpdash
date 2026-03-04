"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { createSite } from "@/application/site/site-actions";

interface AddSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteAdded: () => void;
}

export default function AddSiteModal({ isOpen, onClose, onSiteAdded }: AddSiteModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createSite(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setToken(result.data.token);
    onSiteAdded();
  }

  function handleCopy() {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setError(null);
    setToken(null);
    setCopied(false);
    formRef.current?.reset();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg p-6 sm:p-8">
      {token ? (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Site Created!
          </h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Copy this token now. It won&apos;t be shown again.
          </p>
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
            <code className="flex-1 overflow-x-auto text-xs break-all text-gray-800 dark:text-gray-200">
              {token}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-xs text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
            ⚠️ Save this token securely. You will need it to connect your WordPress plugin.
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
            Add New Site
          </h2>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="site-name"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Site Name
              </label>
              <input
                id="site-name"
                name="name"
                type="text"
                required
                placeholder="My WordPress Site"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
              />
            </div>
            <div>
              <label
                htmlFor="site-url"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Site URL
              </label>
              <input
                id="site-url"
                name="url"
                type="url"
                required
                placeholder="https://example.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500"
              />
            </div>
            {error && (
              <p className="text-sm text-error-500">{error}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button disabled={loading}>
                {loading ? "Adding..." : "Add Site"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
