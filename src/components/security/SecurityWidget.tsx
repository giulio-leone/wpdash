"use client";

import React, { useEffect, useState, useTransition } from "react";
import Badge from "@/components/ui/badge/Badge";
import { getLatestSecurityStatus } from "@/application/security/security-actions";
import type { SecurityAudit, SecurityFinding } from "@/domain/security/entity";
import SecurityFindings from "./SecurityFindings";

interface SecurityWidgetProps {
  siteId: string;
}

const statusConfig: Record<
  SecurityAudit["status"],
  { label: string; color: "success" | "warning" | "error"; icon: string }
> = {
  clean: { label: "Secure", color: "success", icon: "✓" },
  warning: { label: "Warning", color: "warning", icon: "⚠" },
  critical: { label: "Critical", color: "error", icon: "✕" },
};

function countBySeverity(findings: SecurityFinding[]) {
  return {
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
  };
}

export default function SecurityWidget({ siteId }: SecurityWidgetProps) {
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  function loadAudit() {
    startTransition(async () => {
      const result = await getLatestSecurityStatus(siteId);
      if (result.success) {
        setAudit(result.data);
      }
    });
  }

  const config = audit
    ? statusConfig[audit.status]
    : { label: "No Audit", color: "light" as const, icon: "?" };
  const counts = audit ? countBySeverity(audit.findings) : null;

  return (
    <div className="space-y-6">
      {/* Status overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Security status */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Security Status</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <Badge size="sm" color={config.color}>
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Last audit */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Last Audit</p>
          <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {audit?.auditedAt
              ? new Date(audit.auditedAt).toLocaleString()
              : "Never"}
          </p>
        </div>

        {/* Core integrity */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Core Integrity</p>
          <p className="mt-2 text-sm font-semibold">
            {audit == null ? (
              <span className="text-gray-400">—</span>
            ) : audit.coreIntegrityPassed ? (
              <span className="text-success-600 dark:text-success-400">Passed</span>
            ) : (
              <span className="text-error-600 dark:text-error-400">Failed</span>
            )}
          </p>
        </div>

        {/* Findings summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Findings</p>
          {counts ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {counts.critical > 0 && (
                <Badge size="sm" color="error">{counts.critical} critical</Badge>
              )}
              {counts.high > 0 && (
                <Badge size="sm" color="warning">{counts.high} high</Badge>
              )}
              {counts.medium > 0 && (
                <Badge size="sm" color="info">{counts.medium} medium</Badge>
              )}
              {counts.low > 0 && (
                <Badge size="sm" color="light">{counts.low} low</Badge>
              )}
              {audit && audit.findings.length === 0 && (
                <span className="text-sm text-success-600 dark:text-success-400">
                  No issues found
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-400">—</p>
          )}
        </div>
      </div>

      {/* Findings list */}
      {audit && audit.findings.length > 0 && (
        <SecurityFindings findings={audit.findings} />
      )}
    </div>
  );
}
