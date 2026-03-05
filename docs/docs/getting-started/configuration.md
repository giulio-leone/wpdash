---
id: configuration
sidebar_position: 3
---

# Configuration

WP Dash is configured through environment variables loaded from `.env`.

## Required Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Node environment |
| `PORT` | `3000` | Port for the production server |
| `HOSTNAME` | `0.0.0.0` | Bind address (Docker) |

## Setting Up Supabase

WP Dash uses [Supabase](https://supabase.com) for authentication and site storage.

1. Create a free project at [supabase.com](https://supabase.com)
2. Copy your **Project URL** and **anon key** from **Settings → API**
3. Add them to your `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run database migrations:

```bash
npm run db:migrate
```
