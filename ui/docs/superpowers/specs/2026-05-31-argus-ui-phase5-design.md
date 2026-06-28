# Argus UI (Phase 5) — Design

Status: approved (2026-05-31)
Scope: the React single-page app for the Argus queue-observability tool. Final
phase of five. First phase a human uses through a browser.

## Context

- **Phase 1-3** (`acme/argus`, `../queue-observability`): the core. Records job
  lifecycle transitions into a swappable store, exposes `JobQueryService`,
  `SavedSearchService`, `AlertService`. Ships no HTTP, no UI.
- **Phase 4** (`acme/queue-observability-api`, `../queue-observability-api`): a
  JSON HTTP API over the core. The only thing this UI talks to. Dependency
  direction: `React client -> Phase 4 API -> acme/argus -> storage`.
- **Phase 5** (this, `queue-observability-ui`): a Vite + React + TypeScript SPA.
  Renders, filters via the API, displays. No business logic, no storage
  knowledge. Internal ops tool for engineering + support; clarity and density
  over polish.

## Decisions

- **Location**: standalone Vite app in `queue-observability-ui/` (its own git
  repo, matching the sibling package-per-phase layout).
- **Data layer**: TanStack Query, `staleTime: 0`, `refetchOnWindowFocus`,
  explicit invalidation on mutations. The API is the source of truth; never
  serve stale job state during an incident.
- **Styling**: Tailwind CSS, dense table/timeline layouts.
- **Testing**: Vitest + React Testing Library + MSW (mock the API at the network
  boundary so the real typed client runs against mocked HTTP).
- **Auth**: rides the consuming app's Sanctum session, same-origin. The client
  sends `credentials: 'include'` and forwards the `XSRF-TOKEN` cookie as
  `X-XSRF-TOKEN` on mutating requests. No login or token flow is built. 401/403
  are handled as UI states.

## Phase 4 contract (verified against source, not just the README)

Verified in `ApiResponse.php`, `ForbiddenException`, `NotFoundException`,
`ApiFormRequest`, `FilterRules`, `FilterInput`, the resource presenters, the
controllers, and the core `JobFilter` / `FilterCodec`.

- **Success envelope**: `{ data, meta }`. `meta` is always a JSON object (never
  `[]`). Create → `201`; delete → `204` with a null body; reads/updates → `200`.
- **Error envelope**: `{ error: { type, message, details } }` with
  `type ∈ validation | forbidden | not_found | unauthenticated`. `403` →
  `details.ability`; `422` → `details` is `{ field: string[] }`; `404` → empty
  details.
