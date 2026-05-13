# IPTV Streaming Platform

A production-grade IPTV web player and management platform built with Next.js, Express, PostgreSQL, and Redis. Supports live TV channels, movies, and series through Xtream Codes-compatible providers with multi-profile user management, stream proxying, and a real-time admin dashboard.

---

## Features

- **Live TV, Movies & Series** — Browse and stream content from any Xtream Codes-compatible DNS provider
- **Stream Proxy** — Server-side proxy strips provider credentials from the client; supports HLS, MPEG-TS, and direct streams
- **Multi-Profile Accounts** — Each user can create up to N profiles with independent watch history, favourites, and parental PIN
- **Role-Based Access Control** — Super Admin / Admin / Reseller / User / Guest roles with granular permissions
- **EPG (Electronic Programme Guide)** — Per-channel programme schedules sourced from the provider
- **JWT Authentication** — Short-lived access tokens + refresh token rotation + secure stream tokens
- **Redis Caching** — Channel lists, stream metadata, and session data cached for fast response times
- **Admin Dashboard** — Manage users, subscriptions, DNS providers, and monitor platform health
- **Rate Limiting** — Per-IP rate limits on API, auth, and stream endpoints via NGINX and Express
- **Docker-first** — Single `docker compose up` brings up the full stack; dev mode with hot-reload

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Frontend    | Next.js 15, React, Tailwind CSS, Zustand, hls.js |
| Backend     | Node.js 20, Express 4, Prisma ORM, Zod         |
| Database    | PostgreSQL 16                                   |
| Cache       | Redis 7                                         |
| Proxy       | NGINX 1.25 (Alpine)                             |
| Auth        | JSON Web Tokens (jsonwebtoken), bcryptjs        |
| Metadata    | TMDB API (The Movie Database)                   |
| Container   | Docker, Docker Compose v2                       |

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 24+ with the Compose plugin
- `openssl` (for generating secrets)

### 1 — Clone and configure

```bash
git clone <repo-url> webplayer
cd webplayer
cp .env.example .env
```

Edit `.env` and at minimum replace the three JWT secrets:

```bash
openssl rand -hex 64   # run three times; paste into JWT_SECRET, JWT_REFRESH_SECRET, STREAM_TOKEN_SECRET
```

### 2 — Run the automated setup

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This script:
1. Starts PostgreSQL and Redis and waits for healthy status
2. Applies database migrations (`prisma migrate deploy`)
3. Seeds the admin user and example data
4. Builds and starts the full stack

### 3 — Open the app

| Service       | URL                          |
|---------------|------------------------------|
| Web Player    | http://localhost              |
| API           | http://localhost/api          |
| Frontend      | http://localhost:3000 (direct)|
| Backend       | http://localhost:3001 (direct)|

Login with the credentials set in `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### Development mode (hot-reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Source files are mounted as volumes; Next.js and nodemon reload automatically on save.

---

## Environment Variables

| Variable              | Required | Default                        | Description                                      |
|-----------------------|----------|-------------------------------|--------------------------------------------------|
| `DATABASE_URL`        | Yes      | —                             | PostgreSQL connection string                      |
| `REDIS_URL`           | Yes      | —                             | Redis connection string                           |
| `JWT_SECRET`          | Yes      | —                             | Access token signing secret (min 64 chars)        |
| `JWT_REFRESH_SECRET`  | Yes      | —                             | Refresh token signing secret (min 64 chars)       |
| `STREAM_TOKEN_SECRET` | Yes      | —                             | Short-lived stream token secret (min 64 chars)    |
| `NODE_ENV`            | No       | `development`                 | `development` or `production`                     |
| `PORT`                | No       | `3001`                        | Express listen port                               |
| `FRONTEND_URL`        | No       | `http://localhost:3000`       | Allowed CORS origin for the backend               |
| `NEXT_PUBLIC_API_URL` | No       | `http://localhost/api`        | API base URL used by the Next.js client           |
| `TMDB_API_KEY`        | No       | —                             | TMDB API key for movie/series metadata            |
| `ADMIN_EMAIL`         | No       | `admin@iptv.local`            | Email for the seeded super-admin account          |
| `ADMIN_PASSWORD`      | No       | `Admin@123!`                  | Password for the seeded super-admin account       |
| `POSTGRES_USER`       | No       | `iptv_user`                   | PostgreSQL username                               |
| `POSTGRES_PASSWORD`   | No       | `iptv_password`               | PostgreSQL password                               |
| `POSTGRES_DB`         | No       | `iptv_db`                     | PostgreSQL database name                          |
| `NGINX_HOST`          | No       | `localhost`                   | Public hostname (used in setup script output)     |
| `NGINX_PORT`          | No       | `80`                          | NGINX listen port                                 |

