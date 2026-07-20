# Refurbinics

Admin dashboard for a battery repair company. See [spec.md](./spec.md) for functional requirements.

## Stack

- **Frontend**: React, Redux Toolkit, React Router, Tailwind CSS (Vite)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL

## Project structure

```
refurbinics/
├── backend/     Express API (see backend/README.md)
├── frontend/    React admin dashboard (see frontend/README.md)
└── spec.md      Functional spec
```

## Getting started

### 1. Database

Create a local PostgreSQL database matching `backend/.env` (`DB_NAME=refurbinics` by default).

### 2. Backend

```
cd backend
npm install
npm run migrate   # creates tables
npm run dev        # http://localhost:5000
```

### 3. Frontend

```
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Each project has its own `.env` (already populated with local defaults) and `.env.example` as a template.

## Docker

Runs the whole stack (Postgres + backend + frontend + Caddy for automatic HTTPS) in containers — no local Node/Postgres install needed, and no manually-managed TLS certs.

### One-time setup (per server)

```
cp .env.example .env
```

Fill in every value in `.env` — `DOMAIN`/`API_DOMAIN` (point their DNS A records at the server first), `DB_PASSWORD`, `JWT_SECRET`, `CLIENT_URL`, `VITE_API_URL`. Every value is required; the stack refuses to start if any are missing, on purpose — there's no safe default for a database password or a signing secret. `.env` is git-ignored and untouched by `git pull`, so this is a one-time step per server, not a per-deploy one.

### Every deploy after that

```
git pull
docker compose up -d --build
```

- Caddy is the only thing with public ports (`80`/`443`) — it terminates HTTPS with an automatically-issued Let's Encrypt certificate and reverse-proxies `DOMAIN` to the frontend and `API_DOMAIN` to the backend. Postgres, the backend, and the frontend containers publish **no** ports to the host — only reachable from each other over the internal Compose network.
- `VITE_API_URL` is baked into the frontend bundle at *build* time — changing it requires `docker compose build frontend`, and it must be the public URL a browser can reach (`https://api.yourdomain.com/api`), not the internal `backend` service name.
- `CLIENT_URL` must match `DOMAIN`'s public URL, or the API rejects the browser's requests (CORS).
- Migrations run automatically on every backend start (tracked in a `schema_migrations` table, so re-applying is a safe no-op once applied) — no separate migration step to remember.
- Backend and frontend both run as non-root users, have healthchecks, and log with rotation (`max-size: 10m`, `max-file: 3`) so container logs don't fill the disk.
- Local testing without a real domain: set `DOMAIN=localhost:8078` and `API_DOMAIN=localhost:8079` in `.env`, add a temporary `docker-compose.override.yml` publishing those two ports on the `caddy` service, and hit `https://localhost:8078` — Caddy serves a locally-trusted cert for `localhost` automatically. Don't commit that override file.
- Backups aren't automated — `docker compose exec db pg_dump -U postgres refurbinics | gzip > backup-$(date +%F).sql.gz`, ideally on a cron job.
