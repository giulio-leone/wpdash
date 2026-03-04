/**
 * TypeScript types for WP Dash Bridge REST API responses.
 *
 * These mirror the JSON payloads returned by the WordPress bridge plugin
 * and are intentionally separate from domain entities — mapping happens
 * at the use-case / repository layer.
 */

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface BridgeActiveTheme {
  name: string;
  version: string;
}

export interface BridgePluginCount {
  active: number;
  inactive: number;
  total: number;
}

export interface BridgeHealthResponse {
  wp_version: string;
  php_version: string;
  db_version: string;
  db_latency_ms: number;
  active_theme: BridgeActiveTheme;
  is_multisite: boolean;
  site_url: string;
  home_url: string;
  timezone: string;
  memory_limit: string;
  max_upload_size: string;
  wp_debug: boolean;
  ssl_enabled: boolean;
  permalink_structure: string;
  plugin_count: BridgePluginCount;
  checked_at: string;
}

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

export interface BridgePluginInfo {
  name: string;
  slug: string;
  file: string;
  version: string;
  is_active: boolean;
  has_update: boolean;
  update_version: string | null;
  author: string;
  description: string;
}

export type BridgePluginAction = "activate" | "deactivate" | "update" | "delete";

export type BridgePluginInstallSource = "url" | "slug";

export interface BridgePluginManageRequest {
  action: BridgePluginAction;
  plugin: string;
}

export interface BridgePluginInstallRequest {
  source: BridgePluginInstallSource;
  value: string;
}

export interface BridgePluginActionResponse {
  message: string;
  plugin?: string;
  source?: string;
  value?: string;
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

export type BridgeFindingSeverity = "critical" | "warning" | "info";

export interface BridgeSecurityFinding {
  type: string;
  severity: BridgeFindingSeverity;
  message: string;
  file: string | null;
}

export interface BridgeSecurityResponse {
  wp_version: string;
  findings: BridgeSecurityFinding[];
  total_checked: number;
  checked_at: string;
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export interface BridgeHeadingDetail {
  count: number;
  content: string[];
}

export interface BridgeHeadings {
  h1: BridgeHeadingDetail;
  h2: BridgeHeadingDetail;
  h3: BridgeHeadingDetail;
  h4: BridgeHeadingDetail;
  h5: BridgeHeadingDetail;
  h6: BridgeHeadingDetail;
}

export interface BridgeSeoAuditRequest {
  url: string;
}

export interface BridgeSeoAuditResponse {
  url: string;
  status_code: number;
  title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  headings: BridgeHeadings;
  images_without_alt: number;
  canonical: string | null;
  robots: string | null;
  og_title: string | null;
  og_description: string | null;
  audited_at: string;
}

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export type BridgeLogLevel = "error" | "warning" | "notice" | "deprecated";

export interface BridgeLogEntry {
  timestamp: string;
  level: BridgeLogLevel;
  type: string;
  message: string;
  file: string | null;
  line: number | null;
}

export interface BridgeLogsResponse {
  entries: BridgeLogEntry[];
  log_file: string | null;
  total: number;
  queried_at: string;
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

export interface BridgeBackupStatusResponse {
  backup_plugin: string | null;
  last_backup_at: string | null;
  archive_size_bytes: number | null;
  backup_count: number;
  checked_at: string;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export interface BridgeErrorResponse {
  code: string;
  message: string;
  data?: { status: number; retry_after?: number };
}
