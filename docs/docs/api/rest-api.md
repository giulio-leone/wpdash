---
id: rest-api
sidebar_position: 1
---

# REST API Reference

All endpoints are provided by the **WP Dash Bridge** WordPress plugin.

## Base URL

```
https://<your-wordpress-site>/wp-json/wpdash/v1
```

## Authentication

All requests must include a Bearer token:

```
Authorization: Bearer <token>
```

The token is available in **WordPress Admin → Settings → WP Dash Bridge**.

## Rate Limiting

**60 requests per minute per IP.** Exceeding this returns `429 Too Many Requests`.

---

## Health

### `GET /health`

Returns an overview of the WordPress site health.

**Response:**

```json
{
  "wp_version": "6.7.1",
  "php_version": "8.2.0",
  "db_version": "8.0.32",
  "active_theme": "twentytwentyfour",
  "plugin_count": 12,
  "active_plugin_count": 8
}
```

---

## Plugins

### `GET /plugins`

List all installed plugins with status and update availability.

### `POST /plugins/manage`

Activate, deactivate, update, or delete a plugin.

**Request body:**

```json
{
  "action": "activate | deactivate | update | delete",
  "plugin": "plugin-directory/plugin-file.php"
}
```

**Example — activate Akismet:**

```json
{
  "action": "activate",
  "plugin": "akismet/akismet.php"
}
```

### `POST /plugins/install`

Install a plugin from WordPress.org or a direct URL.

**Request body:**

```json
{
  "source": "slug | url",
  "value": "akismet"
}
```

---

## Security

### `GET /security/integrity`

Checks WordPress core file integrity against official checksums from the WordPress.org API.

**Response includes:**

- List of modified core files
- List of unexpected files in core directories
- Overall pass/fail status

---

## SEO Audit

### `POST /seo/audit`

Runs an SEO audit on the specified page URL.

**Request body:**

```json
{
  "url": "https://example.com/my-page"
}
```

**Response includes:**

- Title tag presence and length
- Meta description presence and length
- Heading structure (H1 count)
- Image alt attributes
- Canonical URL

---

## Logs

### `GET /logs`

Retrieve PHP error log entries.

**Query parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `lines` | `50` | Number of lines to return |
| `level` | `all` | Filter by severity: `all`, `error`, `warning`, `notice`, `deprecated` |

**Example:**

```
GET /wp-json/wpdash/v1/logs?lines=100&level=error
```

---

## Backup Status

### `GET /backup/status`

Returns backup status detected from common backup plugins (UpdraftPlus, BackWPup, etc.).

---

## Error Responses

| Code | Meaning |
|------|---------|
| `401` | Missing or invalid Bearer token |
| `403` | Insufficient permissions |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
