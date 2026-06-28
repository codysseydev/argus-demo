# Argus UI (Queue Observability)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

The React single-page app for [Argus](https://github.com/codysseydev/argus) queue observability.
It is an internal ops tool for engineering and support: search recorded queue
jobs, replay one job's lifecycle, browse failures grouped by root cause, and
manage saved searches and threshold alert rules.

It talks **only** to the [Phase 4 JSON API](https://github.com/codysseydev/argus-api)
(`codysseydev/argus-api`) over HTTP. It holds no business logic and makes
no storage assumptions: sorting, filtering, and aggregation are the backend's
job; the SPA sends a filter and renders what comes back.

```
components / screens   render only; never fetch directly
        │
TanStack Query hooks   useSearch, useJobHistory, useFailureGroups,
        │               useSavedSearches, useAlertRules (+ mutations)
        │
ArgusApiClient         the one owner of HTTP: URLs, {data,meta} envelope, errors
        │
fetch → /argus-api/…   credentials: 'include' (rides the app's Sanctum session)
```

## Screens

- **Search** (`/search`) — a filter builder (tenant, status, job class, attempt
  range, time window, correlation key+value) mapped 1:1 to the API filter, a
  paginated results table, and rows that link to job history. Filter state lives
  in the URL, so a search is a shareable, refresh-safe link.
- **Job history** (`/jobs/:jobUuid`) — the full ordered transition timeline for
  one job; in-flight jobs (no terminal transition) are visibly distinct from
  completed ones.
- **Failures** (`/failures`) — failure causes grouped by exception fingerprint
  with count and first/last seen. "View jobs" drills into the underlying jobs.
- **Saved searches** (`/saved-searches`, `/saved-searches/:id`) — create / edit /
  delete saved searches, see a saved search's current matches, and attach / edit /
  remove threshold alert rules.

Every screen routes loading, empty, error, **not authorized (403)**, and **not
signed in (401)** through one shared `QueryState`; failed writes surface inline
instead of silently no-op'ing.

### A note on the failures drill-down

The API filter has no fingerprint field, so a drill-down cannot fetch *exactly*
one group's jobs. Instead, clicking a group runs a search for `status=failed`
over that group's time window and **highlights** the rows whose fingerprint
matches (it does not hide the others). This stays honest to "the backend decides
what matches"; the SPA never filters by fingerprint client-side.

## Authentication

The app rides the consuming Laravel app's Sanctum session, same-origin. The API
client sends `credentials: 'include'` and forwards the `XSRF-TOKEN` cookie as
`X-XSRF-TOKEN` on mutating requests. There is **no** login or token flow here;
401/403 responses are shown as UI states.

## Running in dev

```bash
npm install

# Point the dev proxy at the Laravel app that mounts the Phase 4 API routes,
# then start Vite. /argus-api and /sanctum are proxied there so the session
# cookie rides along (same-origin).
ARGUS_API_TARGET=http://localhost:8000 npm run dev
```

Open the printed URL (default `http://localhost:5173`). You must already be
signed in to the surrounding app for requests to authorize.

Configuration (see `.env.example`):

- `VITE_ARGUS_API_BASE` — base path the client prefixes onto every request.
  Defaults to `/argus-api`.
- `ARGUS_API_TARGET` — dev-only proxy target for `/argus-api` and `/sanctum`.

## Building for production

```bash
npm run build      # tsc --noEmit && vite build  →  dist/
npm run preview    # serve the built dist/ locally
```

`dist/` is a static bundle. Serve it from the **same origin** as the Phase 4 API
(e.g. published by the Laravel app, or any static host fronting the same domain)
so the Sanctum session cookie applies. If the API is mounted under a non-default
prefix, set `VITE_ARGUS_API_BASE` at build time.

## Build from source and deploy

1. **Configure the API base URL** via `VITE_ARGUS_API_BASE`. Copy `.env.example`
   to `.env.local` and set the variable, or pass it directly at build time:

   ```bash
   # Default — same-origin with the Laravel app that mounts the Argus API:
   VITE_ARGUS_API_BASE=/argus-api
   ```

   If your Laravel app mounts the Argus API under a custom prefix, update this
   value to match.

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build**:

   ```bash
   npm run build
   ```

   This runs a TypeScript type-check then Vite's production build. Output lands
   in `dist/`.

4. **Serve `dist/`** alongside the Laravel app that mounts the Argus API routes.
   The SPA must be on the **same origin** as the API so the Sanctum session cookie
   applies without CORS. Typical approaches:

   - Have the Laravel app publish the `dist/` contents as its public assets.
   - Use a reverse proxy (nginx, Caddy) that serves `dist/` at `/` and forwards
     `/argus-api` requests to the Laravel app — both on the same domain.

## Testing

```bash
npm test           # vitest run (jsdom)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
```

Tests run against MSW-mocked HTTP, never a live backend. The API client tests
assert request shaping, envelope parsing, and error mapping (401/403/404/422/204/
network); the component tests assert each screen's results / empty / error / 403
states, the job-history timeline (with in-flight jobs distinct), the failures
grouping + drill-down, and saved-search / alert-rule create/edit/delete including
surfaced validation errors.

## Tech

React 18, TypeScript, Vite, React Router v6, TanStack Query v5, Tailwind CSS,
Vitest + React Testing Library + MSW. Server state is configured for freshness
(`staleTime: 0`, refetch on focus, no retries) so an incident never shows stale
job state.

## Docs

- Design spec: `docs/superpowers/specs/2026-05-31-argus-ui-phase5-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-31-argus-ui-phase5.md`
