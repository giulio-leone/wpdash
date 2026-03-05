import type {
  BridgeBackupStatusResponse,
  BridgeCoreUpdateResponse,
  BridgeContentAction,
  BridgeContentActionResponse,
  BridgeContentItem,
  BridgeDBCleanupAction,
  BridgeDBCleanupResponse,
  BridgeDBStatusResponse,
  BridgeErrorResponse,
  BridgeHealthResponse,
  BridgeLogLevel,
  BridgeLogsResponse,
  BridgePluginAction,
  BridgePluginActionResponse,
  BridgePluginInfo,
  BridgePluginInstallSource,
  BridgeSecurityResponse,
  BridgeSeoAuditResponse,
  BridgeThemeAction,
  BridgeThemeActionResponse,
  BridgeThemeInfo,
  BridgeUpdatesStatusResponse,
  BridgeUserAction,
  BridgeUserActionResponse,
  BridgeUserInfo,
  BridgeWooCustomer,
  BridgeWooOrder,
  BridgeWooOrderStatus,
  BridgeWooProduct,
  BridgeWooStats,
} from "./types";
import {
  WP_BRIDGE_TIMEOUT_MS,
  WP_BRIDGE_MAX_RETRIES,
  WP_BRIDGE_RETRY_DELAY_MS,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface WPBridgeClientOptions {
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
  /** Maximum retry attempts on transient failures. */
  maxRetries?: number;
  /** Base delay between retries in milliseconds. */
  retryDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<WPBridgeClientOptions> = {
  timeoutMs: WP_BRIDGE_TIMEOUT_MS,
  maxRetries: WP_BRIDGE_MAX_RETRIES,
  retryDelayMs: WP_BRIDGE_RETRY_DELAY_MS,
};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class WPBridgeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "WPBridgeError";
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class WPBridgeClient {
  private readonly options: Required<WPBridgeClientOptions>;

  constructor(options?: WPBridgeClientOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // ── Health ──────────────────────────────────────────────────────────────

  async getHealth(
    siteUrl: string,
    token: string,
  ): Promise<BridgeHealthResponse> {
    return this.get<BridgeHealthResponse>(siteUrl, token, "/health");
  }

  // ── Plugins ─────────────────────────────────────────────────────────────

  async getPlugins(
    siteUrl: string,
    token: string,
  ): Promise<BridgePluginInfo[]> {
    return this.get<BridgePluginInfo[]>(siteUrl, token, "/plugins");
  }

  async managePlugin(
    siteUrl: string,
    token: string,
    action: BridgePluginAction,
    plugin: string,
  ): Promise<BridgePluginActionResponse> {
    return this.post<BridgePluginActionResponse>(
      siteUrl,
      token,
      "/plugins/manage",
      { action, plugin },
    );
  }

  async installPlugin(
    siteUrl: string,
    token: string,
    source: BridgePluginInstallSource,
    value: string,
  ): Promise<BridgePluginActionResponse> {
    return this.post<BridgePluginActionResponse>(
      siteUrl,
      token,
      "/plugins/install",
      { source, value },
    );
  }

  // ── Security ────────────────────────────────────────────────────────────

  async getSecurityAudit(
    siteUrl: string,
    token: string,
  ): Promise<BridgeSecurityResponse> {
    return this.get<BridgeSecurityResponse>(
      siteUrl,
      token,
      "/security/integrity",
    );
  }

  // ── SEO ─────────────────────────────────────────────────────────────────

  async runSeoAudit(
    siteUrl: string,
    token: string,
    pageUrl: string,
  ): Promise<BridgeSeoAuditResponse> {
    return this.post<BridgeSeoAuditResponse>(siteUrl, token, "/seo/audit", {
      url: pageUrl,
    });
  }

  // ── Logs ────────────────────────────────────────────────────────────────

  async getLogs(
    siteUrl: string,
    token: string,
    lines?: number,
    level?: BridgeLogLevel | "all",
  ): Promise<BridgeLogsResponse> {
    const params = new URLSearchParams();
    if (lines !== undefined) params.set("lines", String(lines));
    if (level !== undefined) params.set("level", level);

    const query = params.toString();
    const path = query ? `/logs?${query}` : "/logs";
    return this.get<BridgeLogsResponse>(siteUrl, token, path);
  }

  // ── Backup ──────────────────────────────────────────────────────────────

  async getBackupStatus(
    siteUrl: string,
    token: string,
  ): Promise<BridgeBackupStatusResponse> {
    return this.get<BridgeBackupStatusResponse>(
      siteUrl,
      token,
      "/backup/status",
    );
  }

  // ── Themes ──────────────────────────────────────────────────────────────

  async getThemes(siteUrl: string, token: string): Promise<BridgeThemeInfo[]> {
    return this.get<BridgeThemeInfo[]>(siteUrl, token, "/themes");
  }

  async manageTheme(
    siteUrl: string,
    token: string,
    action: BridgeThemeAction,
    slug: string,
  ): Promise<BridgeThemeActionResponse> {
    return this.post<BridgeThemeActionResponse>(siteUrl, token, "/themes/manage", { action, slug });
  }

  async installTheme(
    siteUrl: string,
    token: string,
    slug: string,
  ): Promise<BridgeThemeActionResponse> {
    return this.post<BridgeThemeActionResponse>(siteUrl, token, "/themes/install", { slug });
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async getUsers(siteUrl: string, token: string, role?: string): Promise<BridgeUserInfo[]> {
    const path = role ? `/users?role=${encodeURIComponent(role)}` : "/users";
    return this.get<BridgeUserInfo[]>(siteUrl, token, path);
  }

  async manageUser(
    siteUrl: string,
    token: string,
    action: BridgeUserAction,
    params: Record<string, string | number>,
  ): Promise<BridgeUserActionResponse> {
    return this.post<BridgeUserActionResponse>(siteUrl, token, "/users/manage", { action, ...params });
  }

  // ── Content ──────────────────────────────────────────────────────────────

  async getContent(
    siteUrl: string,
    token: string,
    type?: "all" | "posts" | "pages",
  ): Promise<BridgeContentItem[]> {
    const path = type && type !== "all" ? `/content?type=${type}` : "/content";
    return this.get<BridgeContentItem[]>(siteUrl, token, path);
  }

  async manageContent(
    siteUrl: string,
    token: string,
    action: BridgeContentAction,
    postId: number,
  ): Promise<BridgeContentActionResponse> {
    return this.post<BridgeContentActionResponse>(siteUrl, token, "/content/manage", { action, post_id: postId });
  }

  // ── WooCommerce ──────────────────────────────────────────────────────────

  async getWooStats(siteUrl: string, token: string): Promise<BridgeWooStats> {
    return this.get<BridgeWooStats>(siteUrl, token, "/woocommerce/stats");
  }

  async getWooOrders(siteUrl: string, token: string, limit = 20): Promise<BridgeWooOrder[]> {
    return this.get<BridgeWooOrder[]>(siteUrl, token, `/woocommerce/orders?limit=${limit}`);
  }

  async updateWooOrderStatus(
    siteUrl: string,
    token: string,
    orderId: number,
    status: BridgeWooOrderStatus,
  ): Promise<{ message: string; order_id: number; status: string }> {
    return this.post(siteUrl, token, "/woocommerce/orders/manage", { order_id: orderId, status });
  }

  async getWooProducts(siteUrl: string, token: string, limit = 30): Promise<BridgeWooProduct[]> {
    return this.get<BridgeWooProduct[]>(siteUrl, token, `/woocommerce/products?limit=${limit}`);
  }

  async getWooCustomers(siteUrl: string, token: string, limit = 20): Promise<BridgeWooCustomer[]> {
    return this.get<BridgeWooCustomer[]>(siteUrl, token, `/woocommerce/customers?limit=${limit}`);
  }

  // ── Database ─────────────────────────────────────────────────────────────

  async getDBStatus(siteUrl: string, token: string): Promise<BridgeDBStatusResponse> {
    return this.get<BridgeDBStatusResponse>(siteUrl, token, "/database/status");
  }

  async optimizeDB(siteUrl: string, token: string): Promise<{ message: string; tables_optimized: number; tables_failed: number }> {
    return this.post(siteUrl, token, "/database/optimize", {});
  }

  async cleanupDB(
    siteUrl: string,
    token: string,
    action: BridgeDBCleanupAction,
  ): Promise<BridgeDBCleanupResponse> {
    return this.post<BridgeDBCleanupResponse>(siteUrl, token, "/database/cleanup", { action });
  }

  // ── Updates ──────────────────────────────────────────────────────────────

  async getUpdatesStatus(siteUrl: string, token: string): Promise<BridgeUpdatesStatusResponse> {
    return this.get<BridgeUpdatesStatusResponse>(siteUrl, token, "/updates");
  }

  async applyWPCoreUpdate(siteUrl: string, token: string): Promise<BridgeCoreUpdateResponse> {
    return this.post<BridgeCoreUpdateResponse>(siteUrl, token, "/updates/core", {});
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  private buildUrl(siteUrl: string, path: string): string {
    const base = siteUrl.replace(/\/+$/, "");
    // Support both /wp-json/ (pretty permalinks) and ?rest_route= (plain permalinks)
    return `${base}/wp-json/wpdash/v1${path}`;
  }

  private buildFallbackUrl(siteUrl: string, path: string): string {
    const base = siteUrl.replace(/\/+$/, "");
    const restPath = `/wpdash/v1${path}`;
    // Split path and query string if any
    const parts = restPath.split("?");
    const basePath = parts[0] ?? restPath;
    const queryString = parts[1] ?? "";
    const params = new URLSearchParams(queryString);
    params.set("rest_route", basePath);
    return `${base}/?${params.toString()}`;
  }

  private async request<T>(
    url: string,
    token: string,
    init: RequestInit,
    fallbackUrl?: string,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          this.options.timeoutMs,
        );

        const response = await fetch(url, {
          ...init,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            ...init.headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Check if response is JSON — WordPress without pretty permalinks
        // returns 200 with HTML for /wp-json/* paths instead of 404
        const contentType = response.headers.get("content-type") ?? "";
        const isJson = contentType.includes("application/json");

        if (!response.ok) {
          const body = isJson
            ? ((await response
                .json()
                .catch(() => null)) as BridgeErrorResponse | null)
            : null;

          // On 404 or non-JSON 200, try fallback URL format (?rest_route=)
          if ((response.status === 404 || !isJson) && fallbackUrl && attempt === 0) {
            return this.request<T>(fallbackUrl, token, init);
          }

          const error = new WPBridgeError(
            body?.message ?? `HTTP ${response.status}`,
            response.status,
            body?.code ?? "unknown",
            body?.data?.retry_after,
          );

          // Retry on 429 / 5xx
          if (
            (response.status === 429 || response.status >= 500) &&
            attempt < this.options.maxRetries
          ) {
            const delay =
              error.retryAfter !== undefined
                ? error.retryAfter * 1_000
                : this.options.retryDelayMs * 2 ** attempt;
            await this.sleep(delay);
            lastError = error;
            continue;
          }

          throw error;
        }

        // Response is ok but not JSON — fallback to ?rest_route= format
        if (!isJson && fallbackUrl && attempt === 0) {
          return this.request<T>(fallbackUrl, token, init);
        }

        return (await response.json()) as T;
      } catch (err) {
        if (err instanceof WPBridgeError) throw err;

        // Retry on network / abort errors
        if (attempt < this.options.maxRetries) {
          await this.sleep(this.options.retryDelayMs * 2 ** attempt);
          lastError =
            err instanceof Error ? err : new Error(String(err));
          continue;
        }

        throw err instanceof Error
          ? err
          : new Error(String(err));
      }
    }

    throw lastError ?? new Error("Request failed after retries");
  }

  private async get<T>(
    siteUrl: string,
    token: string,
    path: string,
  ): Promise<T> {
    return this.request<T>(
      this.buildUrl(siteUrl, path),
      token,
      { method: "GET" },
      this.buildFallbackUrl(siteUrl, path),
    );
  }

  private async post<T>(
    siteUrl: string,
    token: string,
    path: string,
    body: unknown,
  ): Promise<T> {
    return this.request<T>(
      this.buildUrl(siteUrl, path),
      token,
      { method: "POST", body: JSON.stringify(body) },
      this.buildFallbackUrl(siteUrl, path),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
