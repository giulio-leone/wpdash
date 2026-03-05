"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import Badge from "@/components/ui/badge/Badge";
import { getLatestSeoStatus, getSeoAuditHistory } from "@/application/seo/seo-actions";
import {
  SEO_TITLE_MIN_LENGTH,
  SEO_TITLE_MAX_LENGTH,
  SEO_META_DESC_MIN_LENGTH,
  SEO_META_DESC_MAX_LENGTH,
} from "@/lib/constants";
import type { SeoAudit } from "@/domain/seo/entity";

interface Props {
  siteId: string;
  refreshKey?: number;
}

interface Recommendation {
  label: string;
  severity: "success" | "warning" | "error";
  message: string;
}

function buildRecommendations(audit: SeoAudit): Recommendation[] {
  const recs: Recommendation[] = [];

  // Title
  if (!audit.title) {
    recs.push({ label: "Title", severity: "error", message: "Missing page title. Add a <title> tag." });
  } else if (audit.title.length < SEO_TITLE_MIN_LENGTH) {
    recs.push({ label: "Title", severity: "warning", message: `Title is too short (${audit.title.length} chars). Aim for ${SEO_TITLE_MIN_LENGTH}–${SEO_TITLE_MAX_LENGTH} characters.` });
  } else if (audit.title.length > SEO_TITLE_MAX_LENGTH) {
    recs.push({ label: "Title", severity: "warning", message: `Title is too long (${audit.title.length} chars). Keep under ${SEO_TITLE_MAX_LENGTH} characters.` });
  } else {
    recs.push({ label: "Title", severity: "success", message: `Good title length (${audit.title.length} chars).` });
  }

  // Meta description
  if (!audit.metaDescription) {
    recs.push({ label: "Meta Description", severity: "error", message: "Missing meta description. Add a <meta name=\"description\"> tag." });
  } else if (audit.metaDescription.length < SEO_META_DESC_MIN_LENGTH) {
    recs.push({ label: "Meta Description", severity: "warning", message: `Description is too short (${audit.metaDescription.length} chars). Aim for ${SEO_META_DESC_MIN_LENGTH}–${SEO_META_DESC_MAX_LENGTH} characters.` });
  } else if (audit.metaDescription.length > SEO_META_DESC_MAX_LENGTH) {
    recs.push({ label: "Meta Description", severity: "warning", message: `Description is too long (${audit.metaDescription.length} chars). Keep under ${SEO_META_DESC_MAX_LENGTH} characters.` });
  } else {
    recs.push({ label: "Meta Description", severity: "success", message: `Good description length (${audit.metaDescription.length} chars).` });
  }

  // H1
  const h1Count = audit.headersStructure.h1.length;
  if (h1Count === 0) {
    recs.push({ label: "H1", severity: "error", message: "No H1 heading found. Add exactly one H1 per page." });
  } else if (h1Count > 1) {
    recs.push({ label: "H1", severity: "warning", message: `Multiple H1 headings found (${h1Count}). Use only one H1 per page.` });
  } else {
    recs.push({ label: "H1", severity: "success", message: "Single H1 heading — good." });
  }

  // H2
  if (audit.headersStructure.h2.length === 0) {
    recs.push({ label: "H2", severity: "warning", message: "No H2 headings found. Use H2 tags to structure your content." });
  }

  return recs;
}

export default function SeoDetails({ siteId, refreshKey }: Props) {
  const [audit, setAudit] = useState<SeoAudit | null>(null);
  const [history, setHistory] = useState<SeoAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const [latestRes, historyRes] = await Promise.all([
        getLatestSeoStatus(siteId),
        getSeoAuditHistory(siteId),
      ]);
      if (latestRes.success) setAudit(latestRes.data);
      if (historyRes.success) setHistory(historyRes.data);
      setLoading(false);
    }
    void fetch();
  }, [siteId, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!audit) return null;

  const recommendations = buildRecommendations(audit);

  return (
    <div className="space-y-6">
      {/* Title analysis */}
      <Section title="Title">
        {audit.title ? (
          <>
            <p className="text-sm text-gray-900 dark:text-white">{audit.title}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Length: {audit.title.length} characters
              {audit.title.length >= SEO_TITLE_MIN_LENGTH && audit.title.length <= SEO_TITLE_MAX_LENGTH
                ? " ✓ Good"
                : ` — Recommended: ${SEO_TITLE_MIN_LENGTH}–${SEO_TITLE_MAX_LENGTH} characters`}
            </p>
          </>
        ) : (
          <p className="text-sm text-error-600 dark:text-error-400">No title found.</p>
        )}
      </Section>

      {/* Meta Description */}
      <Section title="Meta Description">
        {audit.metaDescription ? (
          <>
            <p className="text-sm text-gray-900 dark:text-white">{audit.metaDescription}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Length: {audit.metaDescription.length} characters
              {audit.metaDescription.length >= SEO_META_DESC_MIN_LENGTH && audit.metaDescription.length <= SEO_META_DESC_MAX_LENGTH
                ? " ✓ Good"
                : ` — Recommended: ${SEO_META_DESC_MIN_LENGTH}–${SEO_META_DESC_MAX_LENGTH} characters`}
            </p>
          </>
        ) : (
          <p className="text-sm text-error-600 dark:text-error-400">No meta description found.</p>
        )}
      </Section>

      {/* Header Structure */}
      <Section title="Header Structure">
        <div className="space-y-3">
          {(["h1", "h2", "h3"] as const).map((tag) => {
            const items = audit.headersStructure[tag];
            return (
              <div key={tag}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    {tag}
                  </span>
                  <Badge size="sm" color={items.length > 0 ? "info" : "light"}>
                    {items.length}
                  </Badge>
                </div>
                {items.length > 0 && (
                  <ul className="mt-1 space-y-0.5 pl-4">
                    {items.map((text, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                        {text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Keywords */}
      {audit.metaKeywords && (
        <Section title="Meta Keywords">
          <div className="flex flex-wrap gap-2">
            {audit.metaKeywords.split(",").map((kw, i) => (
              <span
                key={i}
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                )}
              >
                {kw.trim()}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Recommendations */}
      <Section title="Recommendations">
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
            >
              <Badge size="sm" color={rec.severity}>
                {rec.label}
              </Badge>
              <p className="text-sm text-gray-700 dark:text-gray-300">{rec.message}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* History */}
      {history.length > 1 && (
        <Section title="Audit History">
          <div className="space-y-2">
            {history.slice(0, 10).map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-800"
              >
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{h.pageUrl}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(h.auditedAt).toLocaleString()}
                  </p>
                </div>
                <Badge size="sm" color={h.score >= 80 ? "success" : h.score >= 50 ? "warning" : "error"}>
                  {h.score}/100
                </Badge>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">{title}</h4>
      {children}
    </div>
  );
}
