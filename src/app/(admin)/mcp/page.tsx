"use client";

import React, { useState, useEffect } from "react";
import {
  GridIcon, PlugInIcon, PageIcon, UserIcon, DocsIcon,
  DollarLineIcon, TableIcon, PieChartIcon, TimeIcon,
} from "@/icons";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tool {
  name: string;
  description: string;
}

interface Domain {
  label: string;
  icon: React.ReactNode;
  tools: Tool[];
}

// ── Data ──────────────────────────────────────────────────────────────────────

const DOMAINS: Domain[] = [
  {
    label: "Sites",
    icon: <GridIcon className="w-5 h-5 text-brand-500" />,
    tools: [
      { name: "sites_list", description: "List all WordPress sites for the authenticated user." },
      { name: "sites_health", description: "Get health status for a specific WordPress site." },
    ],
  },
  {
    label: "Plugins",
    icon: <PlugInIcon className="w-5 h-5 text-blue-500" />,
    tools: [
      { name: "plugins_list", description: "List all plugins on a WordPress site." },
      { name: "plugins_activate", description: "Activate a plugin on a WordPress site." },
      { name: "plugins_deactivate", description: "Deactivate a plugin on a WordPress site." },
      { name: "plugins_update", description: "Update a plugin on a WordPress site." },
      { name: "plugins_delete", description: "Delete a plugin from a WordPress site." },
      { name: "plugins_install", description: "Install a plugin on a WordPress site by slug or ZIP URL." },
    ],
  },
  {
    label: "Themes",
    icon: <PageIcon className="w-5 h-5 text-purple-500" />,
    tools: [
      { name: "themes_list", description: "List all themes on a WordPress site." },
      { name: "themes_activate", description: "Activate a theme on a WordPress site." },
      { name: "themes_update", description: "Update a theme on a WordPress site." },
      { name: "themes_delete", description: "Delete a theme from a WordPress site." },
    ],
  },
  {
    label: "Users",
    icon: <UserIcon className="w-5 h-5 text-green-500" />,
    tools: [
      { name: "users_list", description: "List WordPress users on a site." },
      { name: "users_create", description: "Create a new WordPress user on a site." },
      { name: "users_delete", description: "Delete a WordPress user from a site." },
      { name: "users_change_role", description: "Change the role of a WordPress user on a site." },
    ],
  },
  {
    label: "Content",
    icon: <DocsIcon className="w-5 h-5 text-orange-500" />,
    tools: [
      { name: "content_list_posts", description: "List posts on a WordPress site." },
      { name: "content_list_pages", description: "List pages on a WordPress site." },
      { name: "content_manage", description: "Publish, draft, trash, or delete a post/page on a WordPress site." },
    ],
  },
  {
    label: "WooCommerce",
    icon: <DollarLineIcon className="w-5 h-5 text-emerald-500" />,
    tools: [
      { name: "woocommerce_stats", description: "Get WooCommerce revenue, orders, products, and customers stats." },
      { name: "woocommerce_list_orders", description: "List recent WooCommerce orders." },
      { name: "woocommerce_update_order_status", description: "Update the status of a WooCommerce order." },
      { name: "woocommerce_list_products", description: "List WooCommerce products." },
    ],
  },
  {
    label: "Database",
    icon: <TableIcon className="w-5 h-5 text-gray-500" />,
    tools: [
      { name: "database_status", description: "Get database table sizes, total size, and DB version for a site." },
      { name: "database_optimize", description: "Run OPTIMIZE TABLE on all tables in the WordPress database." },
      { name: "database_cleanup", description: "Run a cleanup action on the WordPress database." },
    ],
  },
  {
    label: "SEO",
    icon: <PieChartIcon className="w-5 h-5 text-brand-500" />,
    tools: [
      { name: "seo_audit", description: "Run an SEO audit on a WordPress site URL." },
    ],
  },
  {
    label: "Uptime",
    icon: <TimeIcon className="w-5 h-5 text-sky-500" />,
    tools: [
      { name: "uptime_history", description: "Get uptime check history for a site over the last N days." },
    ],
  },
];

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "wp-dash": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-domain.com/api/mcp"
      ],
      "env": {
        "MCP_BEARER_TOKEN": "your-supabase-jwt"
      }
    }
  }
}`;

const VSCODE_CONFIG = `// .vscode/mcp.json
{
  "servers": {
    "wp-dash": {
      "type": "http",
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "Authorization": "Bearer your-supabase-jwt"
      }
    }
  }
}`;

const CURSOR_CONFIG = `// ~/.cursor/mcp.json
{
  "mcpServers": {
    "wp-dash": {
      "type": "streamable-http",
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "Authorization": "Bearer your-supabase-jwt"
      }
    }
  }
}`;

// ── Subcomponents ─────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-700/50"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-500">Copied!</span>
        </>
      ) : (
        <>
          <CopyIcon className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}

function CodeBlock({
  code,
  language = "json",
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="relative rounded-xl border border-gray-800 bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <span className="text-xs font-medium text-gray-500">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-green-400">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200">
      {children}
    </code>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CopyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function KeyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2l-9.6 9.6" />
      <path d="M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

function BookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function PlugIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M7 12v-2a5 5 0 0 1 10 0v2" />
      <rect x="5" y="12" width="14" height="4" rx="1" />
    </svg>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function McpPage() {
  const [origin, setOrigin] = useState("https://your-domain.com");
  const [activeTab, setActiveTab] = useState<"claude" | "vscode" | "cursor">("claude");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const endpointUrl = `${origin}/api/mcp`;

  const totalTools = DOMAINS.reduce((acc, d) => acc + d.tools.length, 0);

  const tabConfigs: Record<"claude" | "vscode" | "cursor", { label: string; code: string; language: string }> = {
    claude: {
      label: "Claude Desktop",
      code: CLAUDE_DESKTOP_CONFIG.replace("https://your-domain.com/api/mcp", endpointUrl),
      language: "claude_desktop_config.json",
    },
    vscode: {
      label: "VS Code",
      code: VSCODE_CONFIG.replace("https://your-domain.com/api/mcp", endpointUrl),
      language: ".vscode/mcp.json",
    },
    cursor: {
      label: "Cursor AI",
      code: CURSOR_CONFIG.replace("https://your-domain.com/api/mcp", endpointUrl),
      language: "~/.cursor/mcp.json",
    },
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            JSON-RPC 2.0
          </span>
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
            HTTP Streamable
          </span>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
            v1.0
          </span>
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          WP Dash MCP Server
        </h1>
        <p className="max-w-2xl text-base text-gray-600 dark:text-gray-400">
          Control your WordPress sites from any AI assistant. WP Dash exposes{" "}
          <span className="font-semibold text-gray-800 dark:text-gray-200">{totalTools} tools</span> via the{" "}
          <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-500 underline-offset-2 hover:underline dark:text-brand-400">
            Model Context Protocol
          </a>
          , letting Claude, Cursor, and VS Code manage plugins, themes, users, content, and more.
        </p>
      </div>

      {/* ── Endpoint ────────────────────────────────────────────────────────── */}
      <Section icon={<PlugIcon className="h-4 w-4" />} title="Endpoint">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            All MCP requests are sent to a single HTTP endpoint using the Streamable HTTP transport.
          </p>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
            <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-green-700 dark:bg-green-950 dark:text-green-400">
              POST
            </span>
            <span className="flex-1 overflow-x-auto font-mono text-sm text-gray-800 dark:text-gray-200">
              {endpointUrl}
            </span>
            <CopyButton text={endpointUrl} label="Copy URL" />
          </div>
        </div>
      </Section>

      {/* ── Authentication ───────────────────────────────────────────────────── */}
      <Section icon={<ShieldIcon className="h-4 w-4" />} title="Authentication">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Every request must include a{" "}
            <span className="font-medium text-gray-800 dark:text-gray-200">Supabase JWT access token</span>{" "}
            in the <InlineCode>Authorization</InlineCode> header using the Bearer scheme.
          </p>
          <CodeBlock
            code={`Authorization: Bearer <your-supabase-access-token>`}
            language="HTTP header"
          />
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <span className="font-semibold">⚠ Important:</span> Your token expires after 1 hour. Use the{" "}
              <InlineCode>refresh_token</InlineCode> to obtain a new access token, or re-authenticate
              through the WP Dash login flow.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Integration guide ────────────────────────────────────────────────── */}
      <Section icon={<BookIcon className="h-4 w-4" />} title="Integration Guide">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Tabs */}
          <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800">
            {(["claude", "vscode", "cursor"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tabConfigs[tab].label}
              </button>
            ))}
          </div>
          {/* Content */}
          <div className="p-5">
            {activeTab === "claude" && (
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Add this to your <InlineCode>claude_desktop_config.json</InlineCode>. Requires{" "}
                <InlineCode>npx mcp-remote</InlineCode> — install it with{" "}
                <InlineCode>npm install -g mcp-remote</InlineCode>.
              </p>
            )}
            {activeTab === "vscode" && (
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Create or update <InlineCode>.vscode/mcp.json</InlineCode> in your workspace root.
                Requires the VS Code MCP extension.
              </p>
            )}
            {activeTab === "cursor" && (
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                Add this to <InlineCode>~/.cursor/mcp.json</InlineCode> (global) or your project&apos;s{" "}
                <InlineCode>.cursor/mcp.json</InlineCode>.
              </p>
            )}
            <CodeBlock
              code={tabConfigs[activeTab].code}
              language={tabConfigs[activeTab].language}
            />
          </div>
        </div>
      </Section>

      {/* ── Tools Reference ──────────────────────────────────────────────────── */}
      <Section icon={<BookIcon className="h-4 w-4" />} title="Tools Reference">
        <div className="grid gap-4 sm:grid-cols-2">
          {DOMAINS.map((domain) => (
            <div
              key={domain.label}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                  <span className="flex items-center justify-center text-lg">{domain.icon}</span>
                  {domain.label}
                </h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {domain.tools.length} tool{domain.tools.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ul className="space-y-2">
                {domain.tools.map((tool) => (
                  <li key={tool.name} className="group">
                    <div className="rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-gray-100 hover:bg-gray-50 dark:hover:border-gray-800 dark:hover:bg-gray-800/40">
                      <p className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {tool.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {tool.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Get your JWT ─────────────────────────────────────────────────────── */}
      <Section icon={<KeyIcon className="h-4 w-4" />} title="Get Your JWT">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Your Supabase JWT is your WP Dash session token. There are two ways to retrieve it:
          </p>
          <div className="space-y-4">
            {/* Option 1 */}
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  From the Dashboard Profile Page
                </p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Navigate to your profile settings in WP Dash. Your access token is displayed there and can be copied directly.
                </p>
              </div>
            </div>
            {/* Option 2 */}
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Via Supabase Auth API
                </p>
                <p className="mb-2 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  Sign in programmatically and extract the <InlineCode>access_token</InlineCode> from the response:
                </p>
                <CodeBlock
                  language="bash"
                  code={`curl -X POST '${origin}/auth/v1/token?grant_type=password' \\
  -H 'apikey: <your-supabase-anon-key>' \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"you@example.com","password":"your-password"}' \\
  | jq -r '.access_token'`}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/50 dark:bg-indigo-950/30">
            <p className="text-sm text-indigo-800 dark:text-indigo-300">
              <span className="font-semibold">💡 Tip:</span> Store your token in an environment variable (e.g.{" "}
              <InlineCode>MCP_BEARER_TOKEN</InlineCode>) rather than hard-coding it in config files.
              Most MCP client integrations support env var interpolation.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
