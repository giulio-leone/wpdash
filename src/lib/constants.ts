// ---------------------------------------------------------------------------
// Uptime
// ---------------------------------------------------------------------------
export const UPTIME_CHECK_TIMEOUT_MS = Number(
  process.env.UPTIME_CHECK_TIMEOUT_MS ?? 15_000,
);
export const UPTIME_RETENTION_DAYS = Number(
  process.env.UPTIME_RETENTION_DAYS ?? 7,
);

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------
export const BACKUP_STALE_THRESHOLD_DAYS = Number(
  process.env.BACKUP_STALE_THRESHOLD_DAYS ?? 7,
);

// ---------------------------------------------------------------------------
// Bridge
// ---------------------------------------------------------------------------
export const WP_BRIDGE_TIMEOUT_MS = Number(
  process.env.WP_BRIDGE_TIMEOUT_MS ?? 15_000,
);
export const WP_BRIDGE_MAX_RETRIES = Number(
  process.env.WP_BRIDGE_MAX_RETRIES ?? 2,
);
export const WP_BRIDGE_RETRY_DELAY_MS = Number(
  process.env.WP_BRIDGE_RETRY_DELAY_MS ?? 1_000,
);

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------
export const LOGS_DEFAULT_LINES = 100;
export const LOGS_MAX_LINES = 1_000;

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------
export const SEO_TITLE_MIN_LENGTH = 30;
export const SEO_TITLE_MAX_LENGTH = 60;
export const SEO_META_DESC_MIN_LENGTH = 120;
export const SEO_META_DESC_MAX_LENGTH = 160;

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
export const API_RATE_LIMIT_PER_MINUTE = Number(
  process.env.API_RATE_LIMIT_PER_MINUTE ?? 60,
);

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
