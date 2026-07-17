# Refurbinics Backend

Express API for the battery repair admin dashboard (see root [../spec.md](../spec.md)).

## Folder structure

```
src/
├── config/       env.js (loads .env), db.js (PostgreSQL pool)
├── db/
│   ├── migrations/   Numbered .sql files, applied in order
│   └── migrate.js    Migration runner (tracks applied files in schema_migrations)
├── middlewares/  auth.js (JWT + role checks), error-handler.js
├── models/       One file per table — raw SQL queries, no ORM
├── controllers/  Request handlers, one file per resource
├── routes/       Express routers, one file per resource, mounted in routes/index.js
├── app.js        Express app (middleware + route wiring)
└── server.js     Entry point (starts the HTTP server)
```

Naming convention: `<resource>.<layer>.js` (e.g. `battery.model.js`, `battery.controller.js`),
kept 1:1 with routes so any endpoint is easy to trace from route -> controller -> model.

## Setup

```
npm install
npm run migrate   # applies SQL files in src/db/migrations
npm run dev        # http://localhost:5000 (nodemon)
```

Configure PostgreSQL connection and `JWT_SECRET` in `.env` (see `.env.example`).

## API

All routes are mounted under `/api` (e.g. `POST /api/auth/login`). See `src/routes/index.js`
for the full list of resources: auth, users, staff, truck-intakes, batteries, parts, repairs,
returns, audit-logs.
