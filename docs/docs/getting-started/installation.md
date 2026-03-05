---
id: installation
sidebar_position: 1
---

# Installation

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 22.x |
| npm | ≥ 10.x |
| Docker (optional) | any recent version |

## Clone & Install

```bash
git clone https://github.com/giulio-leone/wpdash.git
cd wpdash
npm install
```

## Environment Variables

Copy the environment template:

```bash
cp .env.example .env
```

Open `.env` and configure the required values. See [Configuration](./configuration) for all available variables.

## Start Development Server

```bash
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000).

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint (0 warnings tolerance) |
| `npm run type-check` | TypeScript type check |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run check` | lint + type-check + test in one pass |

## Next Steps

- **Docker deployment** → [Docker guide](./docker)
- **Connect a WordPress site** → [WP Dash Bridge](../plugins/wp-bridge)
