---
id: authentication
sidebar_position: 1
---

# Authentication & Security

## Token-Based Authentication

WP Dash Bridge uses **Bearer token** authentication for all API requests.

### Token Generation

A token is generated automatically when the plugin is first activated.  
You can manage it at **WordPress Admin → Settings → WP Dash Bridge**:

- **Copy** the current token
- **Regenerate** a new token (invalidates the old one immediately)
- **Revoke** the token (disables all API access until a new one is generated)

### Using the Token

Include the token in every API request:

```http
GET /wp-json/wpdash/v1/health HTTP/1.1
Host: your-wordpress-site.com
Authorization: Bearer your-secret-token-here
```

## Rate Limiting

All endpoints are protected by rate limiting:

- **Limit:** 60 requests per minute
- **Scope:** per IP address
- **Response on exceed:** `429 Too Many Requests`

## Security Recommendations

- **Rotate tokens regularly** — use the regenerate function after any suspected exposure
- **Use HTTPS** — never expose your WordPress REST API over plain HTTP
- **Restrict by IP** (optional) — use a firewall or `.htaccess` to whitelist the WP Dash server IP
- **Keep WordPress updated** — the integrity check endpoint helps detect tampering
