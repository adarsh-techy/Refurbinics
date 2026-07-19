# Refurbinics Frontend

React admin dashboard for the battery repair company (see root [../spec.md](../spec.md)).

## Stack

React 19 (Vite), Redux Toolkit, React Router, Tailwind CSS, Axios.

## Folder structure

```
src/
├── app/          Redux store setup
├── components/
│   ├── layout/   Sidebar, Navbar, DashboardLayout
│   └── ui/       Reusable presentational components (DataTable, etc.)
├── features/     One folder per domain area (auth, batteries, repairs, staff,
│                 parts, truck-intake, returns, audit-log, users). Each folder
│                 owns its Redux slice (if any) and page component(s).
├── pages/        Standalone route pages not tied to a feature (404, etc.)
├── routes/       AppRoutes + ProtectedRoute
├── services/     API client (axios instance)
└── utils/        Shared hooks/helpers
```

## Setup

```
npm install
npm run dev       # http://localhost:5173
```

Configure `VITE_API_URL` in `.env.local` to point at the backend API for local dev. Production doesn't
read `.env.production` at all — it's just a documented template; the live value is set as a
`VITE_API_URL` environment variable in the Vercel project dashboard.
