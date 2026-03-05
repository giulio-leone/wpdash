# WP Dash

> **Centralized WordPress monitoring and maintenance dashboard**

![version](https://img.shields.io/badge/version-0.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![license](https://img.shields.io/badge/license-BSL%201.1-orange)
![node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![status](https://img.shields.io/badge/status-experimental-orange)

WP Dash is an open-source dashboard to monitor, manage, and maintain multiple WordPress sites from a single interface. It connects to each site through a lightweight WordPress plugin (WP Dash Bridge) that exposes a secure REST API.

---

> ⚠️ **Experimental software** — WP Dash is under active development. Interfaces, APIs, and data models may change without notice between releases. Use in production at your own risk.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [npm / local dev](#npm--local-dev)
  - [Docker](#docker)
- [WordPress Plugins](#wordpress-plugins)
  - [WP Dash Bridge (recommended)](#wp-dash-bridge-recommended)
  - [WP Dash Standalone (highly experimental)](#wp-dash-standalone-highly-experimental)
- [Releases](#releases)
- [Documentation](#documentation)
- [License](#license)

---

## Features

- 🖥️ **Multi-site overview** — monitor all your WordPress installations from one place
- 🔌 **Plugin management** — activate, deactivate, update, and install plugins remotely
- 🔒 **Security audit** — core file integrity check against official WordPress checksums
- 🩺 **Site health** — WP/PHP/DB versions, active theme, plugin counts at a glance
- 📋 **Error logs** — tail PHP error logs filtered by severity level
- 💾 **Backup status** — read backup state from common backup plugins
- 🔍 **SEO audit** — on-demand SEO analysis for any page URL
- 🐳 **Docker-ready** — production and development Docker Compose configs included
- 🌙 **Dark mode** — full dark/light theme support

---

## Architecture

```
wpdash/                     ← Next.js 16 dashboard (this repo)
  ├── src/                  ← App Router pages, API routes, components
  ├── Dockerfile            ← Multi-stage production image (node:22-alpine)
  ├── docker-compose.yml    ← Production stack
  ├── docker-compose.dev.yml← Development stack (hot-reload)
  ├── wp-bridge-plugin/     ← WP Dash Bridge WordPress plugin (source)
  ├── wp-bridge-plugin.zip  ← WP Dash Bridge — ready-to-install ZIP
  ├── wp-wpdash-plugin/     ← WP Dash Standalone plugin (source) ⚠️
  └── wp-wpdash-plugin.zip  ← WP Dash Standalone — ready-to-install ZIP ⚠️
```

The dashboard communicates with WordPress sites via authenticated REST API calls.
Each site must have **WP Dash Bridge** installed and activated.

---

## Getting Started

### Prerequisites

- **Node.js** 22.x or later
- **npm** 10.x or later
- (Optional) **Docker** and **Docker Compose** for containerised deployment

### npm / local dev

```bash
# 1. Clone the repository
git clone https://github.com/giulio-leone/wpdash.git
cd wpdash

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in your values
cp .env.example .env

# 4. Start the development server
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000).

**Other useful commands:**

```bash
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (0 warnings tolerance)
npm run type-check   # TypeScript check
npm run test         # Unit tests (Vitest)
npm run test:e2e     # End-to-end tests (Playwright)
npm run check        # lint + type-check + test in one command
```

### Docker

**Development (hot-reload):**

```bash
docker compose -f docker-compose.dev.yml up
```

**Production:**

```bash
docker compose up --build -d
```

The production image is a hardened multi-stage build (`node:22-alpine`) running as a non-root user on port `3000`.

---

## WordPress Plugins

### WP Dash Bridge (recommended)

> Ultra-lightweight REST API bridge for WP Dash. No database writes, no admin UI bloat.

**Download:** [`wp-bridge-plugin.zip`](./wp-bridge-plugin.zip)

**Installation:**

1. Upload `wp-bridge-plugin.zip` via **WordPress Admin → Plugins → Add New → Upload Plugin**
2. Activate the plugin
3. Go to **Settings → WP Dash Bridge** and copy your API token
4. Add the site URL and token to your WP Dash dashboard

**Requirements:** WordPress 5.6+, PHP 7.4+

**API endpoints exposed:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wp-json/wpdash/v1/health` | Site health (WP/PHP/DB versions, theme, plugin counts) |
| `GET` | `/wp-json/wpdash/v1/plugins` | List all plugins with status and update info |
| `POST` | `/wp-json/wpdash/v1/plugins/manage` | Activate / deactivate / update / delete a plugin |
| `POST` | `/wp-json/wpdash/v1/plugins/install` | Install a plugin from slug or URL |
| `GET` | `/wp-json/wpdash/v1/security/integrity` | Core file integrity check |
| `POST` | `/wp-json/wpdash/v1/seo/audit` | SEO audit for a given page URL |
| `GET` | `/wp-json/wpdash/v1/logs` | PHP error log entries (filterable by level) |
| `GET` | `/wp-json/wpdash/v1/backup/status` | Backup status from common backup plugins |

All endpoints require `Authorization: Bearer <token>` and are rate-limited to **60 req/min per IP**.

---

### WP Dash Standalone (highly experimental)

> ⚠️ **HIGHLY EXPERIMENTAL — NOT RECOMMENDED FOR PRODUCTION USE**
>
> This plugin embeds the WP Dash dashboard directly inside the WordPress admin.
> It is in early development, may be unstable, and **is not guaranteed to work** with all WordPress configurations.
> APIs and behavior may change at any time without notice.

**Download:** [`wp-wpdash-plugin.zip`](./wp-wpdash-plugin.zip)

**Requirements:** WordPress 5.6+, PHP 7.4+

---

## Releases

### v0.1.0 — Initial Release

**Dashboard (wpdash)**

- First public release of the Next.js dashboard
- Multi-site management UI with plugin and health monitoring
- Supabase-backed authentication and site storage
- Docker production and development stacks
- WP Dash Bridge plugin integration

**WP Dash Bridge Plugin — v1.0.0**

- Full REST API surface: health, plugins, security, SEO, logs, backups
- Bearer token authentication with auto-generated tokens
- Rate limiting (60 req/min per IP)
- Plugin install/activate/deactivate/update/delete support

**WP Dash Standalone Plugin — v1.0.0** ⚠️ *Highly experimental*

- Embedded dashboard within WordPress admin
- REST API bridge included

> 📦 **Plugin ZIPs** for direct WordPress installation:
> - [`wp-bridge-plugin.zip`](./wp-bridge-plugin.zip)
> - [`wp-wpdash-plugin.zip`](./wp-wpdash-plugin.zip) ⚠️

---

## Documentation

Full documentation is built with **[Docusaurus](https://docusaurus.io)** and covers:

- Dashboard configuration and environment variables
- Connecting WordPress sites via WP Dash Bridge
- REST API reference
- Docker deployment guide
- Security model and token management

📖 **[Read the docs →](https://giulio-leone.github.io/wpdash)**

> Documentation is co-located in the `docs/` directory and deployed automatically.

---

## License

WP Dash is released under the **[Business Source License 1.1 (BSL 1.1)](./LICENSE)**.

**Key terms:**
- ✅ Free for non-production use (local dev, evaluation, study)
- ❌ **No production or SaaS use** without a commercial license (Additional Use Grant: None)
- 📅 Converts to **GPL-3.0-or-later** on **March 5, 2030**
- 📧 Commercial licenses: [giulio@wpdash.io](mailto:giulio@wpdash.io)

The WordPress plugins (`wp-bridge-plugin`, `wp-wpdash-plugin`) are released under the **GPL-2.0-or-later** license, as required by the WordPress plugin ecosystem.
