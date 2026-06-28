# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-28

### Added

- Initial public release of Argus UI, a React SPA for queue observability.
- **Search screen** (`/search`): filter builder (tenant, status, job class, attempt
  range, time window, correlation key+value) with paginated results; filter state
  lives in the URL so every search is a shareable, refresh-safe link.
- **Job history screen** (`/jobs/:jobUuid`): ordered transition timeline for a
  single job; in-flight jobs (no terminal transition) are visually distinct from
  completed ones.
- **Failures screen** (`/failures`): failure causes grouped by exception fingerprint
  with count and first/last-seen; "View jobs" drills into the underlying search.
- **Saved searches** (`/saved-searches`, `/saved-searches/:id`): create, edit, and
  delete saved searches; view a saved search's current matches; attach, edit, and
  remove threshold alert rules per saved search.
- All screens share a single `QueryState` component handling loading, empty, error,
  401 (not signed in), and 403 (not authorized) states; failed writes surface
  inline rather than silently no-op'ing.
- `ArgusApiClient`: single HTTP owner; handles `{data,meta}` envelope parsing,
  XSRF token forwarding, and maps 401/403/404/422/204/network errors to typed
  exceptions.
- TanStack Query hooks (`useSearch`, `useJobHistory`, `useFailureGroups`,
  `useSavedSearches`, `useAlertRules`) keep server state fresh (`staleTime: 0`,
  refetch on focus, no retries).
- Vite dev proxy for `/argus-api` and `/sanctum` via `ARGUS_API_TARGET`; production
  bundle configured via `VITE_ARGUS_API_BASE`.
- Vitest + React Testing Library + MSW test suite covering the API client (request
  shaping, envelope parsing, error mapping) and every screen state (results, empty,
  error, 401, 403), plus job-history timeline, failures grouping/drill-down, and
  saved-search/alert-rule CRUD with surfaced validation errors.

[Unreleased]: https://github.com/codysseydev/argus-ui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/codysseydev/argus-ui/releases/tag/v0.1.0
