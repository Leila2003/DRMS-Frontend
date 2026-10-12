# DRMS Frontend

React (Vite + JavaScript + Tailwind CSS) client for the **DRMS-HEXAKOMB** FastAPI
backend. This is a **starter scaffold**: authentication, protected routing, the
app shell, the API client, and one fully wired page (Bookings) are done. The
remaining screens are yours to build.

## Stack

| Concern      | Choice                          |
| ------------ | ------------------------------- |
| Build tool   | Vite 6                          |
| UI           | React 18                        |
| Routing      | react-router-dom 7              |
| HTTP         | axios (`src/lib/api.js`)        |
| Styling      | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Auth         | JWT bearer token in localStorage |

## Getting started

```bash
cd drms-frontend
npm install
cp .env.example .env   # already present; adjust if needed
npm run dev            # http://localhost:5173
```

The backend must be running (default `http://localhost:8000`):

```bash
cd ../DRMS-HEXAKOMB
uvicorn main:app --reload
```

### CORS / the dev proxy

The FastAPI app does **not** enable CORS. To avoid that in development, the Vite
dev server proxies `/api/*` to the backend and strips the `/api` prefix
(`vite.config.js`). All requests go through `VITE_API_BASE_URL`, which defaults
to `/api`.

For a deployed setup, either:

- set `VITE_API_BASE_URL` to the backend's public URL **and** add
  `CORSMiddleware` to `main.py`, or
- serve the built `dist/` behind the same origin / reverse proxy as the API.

## Project layout

```
src/
  lib/
    api.js         axios instance, token storage, 401 handling, error parsing
    format.js      money / date formatting, status badge styles
  context/
    AuthContext.jsx  session state: login, logout, current user (/auth/me)
  hooks/
    useAuth.js      consume AuthContext
  components/
    Layout.jsx        sidebar + nav shell (add nav items here)
    ProtectedRoute.jsx  gate routes by session and optional role
    Spinner.jsx
  pages/
    LoginPage.jsx      POST /auth/login
    DashboardPage.jsx   placeholder + next-steps checklist
    BookingsPage.jsx    GET /bookings — filter, search, pagination (reference impl)
    NotFoundPage.jsx
  App.jsx            route table
  main.jsx           providers (Router, Auth)
```

## Adding a screen

1. Create `src/pages/XPage.jsx`. Call the API with the shared client:
   `import { api } from "../lib/api"` then `await api.get("/customers", { params })`.
2. Register it in `src/App.jsx` inside the protected `<Layout />` route.
3. Add a nav link in `src/components/Layout.jsx` (`NAV_ITEMS`).
4. For platform-only screens, wrap with `<ProtectedRoute roles={["super_admin"]}>`.

## Backend endpoints (from the OpenAPI routes)

- `POST /auth/login`, `GET /auth/me`, `POST /auth/register-business`
- `GET/POST/PUT/PATCH/DELETE /auth/users` (business_admin — staff accounts)
- `GET/POST /bookings`, `GET /bookings/{id}`, `POST /bookings/{id}/return`
- `GET/POST/PUT/DELETE /categories`
- `GET/POST/PUT/DELETE /customers`, `GET /customers/{id}/reputation`,
  `GET /customers/{id}/bookings`
- `GET /notifications`, `POST /notifications/{id}/read`
- `GET /analytics/summary` (business_admin), `GET /analytics/platform` (super_admin)
- `GET /businesses`, `PATCH /businesses/{id}/deactivate|reactivate` (super_admin)

Interactive docs while the backend runs: http://localhost:8000/docs
