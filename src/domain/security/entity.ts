export type SecurityAuditStatus = "clean" | "warning" | "critical";

export type SecurityFindingSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityFinding {
  filePath: string;
  issue: string;
  severity: SecurityFindingSeverity;
}

export interface SecurityAudit {
  id: string;
  siteId: string;
  status: SecurityAuditStatus;
  coreIntegrityPassed: boolean;
  suspiciousFilesCount: number;
  findings: SecurityFinding[];
  auditedAt: Date;
}
