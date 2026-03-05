---
id: intro
sidebar_position: 1
---

# Introduction

**WP Dash** is an open-source dashboard to monitor, manage, and maintain multiple WordPress sites from a single interface.

:::warning Experimental Software
WP Dash is under active development. Interfaces, APIs, and data models may change without notice between releases. Use in production at your own risk.
:::

## How It Works

WP Dash connects to each WordPress site through a lightweight plugin — **WP Dash Bridge** — that exposes a secure REST API. The dashboard reads and writes to these endpoints to give you a unified management console.

```
Browser → WP Dash Dashboard (Next.js) → WP Dash Bridge (REST API) → WordPress Site
```

## Key Features

| Feature | Description |
|---------|-------------|
| 🖥️ Multi-site overview | Monitor all WordPress installations from one place |
| 🔌 Plugin management | Activate, deactivate, update, install plugins remotely |
| 🔒 Security audit | Core file integrity check against official checksums |
| 🩺 Site health | WP/PHP/DB versions, theme, plugin counts |
| 📋 Error logs | PHP error log with severity filtering |
| 💾 Backup status | Read state from common backup plugins |
| 🔍 SEO audit | On-demand SEO analysis for any page URL |
| 🌙 Dark mode | Full dark/light theme support |

## Quick Navigation

- **New to WP Dash?** → Start with [Installation](./getting-started/installation)
- **Using Docker?** → See [Docker guide](./getting-started/docker)
- **Setting up WordPress?** → See [WP Dash Bridge plugin](./plugins/wp-bridge)
- **API reference?** → See [REST API](./api/rest-api)
