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

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

export interface BridgeThemeInfo {
  slug: string;
  name: string;
  version: string;
  author: string;
  description: string;
  is_active: boolean;
  has_update: boolean;
  update_version: string | null;
  screenshot_url: string | null;
  tags: string[];
}

export type BridgeThemeAction = "activate" | "delete" | "update";

export interface BridgeThemeActionResponse {
  message: string;
  theme: string;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface BridgeUserInfo {
  id: number;
  login: string;
  email: string;
  display_name: string;
  roles: string[];
  registered_at: string;
  avatar_url: string | null;
  posts_count: number;
}

export type BridgeUserAction = "create" | "delete" | "change_role";

export interface BridgeUserActionResponse {
  message: string;
  user_id?: number;
  username?: string;
  email?: string;
  role?: string;
}

// ---------------------------------------------------------------------------
// Content (Posts & Pages)
// ---------------------------------------------------------------------------

export interface BridgeContentItem {
  id: number;
  title: string;
  type: "post" | "page";
  status: "publish" | "draft" | "pending" | "private" | "trash";
  slug: string;
  modified_at: string;
  published_at: string | null;
  author: string;
  url: string;
  comment_count: number;
}

export type BridgeContentAction = "publish" | "draft" | "private" | "trash" | "delete";

export interface BridgeContentActionResponse {
  message: string;
  post_id: number;
}

// ---------------------------------------------------------------------------
// WooCommerce
// ---------------------------------------------------------------------------

export interface BridgeWooStats {
  is_active: boolean;
  currency: string;
  currency_symbol: string;
  revenue_today: number;
  revenue_month: number;
  orders_pending: number;
  orders_processing: number;
  orders_completed: number;
  orders_cancelled: number;
  orders_on_hold: number;
  total_customers: number;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  checked_at: string;
}

export interface BridgeWooOrder {
  id: number;
  number: string;
  status: string;
  total: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  items_count: number;
  date: string;
  payment_method: string;
}

export type BridgeWooOrderStatus =
  | "pending" | "processing" | "on-hold"
  | "completed" | "cancelled" | "refunded" | "failed";

export interface BridgeWooProduct {
  id: number;
  name: string;
  sku: string;
  type: string;
  price: number;
  regular_price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  stock_status: "instock" | "outofstock" | "onbackorder";
  stock_quantity: number | null;
  manage_stock: boolean;
  status: string;
  total_sales: number;
  image_url: string | null;
}

export interface BridgeWooCustomer {
  id: number;
  display_name: string;
  email: string;
  registered_at: string;
  orders_count: number;
  total_spent: number;
  avatar_url: string | null;
  city: string;
  country: string;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export interface BridgeDBTable {
  name: string;
  rows: number;
  data_size_mb: number;
  index_size_mb: number;
  total_size_mb: number;
  engine: string;
  collation: string;
  auto_increment: number | null;
}

export interface BridgeDBPendingCleanup {
  transients: number;
  spam_comments: number;
  revisions: number;
  auto_drafts: number;
  total: number;
}

export interface BridgeDBStatusResponse {
  tables: BridgeDBTable[];
  total_tables: number;
  total_size_mb: number;
  db_version: string;
  charset: string;
  pending_cleanup: BridgeDBPendingCleanup;
  checked_at: string;
}

export interface BridgeDBCleanupResponse {
  message: string;
  rows_deleted: number;
}

export type BridgeDBCleanupAction =
  | "clean_transients" | "clean_spam_comments"
  | "clean_post_revisions" | "clean_auto_drafts" | "clean_all";

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

export interface BridgeWPCoreUpdate {
  available: boolean;
  version: string | null;
  current: string;
}

export interface BridgeThemeUpdate {
  slug: string;
  name: string;
  current_version: string;
  new_version: string | null;
}

export interface BridgeUpdatesStatusResponse {
  wp_core: BridgeWPCoreUpdate;
  theme_updates: BridgeThemeUpdate[];
  theme_updates_count: number;
  plugin_updates_count: number;
  checked_at: string;
}

export interface BridgeCoreUpdateResponse {
  message: string;
  updated: boolean;
  new_version?: string;
}

