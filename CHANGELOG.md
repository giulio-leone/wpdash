# Changelog

All notable changes to WP Dash will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> ⚠️ WP Dash is experimental software. Until v1.0.0, minor versions may include breaking changes.

---

## [Unreleased]

### Added
<!-- List features added since last release -->

### Changed
<!-- List behavior changes since last release -->

### Fixed
<!-- List bug fixes since last release -->

### Deprecated
<!-- List features that will be removed in an upcoming release -->

### Removed
<!-- List features removed in this release -->

### Security
<!-- List security fixes since last release -->

---

## [0.1.0] — 2026-03-05

### Added

#### Dashboard (wpdash)

- Initial release of the Next.js 16 centralized WordPress management dashboard
- Multi-site overview: monitor WP/PHP/DB versions, active theme, plugin counts
- Plugin management: activate, deactivate, update, install, delete plugins remotely
- Site health monitoring with at-a-glance status indicators
- PHP error log viewer with severity filtering (`all`, `error`, `warning`, `notice`, `deprecated`)
- Backup status reader (UpdraftPlus, BackWPup, and other common backup plugins)
- SEO audit endpoint integration for on-demand page analysis
- Security integrity check: core file verification against official WordPress checksums
- Supabase-backed authentication and site storage
- Dark/light theme with system preference support
- Docker production stack (`docker-compose.yml`) with multi-stage `node:22-alpine` image
- Docker development stack (`docker-compose.dev.yml`) with hot-reload
- Playwright E2E test suite for critical user flows
- Vitest unit test suite
- ESLint + Prettier + TypeScript strict configuration

#### WP Dash Bridge Plugin — v1.0.0

- REST API bridge exposing 8 endpoint groups: health, plugins, themes, users, content, security, SEO, logs, backups
- Bearer token authentication with auto-generated tokens on activation
- Token regeneration and revocation from WordPress admin (Settings → WP Dash Bridge)
- Rate limiting: 60 requests per minute per IP
- Plugin management: activate / deactivate / update / install (slug or URL) / delete
- Core integrity check against official WordPress.org checksums
- PHP error log tailing with level filtering
- SEO audit for arbitrary page URLs

#### WP Dash Standalone Plugin — v1.0.0 ⚠️

- Experimental embedded dashboard within WordPress admin (not recommended for production)
- Multi-site bridge client integration

#### Project

- Business Source License 1.1 (BSL 1.1) — Additional Use Grant: None; Change Date: 2030-03-05; Change License: GPL-3.0-or-later
- Docusaurus v3 documentation site deployed on GitHub Pages
- GitHub Actions workflow for automated docs deployment
- `SECURITY.md` — responsible disclosure policy with private advisory support
- `CONTRIBUTING.md` — PR workflow, commit convention, dev setup guide
- GitHub Issue templates: bug report, feature request, security/commercial contact links

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ⚠️ | Experimental feature — may be unstable |
| 🔒 | Security-related change |
| 💥 | Breaking change |

[Unreleased]: https://github.com/giulio-leone/wpdash/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/giulio-leone/wpdash/releases/tag/v0.1.0
