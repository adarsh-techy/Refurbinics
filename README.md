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
