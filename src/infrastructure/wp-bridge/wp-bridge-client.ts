import type {
  BridgeBackupStatusResponse,
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
} from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface WPBridgeClientOptions {
  /** Request timeout in milliseconds (default: 15 000). */
  timeoutMs?: number;
  /** Maximum retry attempts on transient failures (default: 2). */
  maxRetries?: number;
  /** Base delay between retries in milliseconds (default: 1 000). */
  retryDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<WPBridgeClientOptions> = {
  timeoutMs: 15_000,
  maxRetries: 2,
  retryDelayMs: 1_000,
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

  // ── Internal helpers ────────────────────────────────────────────────────

  private buildUrl(siteUrl: string, path: string): string {
    const base = siteUrl.replace(/\/+$/, "");
    return `${base}/wp-json/wpdash/v1${path}`;
  }

  private async request<T>(
    url: string,
    token: string,
    init: RequestInit,
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

        if (!response.ok) {
          const body = (await response
            .json()
            .catch(() => null)) as BridgeErrorResponse | null;

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
    return this.request<T>(this.buildUrl(siteUrl, path), token, {
      method: "GET",
    });
  }

  private async post<T>(
    siteUrl: string,
    token: string,
    path: string,
    body: unknown,
  ): Promise<T> {
    return this.request<T>(this.buildUrl(siteUrl, path), token, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
