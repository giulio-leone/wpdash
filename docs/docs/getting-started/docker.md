---
id: docker
sidebar_position: 2
---

# Docker

WP Dash ships with two Docker Compose configurations.

## Development

Mounts the source code for hot-reload. No build step required.

```bash
docker compose -f docker-compose.dev.yml up
```

The dashboard is available at [http://localhost:3000](http://localhost:3000).

## Production

Builds a hardened multi-stage image based on `node:22-alpine`.  
The container runs as a non-root user (`nextjs:nodejs`).

```bash
docker compose up --build -d
```

### What the production image does

```dockerfile
# Stage 1 — Install dependencies (npm ci)
# Stage 2 — Build Next.js application
# Stage 3 — Copy only the standalone output (no node_modules in final image)
```

The final image is minimal: only the compiled `.next/standalone` output is included.

## Environment Variables

Both Compose files read from `.env` in the project root via `env_file: .env`.

```bash
cp .env.example .env
# Edit .env before starting containers
```

## Ports

| Container | Host port | Service |
|-----------|-----------|---------|
| `wpdash` (prod) | `3000` | Dashboard |
| `wpdash-dev` | `3000` | Dev server |

## Stop / Remove

```bash
# Development
docker compose -f docker-compose.dev.yml down

# Production
docker compose down
```
