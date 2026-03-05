# Contributing to WP Dash

Thank you for your interest in contributing to WP Dash.

> ⚖️ **License note:** WP Dash is licensed under the [Business Source License 1.1](./LICENSE).  
> By submitting a contribution, you agree that your contribution will be licensed under the same terms.  
> Production and SaaS use require a [commercial license](mailto:giulioleone097@gmail.com).

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Development Setup](#development-setup)
- [Pull Request Workflow](#pull-request-workflow)
- [Commit Convention](#commit-convention)
- [Code Style](#code-style)
- [Running Tests](#running-tests)

---

## Code of Conduct

Be respectful and constructive. Harassment, discrimination, or personal attacks of any kind will not be tolerated.

---

## Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Fix bugs or implement features
- 🔒 Report security vulnerabilities (see [SECURITY.md](./SECURITY.md))

---

## Reporting Bugs

1. Search [existing issues](https://github.com/giulio-leone/wpdash/issues) to avoid duplicates
2. Open a new issue with the **bug report** template
3. Include:
   - WP Dash version
   - Operating system and Node.js version
   - Steps to reproduce (minimal)
   - Expected vs actual behavior
   - Error logs or screenshots if available

---

## Suggesting Features

1. Search [existing issues](https://github.com/giulio-leone/wpdash/issues) for similar requests
2. Open a new issue with the **feature request** template
3. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternatives you've considered

---

## Development Setup

### Prerequisites

- Node.js ≥ 22.x
- npm ≥ 10.x
- Docker (optional)

### Local Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/wpdash.git
cd wpdash

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start the development server
npm run dev
```

### Useful Commands

```bash
npm run lint          # ESLint
npm run type-check    # TypeScript
npm run test          # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
npm run check         # lint + type-check + test
```

---

## Pull Request Workflow

1. **Fork** the repository and create a branch from `main`
2. Use the branch naming convention: `<type>/<short-description>` (e.g., `fix/bridge-timeout`, `feat/theme-management`)
3. Make your changes following the [Code Style](#code-style) guidelines
4. Ensure all checks pass: `npm run check`
5. Write or update tests as appropriate
6. Open a Pull Request against `main` with a clear description

### PR Checklist

- [ ] `npm run check` passes with 0 errors and 0 warnings
- [ ] Tests added/updated for the change
- [ ] No existing tests broken
- [ ] Documentation updated if applicable
- [ ] PR description explains the change and its motivation

---

## Commit Convention

WP Dash uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`

**Examples:**

```
feat(bridge): add theme management endpoints
fix(auth): handle token expiry on page refresh
docs: update Docker configuration guide
chore(deps): upgrade next to 16.4.0
```

---

## Code Style

- **Formatter:** Prettier (`npm run format`)
- **Linter:** ESLint (`npm run lint`) — zero warnings tolerance
- **TypeScript:** strict mode — no `any` without justification
- **Components:** React functional components only
- **Imports:** absolute paths via `@/` aliases

Run `npm run format` before committing.

---

## Running Tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

E2E tests require a running development server (`npm run dev`) or use the Playwright fixtures.

---

## Questions?

Open a [GitHub Discussion](https://github.com/giulio-leone/wpdash/discussions) or reach out at [giulioleone097@gmail.com](mailto:giulioleone097@gmail.com).

For **commercial licensing** inquiries: [giulioleone.com](https://giulioleone.com)
