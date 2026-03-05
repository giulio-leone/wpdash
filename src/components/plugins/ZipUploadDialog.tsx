"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/button/Button";
import { installPluginFromZip } from "@/application/plugin/plugin-actions";

interface Props {
  siteId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ZipUploadDialog({ siteId, onClose, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".zip")) {
      setError("Only .zip files are supported");
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleInstall = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const result = await installPluginFromZip(siteId, fd);
    setLoading(false);
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error ?? "Installation failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border bg-white p-6 shadow-xl",
          "dark:border-gray-800 dark:bg-gray-900",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Install Plugin from ZIP
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Drop zone */}
        <div
          data-testid="zip-dropzone"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors",
            dragging
              ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
              : "border-gray-300 hover:border-brand-400 dark:border-gray-700",
          )}
        >
          <span className="mb-2 text-3xl">📦</span>
          {file ? (
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">Drop your .zip file here</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">or click to browse</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleInstall}
            disabled={!file || loading}
            className="flex-1"
          >
            {loading ? "Installing…" : "Install Plugin"}
          </Button>
        </div>
      </div>
    </div>
  );
}
