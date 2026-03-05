import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eq, and, gte } from "drizzle-orm";
import { db } from "@/infrastructure/database/drizzle-client";
import { sites } from "@/infrastructure/database/schemas/sites";
import { uptimeChecks } from "@/infrastructure/database/schemas/uptime-checks";
import { WPBridgeClient } from "@/infrastructure/wp-bridge/wp-bridge-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getSite(siteId: string, userId: string) {
  const rows = await db
    .select({ url: sites.url, token: sites.tokenHash })
    .from(sites)
    .where(and(eq(sites.id, siteId), eq(sites.userId, userId)));
  return rows[0] ?? null;
}

function bridge(site: { url: string; token: string }) {
  const client = new WPBridgeClient();
  return { url: site.url, token: site.token, client };
}

function ok(result: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
}

function err(e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true as const };
}

const ROLES = ["administrator", "editor", "author", "contributor", "subscriber"] as const;
const WOO_STATUSES = ["pending", "processing", "completed", "cancelled", "refunded"] as const;
const CLEANUP_ACTIONS = [
  "clean_transients",
  "clean_spam_comments",
  "clean_post_revisions",
  "clean_auto_drafts",
  "clean_all",
] as const;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "wp-dash", version: "1.0.0" });

  // ── Sites ─────────────────────────────────────────────────────────────────

  server.registerTool(
    "sites_list",
    {
      title: "List Sites",
      description: "List all WordPress sites for the authenticated user.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const rows = await db
          .select({
            id: sites.id,
            name: sites.name,
            url: sites.url,
            status: sites.status,
            wpVersion: sites.wpVersion,
            phpVersion: sites.phpVersion,
            lastCheckedAt: sites.lastCheckedAt,
          })
          .from(sites)
          .where(eq(sites.userId, userId));
        return ok(rows);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "sites_health",
    {
      title: "Site Health",
      description: "Get health status for a specific WordPress site.",
      inputSchema: z.object({ siteId: z.string() }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getHealth(url, token);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── Plugins ───────────────────────────────────────────────────────────────

  server.registerTool(
    "plugins_list",
    {
      title: "List Plugins",
      description: "List all plugins on a WordPress site.",
      inputSchema: z.object({ siteId: z.string() }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getPlugins(url, token);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "plugins_activate",
    {
      title: "Activate Plugin",
      description: "Activate a plugin on a WordPress site.",
      inputSchema: z.object({ siteId: z.string(), slug: z.string() }),
    },
    async ({ siteId, slug }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.managePlugin(url, token, "activate", slug);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "plugins_deactivate",
    {
      title: "Deactivate Plugin",
      description: "Deactivate a plugin on a WordPress site.",
      inputSchema: z.object({ siteId: z.string(), slug: z.string() }),
    },
    async ({ siteId, slug }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.managePlugin(url, token, "deactivate", slug);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "plugins_update",
    {
      title: "Update Plugin",
      description: "Update a plugin on a WordPress site.",
      inputSchema: z.object({ siteId: z.string(), slug: z.string() }),
    },
    async ({ siteId, slug }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.managePlugin(url, token, "update", slug);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "plugins_delete",
    {
      title: "Delete Plugin",
      description: "Delete a plugin from a WordPress site.",
      inputSchema: z.object({ siteId: z.string(), slug: z.string() }),
    },
    async ({ siteId, slug }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.managePlugin(url, token, "delete", slug);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "plugins_install",
    {
      title: "Install Plugin",
      description: "Install a plugin on a WordPress site by slug or ZIP URL.",
      inputSchema: z.object({
        siteId: z.string(),
        plugin: z.string().describe("Plugin slug or ZIP URL"),
      }),
    },
    async ({ siteId, plugin }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const source = plugin.startsWith("http") ? "url" : "slug";
        const result = await client.installPlugin(url, token, source, plugin);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── Themes ────────────────────────────────────────────────────────────────

  server.registerTool(
    "themes_list",
    {
      title: "List Themes",
      description: "List all themes on a WordPress site.",
      inputSchema: z.object({ siteId: z.string() }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getThemes(url, token);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "themes_activate",
    {
      title: "Activate Theme",
      description: "Activate a theme on a WordPress site.",
      inputSchema: z.object({ siteId: z.string(), slug: z.string() }),
    },
    async ({ siteId, slug }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.manageTheme(url, token, "activate", slug);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "themes_update",
    {
      title: "Update Theme",
      description: "Update a theme on a WordPress site.",
      inputSchema: z.object({ siteId: z.string(), slug: z.string() }),
    },
    async ({ siteId, slug }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.manageTheme(url, token, "update", slug);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "themes_delete",
    {
      title: "Delete Theme",
      description: "Delete a theme from a WordPress site.",
      inputSchema: z.object({ siteId: z.string(), slug: z.string() }),
    },
    async ({ siteId, slug }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.manageTheme(url, token, "delete", slug);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── Users ─────────────────────────────────────────────────────────────────

  server.registerTool(
    "users_list",
    {
      title: "List Users",
      description: "List WordPress users on a site.",
      inputSchema: z.object({ siteId: z.string() }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getUsers(url, token);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "users_create",
    {
      title: "Create User",
      description: "Create a new WordPress user on a site.",
      inputSchema: z.object({
        siteId: z.string(),
        email: z.string(),
        username: z.string(),
        password: z.string(),
        role: z.enum(ROLES),
      }),
    },
    async ({ siteId, email, username, password, role }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.manageUser(url, token, "create", { email, username, password, role });
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "users_delete",
    {
      title: "Delete User",
      description: "Delete a WordPress user from a site.",
      inputSchema: z.object({ siteId: z.string(), userId: z.number() }),
    },
    async ({ siteId, userId: wpUserId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.manageUser(url, token, "delete", { user_id: wpUserId });
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "users_change_role",
    {
      title: "Change User Role",
      description: "Change the role of a WordPress user on a site.",
      inputSchema: z.object({
        siteId: z.string(),
        userId: z.number(),
        role: z.enum(ROLES),
      }),
    },
    async ({ siteId, userId: wpUserId, role }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.manageUser(url, token, "change_role", { user_id: wpUserId, role });
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── Content ───────────────────────────────────────────────────────────────

  server.registerTool(
    "content_list_posts",
    {
      title: "List Posts",
      description: "List posts on a WordPress site.",
      inputSchema: z.object({
        siteId: z.string(),
        perPage: z.number().optional().default(20),
      }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getContent(url, token, "posts");
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "content_list_pages",
    {
      title: "List Pages",
      description: "List pages on a WordPress site.",
      inputSchema: z.object({
        siteId: z.string(),
        perPage: z.number().optional().default(20),
      }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getContent(url, token, "pages");
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "content_manage",
    {
      title: "Manage Content",
      description: "Publish, draft, trash, or delete a post/page on a WordPress site.",
      inputSchema: z.object({
        siteId: z.string(),
        postId: z.number(),
        action: z.enum(["publish", "draft", "trash", "delete"]),
      }),
    },
    async ({ siteId, postId, action }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.manageContent(url, token, action, postId);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── WooCommerce ───────────────────────────────────────────────────────────

  server.registerTool(
    "woocommerce_stats",
    {
      title: "WooCommerce Stats",
      description: "Get WooCommerce revenue, orders, products, and customers stats.",
      inputSchema: z.object({ siteId: z.string() }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getWooStats(url, token);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "woocommerce_list_orders",
    {
      title: "List Orders",
      description: "List recent WooCommerce orders.",
      inputSchema: z.object({
        siteId: z.string(),
        perPage: z.number().optional().default(20),
      }),
    },
    async ({ siteId, perPage }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getWooOrders(url, token, perPage);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "woocommerce_update_order_status",
    {
      title: "Update Order Status",
      description: "Update the status of a WooCommerce order.",
      inputSchema: z.object({
        siteId: z.string(),
        orderId: z.number(),
        status: z.enum(WOO_STATUSES),
      }),
    },
    async ({ siteId, orderId, status }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.updateWooOrderStatus(url, token, orderId, status);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "woocommerce_list_products",
    {
      title: "List Products",
      description: "List WooCommerce products.",
      inputSchema: z.object({
        siteId: z.string(),
        perPage: z.number().optional().default(20),
      }),
    },
    async ({ siteId, perPage }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getWooProducts(url, token, perPage);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── Database ──────────────────────────────────────────────────────────────

  server.registerTool(
    "database_status",
    {
      title: "Database Status",
      description: "Get database table sizes, total size, and DB version for a site.",
      inputSchema: z.object({ siteId: z.string() }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.getDBStatus(url, token);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "database_optimize",
    {
      title: "Optimize Database",
      description: "Run OPTIMIZE TABLE on all tables in the WordPress database.",
      inputSchema: z.object({ siteId: z.string() }),
    },
    async ({ siteId }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.optimizeDB(url, token);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.registerTool(
    "database_cleanup",
    {
      title: "Database Cleanup",
      description: "Run a cleanup action on the WordPress database.",
      inputSchema: z.object({
        siteId: z.string(),
        action: z.enum(CLEANUP_ACTIONS),
      }),
    },
    async ({ siteId, action }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url, token } = bridge(site);
        const result = await client.cleanupDB(url, token, action);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── SEO ───────────────────────────────────────────────────────────────────

  server.registerTool(
    "seo_audit",
    {
      title: "SEO Audit",
      description: "Run an SEO audit on a WordPress site URL.",
      inputSchema: z.object({
        siteId: z.string(),
        url: z.string().optional().describe("URL to audit, defaults to site homepage"),
      }),
    },
    async ({ siteId, url: pageUrl }) => {
      try {
        const site = await getSite(siteId, userId);
        if (!site) return err(new Error("Site not found"));
        const { client, url: siteUrl, token } = bridge(site);
        const result = await client.runSeoAudit(siteUrl, token, pageUrl ?? siteUrl);
        return ok(result);
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── Uptime ────────────────────────────────────────────────────────────────

  server.registerTool(
    "uptime_history",
    {
      title: "Uptime History",
      description: "Get uptime check history for a site over the last N days.",
      inputSchema: z.object({
        siteId: z.string(),
        days: z.number().min(1).max(30).optional().default(7),
      }),
    },
    async ({ siteId, days }) => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const rows = await db
          .select()
          .from(uptimeChecks)
          .where(
            and(
              eq(uptimeChecks.siteId, siteId),
              gte(uptimeChecks.checkedAt, since),
            ),
          );
        return ok(rows);
      } catch (e) {
        return err(e);
      }
    },
  );

  return server;
}
