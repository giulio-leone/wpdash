# Security Policy

## Supported Versions

Only the latest release receives security fixes.

| Version | Supported |
|---------|-----------|
| 0.1.x (latest) | ✅ |
| < 0.1.0 | ❌ |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues.**

If you discover a security vulnerability in WP Dash or the WP Dash Bridge plugin, please report it responsibly via one of the following channels:

### GitHub Private Vulnerability Reporting (preferred)

Use GitHub's built-in private vulnerability reporting:  
**[Report a vulnerability](https://github.com/giulio-leone/wpdash/security/advisories/new)**

### Email

Send a detailed report to: **giulioleone097@gmail.com**

Use the subject line: `[SECURITY] WP Dash — <brief description>`

## What to Include in Your Report

Please provide as much of the following information as possible:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass, path traversal)
- **Affected component** (dashboard, WP Dash Bridge plugin, WP Dash Standalone plugin)
- **Version(s) affected**
- **Step-by-step reproduction instructions**
- **Proof of concept** (code, screenshots, video) — if available
- **Potential impact** (what an attacker could do if the vulnerability is exploited)
- **Suggested fix** — if you have one

## Response Timeline

| Stage | Target |
|-------|--------|
| Initial acknowledgement | Within 72 hours |
| Assessment and triage | Within 7 days |
| Fix or mitigation | Depends on severity (see below) |
| Public disclosure | Coordinated with reporter |

### Severity-based Fix Targets

| Severity | Target Fix Timeline |
|----------|---------------------|
| Critical (CVSS ≥ 9.0) | 7 days |
| High (CVSS 7.0–8.9) | 14 days |
| Medium (CVSS 4.0–6.9) | 30 days |
| Low (CVSS < 4.0) | Next scheduled release |

## Disclosure Policy

- Security fixes are released as patch versions (e.g., `v0.1.1`)
- A **GitHub Security Advisory** (CVE) is published after the fix is available
- The reporter will be credited in the advisory unless they prefer to remain anonymous
- We ask reporters to keep the vulnerability private until the fix is publicly available

## Scope

### In Scope

- WP Dash dashboard application (`src/`)
- WP Dash Bridge WordPress plugin (`wp-bridge-plugin/`)
- WP Dash Standalone WordPress plugin (`wp-wpdash-plugin/`)
- API authentication and token handling
- Data validation and injection vulnerabilities
- Authorization and access control issues

### Out of Scope

- Vulnerabilities in third-party dependencies (report upstream to the dependency maintainer)
- Issues already reported and tracked
- Social engineering attacks
- Denial of service (DoS) attacks

## Security Best Practices for Self-Hosted Deployments

- **Always use HTTPS** — never expose WP Dash or the REST API over plain HTTP
- **Keep WP Dash updated** — subscribe to releases to be notified of security patches
- **Rotate API tokens regularly** — use the regenerate function in WP Dash Bridge settings
- **Restrict API access by IP** — use a firewall or `.htaccess` to limit who can reach the REST API
- **Secure your `.env` file** — never commit it to version control; ensure file permissions are `600`
- **Keep WordPress updated** — use the integrity check endpoint to detect core file tampering

## Contact

Security contact: **giulioleone097@gmail.com**  
Commercial inquiries: **[giulioleone.com](https://giulioleone.com)**
