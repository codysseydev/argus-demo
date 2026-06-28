# Architecture

## Layers

```
screens / components       render only; never call the API directly
        |
TanStack Query hooks       src/hooks/  — own query keys, cache invalidation, mutations
        |
ArgusApiClient             src/api/client.ts — one owner of HTTP
        |
fetch -> /argus-api/...    credentials: 'include', XSRF header on mutations
```

Each layer has one job and no knowledge of layers above it.

## API client

`src/api/client.ts` exports two things:

- `ArgusApiClient` — the interface every hook and test depends on
- `createArgusApiClient(opts?)` — the factory that produces a real implementation

The factory reads `VITE_ARGUS_API_BASE` (or falls back to `/argus-api`) from `import.meta.env` at call time. All URL construction, envelope unwrapping, and error mapping happen here.

**Envelope**: every successful response is expected to be `{ data: T, meta?: {...} }`. The `data` field is extracted before returning to the caller. The `search` endpoint also reads `meta.total`, `meta.limit`, and `meta.offset` to return a `SearchResult`.

**Errors**: every non-2xx response is thrown as `ApiError` (`src/api/errors.ts`). The `type` field classifies the failure:

| HTTP status | `ApiError.type` |
|---|---|
| network failure | `'network'` |
| 401 | `'unauthenticated'` |
| 403 | `'forbidden'` |
| 404 | `'not_found'` |
| 422 | `'validation'` |
| other | `'unknown'` or the envelope's `error.type` |

The `validationErrors` getter on `ApiError` returns `details` as `Record<string, string[]>` for 422 failures. `validationErrorsOf(error)` in `errors.ts` is a utility for mutation error handlers that need field errors without re-checking the type.

**XSRF**: `readXsrfCookie()` reads the `XSRF-TOKEN` cookie and the client sets `X-XSRF-TOKEN` on all non-GET/HEAD requests automatically.

**Injection**: `src/hooks/useApiClient.tsx` holds a React context that defaults to `createArgusApiClient()`. Tests inject a mock via `ApiClientProvider`. Hooks always read from `useApiClient()` rather than calling the factory directly.

## TanStack Query configuration

`src/lib/queryClient.ts` creates the `QueryClient` with:

- `staleTime: 0` — every mount and window-focus triggers a refetch
- `refetchOnWindowFocus: true`
- `retry: false` — errors surface immediately; retries would mask API outages

## Hooks

All hooks live in `src/hooks/`. They read the client from `useApiClient()` and wrap TanStack Query.

**Read hooks (queries)**:

| Hook | Query key | Client method |
|---|---|---|
| `useSearch(filter)` | `['search', filter]` | `client.search(filter)` |
| `useJobHistory(jobUuid)` | `['history', jobUuid]` | `client.getJobHistory(jobUuid)` |
| `useFailureGroups(filter)` | `['failures', filter]` | `client.getFailureGroups(filter)` |
| `useSavedSearches()` | `['saved-searches']` | `client.listSavedSearches()` |
| `useSavedSearch(id)` | `['saved-search', id]` | `client.getSavedSearch(id)` |
| `useSavedSearchResults(id)` | `['saved-search-results', id]` | `client.getSavedSearchResults(id)` |
| `useSavedSearchAlertRules(ssid)` | `['alert-rules', ssid]` | `client.listSavedSearchAlertRules(ssid)` |

**Write hooks (mutations)**:

| Hook | Client method | Invalidates |
|---|---|---|
| `useCreateSavedSearch()` | `client.createSavedSearch(input)` | `['saved-searches']` |
| `useUpdateSavedSearch()` | `client.updateSavedSearch(id, input)` | `['saved-searches']`, `['saved-search', id]` |
| `useDeleteSavedSearch()` | `client.deleteSavedSearch(id)` | `['saved-searches']` |
| `useCreateAlertRule(ssid)` | `client.createAlertRule(ssid, input)` | `['alert-rules', ssid]` |
| `useUpdateAlertRule(ssid)` | `client.updateAlertRule(id, input)` | `['alert-rules', ssid]` |
| `useDeleteAlertRule(ssid)` | `client.deleteAlertRule(id)` | `['alert-rules', ssid]` |

## Screens and routing

Routes are defined in `src/App.tsx`. All screens render inside `AppShell` (`src/components/layout/AppShell.tsx`).

| Route | Screen | Data hook(s) |
|---|---|---|
| `/` | redirect to `/search` | — |
| `/search` | `SearchScreen` | `useSearch` |
| `/jobs/:jobUuid` | `JobHistoryScreen` | `useJobHistory` |
| `/failures` | `FailuresScreen` | `useFailureGroups` |
| `/saved-searches` | `SavedSearchesScreen` | `useSavedSearches` |
| `/saved-searches/:id` | `SavedSearchScreen` | `useSavedSearch`, `useSavedSearchResults`, `useSavedSearchAlertRules` |
| `*` | `NotFoundScreen` | — |

Filter state on `SearchScreen` lives in the URL (query params), making searches shareable links that survive a page reload.

## QueryState

`src/components/query/QueryState.tsx` is the single place loading/error/empty/success states are decided. Every screen passes its query result to `QueryState` and provides a render function for the success case. Branch order:

1. `isLoading` -> `LoadingState`
2. `isError` -> `ForbiddenState` | `UnauthenticatedState` | `NotFoundState` | `ErrorState` (based on `ApiError.type`)
3. `data === undefined` -> `LoadingState`
4. `isEmpty(data)` -> `EmptyState`
5. -> `children(data)`

## Types

All API-facing types are in `src/api/types.ts`: `Filter`, `JobSummary`, `TransitionRecord`, `FailureGroup`, `SavedSearch`, `SavedSearchInput`, `AlertRule`, `AlertRuleInput`, `SearchResult`, and the `TransitionType` union.

## Testing approach

Tests mock the API at the network boundary using MSW (`src/test/msw/`). The real typed client runs against mocked HTTP responses, so the client's request shaping and envelope parsing are exercised in tests. Components are never tested with a stub client; they go through the full hook -> client -> MSW path.
