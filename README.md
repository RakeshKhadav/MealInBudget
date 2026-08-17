# MealinBudget

AI-powered weekly meal planning PWA that generates 21 personalized meals within your budget, respecting dietary needs and cooking constraints.

## Monorepo Layout

```
├── frontend/   SvelteKit 5 + Tailwind CSS 4 + daisyUI 5 (PWA)
├── backend/    Express 5 + TypeScript (meal generation API, mock mode)
└── database/   SQL migrations (reference for future cloud phase)
```

## Getting Started

### Backend

```bash
cd backend
npm install
cp .env.example .env.local
npm run dev
```

Runs on http://localhost:3000. Health check: `GET /api/health`.

Mock mode returns a seeded 21-meal plan without any API keys.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173. Point it at the backend via `PUBLIC_API_URL`.

## Testing on your laptop

The app is a PWA and works in any desktop browser:

- **Install**: Chrome/Edge → install icon in the address bar
- **Offline**: DevTools → Network → Offline, then reload
- **Mobile viewport**: DevTools → Device Toolbar (e.g. iPhone 14)

iOS "Add to Home Screen" needs a real device.

> **Windows note:** `npm run build` in `frontend/` uses the Vercel adapter, which creates
> symlinks. If you hit an `EPERM: operation not permitted` error, enable
> **Windows Developer Mode** (Settings → Privacy & Security → For developers) or run the
> terminal as Administrator. For everyday development use `npm run dev` — it needs no build.

### E2E smoke test

With the backend (`:3000`) and frontend dev server (`:5173`) running:

```bash
cd frontend
node mealinbudget-e2e.cjs   # Playwright; requires `npx playwright install chromium` once
```

Covers: generate → meal-plan (meal-type filter, per-day totals, meal modal) → shopping-list
(totals, used-in, download-as-text, checkbox persistence across reload) → dashboard (budget
status, recent plans) → nutrition (goal status, progress bars) → landing redirect. The offline
check is skipped in dev mode because the service worker only exists in a production build; run it
against `npm run preview` (or Vercel) to exercise it.

## API

| Method | Endpoint                          | Description                        |
| ------ | --------------------------------- | ---------------------------------- |
| GET    | /api/health                       | Health check                       |
| POST   | /api/meals/generate               | Generate a 21-meal plan            |
| GET    | /api/meals/recent                 | List recent plans                  |
| GET    | /api/meals/:mealPlanId            | Fetch a single plan                |
| GET    | /api/shopping-list/:mealPlanId    | Shopping list for a plan           |
| GET    | /api/preferences                  | Default preferences                |
| PUT    | /api/preferences                  | Save preferences                   |

## Status

Foundation scaffold. Auth-free and local-first by design; Supabase auth + Postgres are deferred.