- **401 is not the package envelope.** It is produced by the app's `auth:sanctum`
  middleware (Laravel's default `{ "message": "Unauthenticated." }`). The client
  branches on HTTP **status** for 401, not on `error.type`.
- **`POST /search` meta** is `{ total, limit, offset }`. `total` is the full
  match count ignoring paging. It is the only meta value not derivable
  client-side, so it is the only one the client surfaces from meta.
- **Filter**: exactly 12 fields (below). `correlationKey`/`correlationValue` are
  `required_with` each other. `limit` defaults to 100, server-clamps to ≤ 500.
- **Gap**: there is no `fingerprint` field in the filter and no jobs-by-
  fingerprint endpoint. `JobFilter` has no such field; `search` accepts only a
  `JobFilter`. This constrains the failures drill-down (see below).

### Endpoints (all under the configured prefix, default `argus-api`)

| Method | Path | Gate | Body | Returns |
|---|---|---|---|---|
| POST | `/search` | view-jobs | Filter | `{ data: JobSummary[], meta: { total, limit, offset } }` |
| GET | `/jobs/{jobUuid}/history` | view-jobs | — | `{ data: TransitionRecord[], meta: { jobUuid, count } }` (404 unknown) |
| POST | `/failures` | view-failures | Filter | `{ data: FailureGroup[], meta: { count } }` |
| GET | `/saved-searches` | manage-saved-searches | — | `{ data: SavedSearch[], meta: { count } }` |
| POST | `/saved-searches` | manage-saved-searches | `{ name, filter }` | `201 { data: SavedSearch }` |
| GET | `/saved-searches/{id}` | manage-saved-searches | — | `{ data: SavedSearch }` (404) |
| PUT | `/saved-searches/{id}` | manage-saved-searches | `{ name, filter }` | `{ data: SavedSearch }` |
| DELETE | `/saved-searches/{id}` | manage-saved-searches | — | `204` |
| GET | `/saved-searches/{id}/results` | view-jobs | — | `{ data: JobSummary[], meta: { savedSearchId, count } }` |
| GET | `/saved-searches/{id}/alert-rules` | manage-alerts | — | `{ data: AlertRule[], meta: { savedSearchId, count } }` |
| POST | `/saved-searches/{id}/alert-rules` | manage-alerts | rule | `201 { data: AlertRule }` (404 if SS unknown) |
| GET | `/alert-rules` | manage-alerts | — | `{ data: AlertRule[], meta: { count } }` |
| GET | `/alert-rules/{id}` | manage-alerts | — | `{ data: AlertRule }` (404) |
| PUT | `/alert-rules/{id}` | manage-alerts | rule | `{ data: AlertRule }` |
| DELETE | `/alert-rules/{id}` | manage-alerts | — | `204` |

Rule body: `{ name, threshold (int≥0), windowSeconds (int≥1), cooldownSeconds (int≥0), sinks: string[], enabled?: boolean }`.

### Types (verbatim from the Phase 4 TypeScript contract)

```ts
type Iso8601 = string;
type TransitionType = "queued" | "processing" | "processed" | "failed" | "released";
type AlertState = "ok" | "breaching";

interface Filter {
  jobClass?: string | null; queue?: string | null; tenantId?: string | null;
  status?: TransitionType | null; attemptMin?: number | null; attemptMax?: number | null;
  since?: Iso8601 | null; until?: Iso8601 | null;
  correlationKey?: string | null; correlationValue?: string | null;
  limit?: number; offset?: number;
}
interface JobSummary { jobUuid: string; jobClass: string; queue: string; tenantId: string | null;
  status: string; attempts: number; dispatchedAt: Iso8601 | null; finishedAt: Iso8601 | null;
  durationMs: number | null; exceptionFingerprint: string | null; inFlight: boolean; }
interface TransitionRecord { jobUuid: string; sequence: number; transition: TransitionType;
  attempt: number; occurredAt: Iso8601; durationMs: number | null;
  exceptionFingerprint: string | null; exceptionMessage: string | null; }
interface FailureGroup { fingerprint: string; representativeMessage: string | null;
  count: number; firstSeen: Iso8601; lastSeen: Iso8601; }
interface SavedSearch { id: string; name: string; filter: Filter; createdAt: Iso8601; updatedAt: Iso8601; }
interface AlertRule { id: string; savedSearchId: string; name: string; threshold: number;
  windowSeconds: number; cooldownSeconds: number; sinks: string[]; enabled: boolean; state: AlertState;
  lastNotifiedAt: Iso8601 | null; lastResultCount: number | null; lastEvaluatedAt: Iso8601 | null;
  createdAt: Iso8601; updatedAt: Iso8601; }
```

## Architecture

```
components / screens   (render only; never fetch directly)
        |
TanStack Query hooks   (useSearch, useJobHistory, useFailureGroups,
        |               useSavedSearches, useAlertRules, mutations)
        |
ArgusApiClient         (THE one owner of HTTP: URLs, envelope unwrap, error mapping)
        |
fetch -> /argus-api/...  (credentials: 'include', Sanctum session)
```

Dependency rule, enforced by structure: components import hooks; hooks import the
client; only the client imports `fetch` and knows envelope/URL/error shapes.

### API client

- `ArgusApiClient` interface with the method signatures below. A single
  `createArgusApiClient({ baseUrl, fetch })` factory builds the live impl. Base
  URL: `import.meta.env.VITE_ARGUS_API_BASE ?? '/argus-api'`.
- One private `request<T>()` core: sets headers (`Accept: application/json`,
  `Content-Type: application/json` on bodies, `X-XSRF-TOKEN` from cookie on
  mutations), `credentials: 'include'`; unwraps `{ data, meta }`; maps non-2xx to
  `ApiError`; returns `void` for 204.
- `ApiError(status, type, message, details)` with `isForbidden` (403),
  `isUnauthenticated` (401, status-based), `isNotFound` (404), and
  `validationErrors` (422 `details`). `network`/`unknown` for transport/parse
  failures.

```ts
interface ArgusApiClient {
  search(filter: Filter): Promise<{ jobs: JobSummary[]; total: number; limit: number; offset: number }>;
  getJobHistory(jobUuid: string): Promise<TransitionRecord[]>;
  getFailureGroups(filter: Filter): Promise<FailureGroup[]>;
  listSavedSearches(): Promise<SavedSearch[]>;
  createSavedSearch(input: { name: string; filter: Filter }): Promise<SavedSearch>;
  getSavedSearch(id: string): Promise<SavedSearch>;
  updateSavedSearch(id: string, input: { name: string; filter: Filter }): Promise<SavedSearch>;
  deleteSavedSearch(id: string): Promise<void>;
  getSavedSearchResults(id: string): Promise<JobSummary[]>;
  listAlertRules(): Promise<AlertRule[]>;
  listSavedSearchAlertRules(savedSearchId: string): Promise<AlertRule[]>;
  createAlertRule(savedSearchId: string, input: AlertRuleInput): Promise<AlertRule>;
  getAlertRule(id: string): Promise<AlertRule>;
  updateAlertRule(id: string, input: AlertRuleInput): Promise<AlertRule>;
  deleteAlertRule(id: string): Promise<void>;
}
interface AlertRuleInput { name: string; threshold: number; windowSeconds: number;
  cooldownSeconds: number; sinks: string[]; enabled?: boolean; }
```

Only `search` returns meta (`total` drives pagination); every other meta is
derivable from the array, so those return the plain typed payload.

### Routes

```
/                    -> redirect to /search
/search              -> SearchScreen      (filter state in URL query params)
/jobs/:jobUuid       -> JobHistoryScreen   (transition timeline)
/failures            -> FailuresScreen      (fingerprint groups; filter in URL params)
/saved-searches      -> SavedSearchesScreen (list; create from current filter; delete)
/saved-searches/:id  -> SavedSearchScreen   (edit filter + manage that search's alert rules)
*                    -> NotFoundScreen
```

Filters serialize to the URL query string: shareable, refresh-safe, and the URL
params *are* the API `Filter` (no separate client filter shape).

### Filter builder -> API filter mapping

The form state **is** a partial `Filter`. `buildFilter()` only strips blanks and
computes `offset`; it never reshapes.

| UI control | `Filter` key | Notes |
|---|---|---|
| Tenant | `tenantId` | omit when blank |
| Status ("Any" = omit) | `status` | enum select |
| Job class | `jobClass` | omit when blank |
| Attempts min / max | `attemptMin` / `attemptMax` | int ≥ 0; client guards `min ≤ max` |
| Time window from / to (quick-picks 15m/1h/24h/7d) | `since` / `until` | absolute ISO-8601; client guards `since ≤ until` |
| Correlation key + value | `correlationKey` + `correlationValue` | both-or-neither (mirrors server `required_with`) |
| Page size | `limit` | default 100; server clamps ≤ 500 |
| Page | `offset` | computed `page * limit` |

Client guards (`min ≤ max`, `since ≤ until`, correlation both-or-neither) mirror
server intent and fail fast (the API path bypasses the core `FilterBuilder`'s
ordering checks, so a bad range would otherwise silently return nothing). Blank
fields are omitted so a filter round-trips cleanly through saved-search storage.
`since`/`until` are absolute timestamps, so a saved search stores an absolute
window; operators can omit the window for "all time" (subject to retention), and
for alert rules the stored window is irrelevant (the evaluator overrides it via
`windowSeconds`).

### Failures drill-down (the one judgment call)

The API cannot filter by fingerprint. Clicking a failure group navigates to
`/search?status=failed&since=<firstSeen>&until=<lastSeen>&fp=<fingerprint>`. The
SearchScreen sends only valid `Filter` fields (`status`, `since`, `until`) to the
API and uses `fp` purely to **highlight** rows whose `exceptionFingerprint`
matches (presentation, not filtering — no rows hidden). Reuses the results table;
rows link to job history. Client-side filtering to exactly the group's jobs would
violate "filtering is the backend's job" and is not done.

## Cross-cutting UI states

A single `<QueryState>` wrapper renders, consistently across every screen, from a
TanStack Query result:

- **loading** — skeleton/spinner that resolves.
- **error** (network/unknown/5xx) — message + retry.
- **forbidden** (403, `ApiError.isForbidden`) — "Not authorized" panel.
- **unauthenticated** (401, `ApiError.isUnauthenticated`) — "Not signed in /
  session expired" panel.
- **empty** (`data` is `[]`) — distinct empty state, never a stuck spinner.
- **success** — render children with data.

## Screens

- **SearchScreen**: `FilterBuilder` + paginated `ResultsTable`. Reads/writes
  filter from URL params. Rows link to `/jobs/:jobUuid`. Shows `total` from meta
  for pagination. In-flight rows marked. Honors `fp` highlight param.
- **JobHistoryScreen**: `Timeline` of `TransitionRecord[]` ascending by sequence.
  In-flight job (no terminal `processed`/`failed`) visibly distinct from
  completed. 404 -> not-found state.
- **FailuresScreen**: `FilterBuilder` (time window + criteria) + grouped failure
  list (fingerprint, representative message, count, first/last seen). Each group
  drills down per the rule above.
- **SavedSearchesScreen**: list saved searches; create from the current filter;
  delete. Each links to its detail.
- **SavedSearchScreen**: edit name + filter (`FilterBuilder`), re-run via
  `/results` into the `ResultsTable`, and manage that search's alert rules
  (attach/edit/remove). Shows each rule's `state`, `lastResultCount`,
  `lastEvaluatedAt`.

## Components (shared)

`AppShell`/`Nav`, `QueryState`, `FilterBuilder`, `ResultsTable`, `Timeline`,
`Pagination`, `StatusBadge`, `AlertRuleForm`/`AlertRuleList`,
`SavedSearchForm`. `FilterBuilder` and `ResultsTable` are shared by Search and
Failures-drilldown.

## File layout

```
queue-observability-ui/
  package.json  tsconfig.json  vite.config.ts  tailwind.config.js  postcss.config.js
  index.html  .env.example  README.md  .gitignore
  src/
    main.tsx                 (Router + QueryClientProvider + ErrorBoundary)
    App.tsx / routes.tsx
    api/ types.ts  errors.ts  client.ts  filter.ts
    hooks/ useSearch.ts useJobHistory.ts useFailureGroups.ts useSavedSearches.ts useAlertRules.ts
    components/ layout/ query/ FilterBuilder.tsx ResultsTable.tsx Timeline.tsx ...
    screens/ SearchScreen.tsx JobHistoryScreen.tsx FailuresScreen.tsx
             SavedSearchesScreen.tsx SavedSearchScreen.tsx NotFoundScreen.tsx
    test/ setup.ts  msw/handlers.ts  fixtures.ts
```

## Testing

Vitest + RTL + MSW. Mock at the network boundary; no live backend.

- **API client**: request shaping matches the contract (URLs, methods, bodies,
  omitted blanks, XSRF header on mutations); envelope parsing into typed models;
  error mapping for 401, 403, 404, 422 (`validationErrors`), 204 (void), 5xx,
  network.
- **SearchScreen**: renders results from a mocked response; empty state on
  `data: []`; error state on 500; forbidden state on 403.
- **JobHistoryScreen**: renders an ordered timeline; marks an in-flight job
  visibly distinct.
- **FailuresScreen**: groups failures; drill-down navigates and shows the results
  table.
- **FilterBuilder**: maps controls to the API filter (correlation both-or-
  neither, blanks omitted, range guards).

## Deliverables

Vite-built/served React app; the four screen areas plus saved-search/alert
management; the typed API client; loading/empty/error states throughout; passing
tests; README section on dev and production build.

## Non-goals

No authentication/login/token flow. No business logic (sorting/filtering/
aggregation are the backend's). No storage assumptions. No aggressive caching.
```
