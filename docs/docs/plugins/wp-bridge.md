---
id: wp-bridge
sidebar_position: 1
---

# WP Dash Bridge

> Ultra-lightweight REST API bridge for WP Dash. No database writes, no admin UI bloat.

**Version:** 1.0.0  
**License:** GPL-2.0-or-later  
**Requires:** WordPress 5.6+, PHP 7.4+

## Download

Download the ready-to-install ZIP from the repository:

- [`wp-bridge-plugin.zip`](https://github.com/giulio-leone/wpdash/raw/main/wp-bridge-plugin.zip)

## Installation

1. Go to **WordPress Admin → Plugins → Add New → Upload Plugin**
2. Upload `wp-bridge-plugin.zip`
3. Click **Activate Plugin**
4. Go to **Settings → WP Dash Bridge**
5. Copy your **API Token**
6. Add the site URL and token to your WP Dash dashboard

## Authentication

All API endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

A token is generated automatically on plugin activation.  
You can **regenerate** or **revoke** it from the settings page at any time.

## Rate Limiting

All endpoints are rate-limited to **60 requests per minute per IP**.

## API Endpoints

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

For full endpoint documentation, see [REST API Reference](../api/rest-api).
