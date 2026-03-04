# WP Dash Bridge

Ultra-lightweight WordPress plugin that exposes REST API endpoints for the [WP Dash](https://github.com/giulio-leone/wpdash) monitoring dashboard.

## Requirements

- WordPress 5.6+
- PHP 7.4+

## Installation

1. Upload the `wp-bridge-plugin` folder to `/wp-content/plugins/`
2. Activate the plugin through the WordPress admin
3. Navigate to **Settings → WP Dash Bridge** to copy your API token
4. Add the site URL and token to your WP Dash dashboard

## Authentication

All endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

A token is generated automatically on plugin activation. You can regenerate or revoke it from the settings page.

## Rate Limiting

All endpoints are rate-limited to **60 requests per minute per IP**.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wp-json/wpdash/v1/health` | Site health overview (WP/PHP/DB versions, theme, plugin counts) |
| `GET` | `/wp-json/wpdash/v1/plugins` | List all installed plugins with status and update info |
| `POST` | `/wp-json/wpdash/v1/plugins/manage` | Activate, deactivate, update, or delete a plugin |
| `POST` | `/wp-json/wpdash/v1/plugins/install` | Install a plugin from URL or WordPress.org slug |
| `GET` | `/wp-json/wpdash/v1/security/integrity` | Core file integrity check against official checksums |
| `POST` | `/wp-json/wpdash/v1/seo/audit` | SEO audit of a given page URL |
| `GET` | `/wp-json/wpdash/v1/logs` | PHP error log entries (filterable by level) |
| `GET` | `/wp-json/wpdash/v1/backup/status` | Backup status from common backup plugins |

### Plugin Management

**Manage a plugin:**
```json
POST /wp-json/wpdash/v1/plugins/manage
{
  "action": "activate|deactivate|update|delete",
  "plugin": "plugin-dir/plugin-file.php"
}
```

**Install a plugin:**
```json
POST /wp-json/wpdash/v1/plugins/install
{
  "source": "slug|url",
  "value": "akismet"
}
```

### SEO Audit

```json
POST /wp-json/wpdash/v1/seo/audit
{
  "url": "https://example.com/page-to-audit"
}
```

### Logs

```
GET /wp-json/wpdash/v1/logs?lines=100&level=error
```

Supported levels: `all`, `error`, `warning`, `notice`, `deprecated`.

## Development

```bash
composer install
./vendor/bin/phpunit
```

## License

GPL-2.0-or-later