Copy `.env.example` to `.env` to get started. Never commit `.env` to version control.

---

## API Documentation

### Authentication

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| POST   | `/api/auth/register`  | Register a new user account        |
| POST   | `/api/auth/login`     | Login and receive JWT tokens        |
| POST   | `/api/auth/refresh`   | Refresh access token               |
| POST   | `/api/auth/logout`    | Invalidate refresh token           |

### Streams

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/api/streams`              | List all streams (paginated)         |
| GET    | `/api/streams/:id`          | Get stream details                   |
| GET    | `/api/streams/live`         | List live TV channels                |
| GET    | `/api/streams/movies`       | List movies                          |
| GET    | `/api/streams/series`       | List series                          |
| GET    | `/stream/:token/:streamId`  | Proxied stream (requires stream token)|

### Users (Admin)

| Method | Endpoint            | Description                  |
|--------|---------------------|------------------------------|
| GET    | `/api/users`        | List users (admin only)      |
| POST   | `/api/users`        | Create user (admin only)     |
| PUT    | `/api/users/:id`    | Update user                  |
| DELETE | `/api/users/:id`    | Delete user (admin only)     |

### Profiles

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/profiles`                 | List profiles for user   |
| POST   | `/api/profiles`                 | Create profile           |
| PUT    | `/api/profiles/:id`             | Update profile           |
| DELETE | `/api/profiles/:id`             | Delete profile           |

### DNS Providers (Admin)

| Method | Endpoint                    | Description                     |
|--------|-----------------------------|---------------------------------|
| GET    | `/api/providers`            | List DNS providers               |
| POST   | `/api/providers`            | Add DNS provider                 |
| PUT    | `/api/providers/:id`        | Update provider                  |
| DELETE | `/api/providers/:id`        | Remove provider                  |
| POST   | `/api/providers/:id/check`  | Test provider connectivity       |

### Health

| Method | Endpoint    | Description                  |
|--------|-------------|------------------------------|
| GET    | `/api/health` | Service health status       |

---

## Project Structure

```
webplayer/
├── backend/                  # Express API server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.js           # Database seed script
│   ├── src/
│   │   ├── config/           # App, DB, and Redis configuration
│   │   ├── middleware/        # Auth, CORS, rate limiting, error handling
│   │   ├── models/            # Prisma model helpers
│   │   ├── routes/            # Express route handlers
│   │   └── services/          # Business logic (Xtream, proxy, cache, tokens)
│   └── Dockerfile
├── frontend/                 # Next.js web player
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # API clients and utilities
│   ├── store/                # Zustand state stores
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf            # Main NGINX config (rate limits, gzip, upstreams)
│   └── conf.d/
│       └── default.conf      # Server block (HTTP dev + commented HTTPS prod)
├── scripts/
│   ├── setup.sh              # First-run automated setup
│   └── seed.js               # Root-level seed wrapper
├── docker-compose.yml        # Production service definitions
├── docker-compose.dev.yml    # Development overrides (hot-reload)
├── .env.example              # Environment variable template
└── .env                      # Local environment values (not committed)
```

---

## Production Deployment

### Enable HTTPS

1. Obtain a TLS certificate (e.g. via [Let's Encrypt / Certbot](https://certbot.eff.org/))
2. Place `fullchain.pem` and `privkey.pem` in `nginx/ssl/`
3. Uncomment the HTTPS server block in `nginx/conf.d/default.conf`
4. Uncomment the SSL volume mounts in `docker-compose.yml`
5. Restart NGINX: `docker compose restart nginx`

### Scaling

The backend is stateless (sessions stored in Redis) and can be horizontally scaled behind the NGINX upstream pool. Update `nginx/nginx.conf` to add additional `server` entries to the `backend` upstream block.

### Backups

```bash
# Dump PostgreSQL
docker exec iptv_postgres pg_dump -U iptv_user iptv_db > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i iptv_postgres psql -U iptv_user iptv_db < backup_20240101.sql
```

---

## Screenshots

> _Add screenshots of the web player, EPG, admin dashboard, and mobile view here._

---

## License

MIT — see [LICENSE](LICENSE) for details.
