import type { LogLevel } from "@/domain/log/entity";
import type { SecurityAuditStatus, SecurityFindingSeverity } from "@/domain/security/entity";
import type { BackupStatus } from "@/domain/backup/entity";

export interface WpBridgeHealthData {
  wpVersion: string;
  phpVersion: string;
  dbLatencyMs: number;
  isReachable: boolean;
  status: "healthy" | "degraded" | "critical";
}

export interface WpBridgePluginData {
  slug: string;
  name: string;
  version: string;
  isActive: boolean;
  hasUpdate: boolean;
  latestVersion: string | null;
}

export type PluginAction =
  | { type: "activate"; slug: string }
  | { type: "deactivate"; slug: string }
  | { type: "update"; slug: string };

export interface WpBridgeSecurityFinding {
  filePath: string;
  issue: string;
  severity: SecurityFindingSeverity;
}

export interface WpBridgeSecurityData {
  status: SecurityAuditStatus;
  coreIntegrityPassed: boolean;
  suspiciousFilesCount: number;
  findings: WpBridgeSecurityFinding[];
}

export interface WpBridgeSeoData {
  pageUrl: string;
  title: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  headersStructure: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  score: number;
}

export interface WpBridgeLogEntry {
  level: LogLevel;
  message: string;
  source: string | null;
  loggedAt: Date;
}

export interface WpBridgeBackupData {
  lastBackupAt: Date | null;
  archiveSizeBytes: number | null;
  status: BackupStatus;
}

export interface WpBridgeService {
  checkHealth(siteUrl: string, token: string): Promise<WpBridgeHealthData>;
  getPlugins(siteUrl: string, token: string): Promise<WpBridgePluginData[]>;
  managePlugin(siteUrl: string, token: string, action: PluginAction): Promise<boolean>;
  runSecurityAudit(siteUrl: string, token: string): Promise<WpBridgeSecurityData>;
  getSeoData(siteUrl: string, token: string, pageUrl: string): Promise<WpBridgeSeoData>;
  getLogs(siteUrl: string, token: string, limit: number): Promise<WpBridgeLogEntry[]>;
  getBackupStatus(siteUrl: string, token: string): Promise<WpBridgeBackupData>;
}
