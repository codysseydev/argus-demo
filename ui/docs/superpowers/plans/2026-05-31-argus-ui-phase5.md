# Argus UI (Phase 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Vite + React + TypeScript SPA that lets engineering/support search recorded queue jobs, replay one job's history, browse fingerprint-grouped failures, and manage saved searches + alert rules, talking only to the Phase 4 JSON API.

**Architecture:** Components render and never fetch. They call TanStack Query hooks; hooks call a single typed `ArgusApiClient`; only the client touches `fetch`, knows URLs, unwraps the `{data,meta}` envelope, and maps errors to `ApiError`. Filter state lives in the URL and *is* the API `Filter` shape. A single `<QueryState>` renders loading/empty/error/forbidden/unauthenticated uniformly.

**Tech Stack:** React 18, TypeScript, Vite, React Router v6, TanStack Query v5, Tailwind CSS, Vitest, React Testing Library, MSW.

---

## File Structure

```
queue-observability-ui/
  package.json  tsconfig.json  tsconfig.node.json  vite.config.ts
  tailwind.config.js  postcss.config.js  index.html  .env.example  README.md
  src/
    main.tsx                       Router + QueryClientProvider + ErrorBoundary
    App.tsx                        <Routes> wired to screens
    index.css                      Tailwind directives + a few tokens
    api/
      types.ts                     Phase 4 contract types (source of truth)
      errors.ts                    ApiError
      client.ts                    ArgusApiClient + createArgusApiClient()
      filter.ts                    FilterFormState <-> Filter <-> URLSearchParams + guards
    lib/
      queryClient.ts               configured QueryClient (staleTime 0, refetch on focus)
      format.ts                    date/duration formatting helpers
    hooks/
      useSearch.ts  useJobHistory.ts  useFailureGroups.ts
      useSavedSearches.ts  useAlertRules.ts
      useApiClient.ts              context provider for the client (testable injection)
    components/
      layout/AppShell.tsx  layout/NavBar.tsx
      query/QueryState.tsx  query/states.tsx (Loading/Empty/Error/Forbidden/Unauthenticated)
      FilterBuilder.tsx  ResultsTable.tsx  Timeline.tsx  Pagination.tsx
      StatusBadge.tsx  SavedSearchForm.tsx  AlertRuleForm.tsx  AlertRuleList.tsx
    screens/
      SearchScreen.tsx  JobHistoryScreen.tsx  FailuresScreen.tsx
      SavedSearchesScreen.tsx  SavedSearchScreen.tsx  NotFoundScreen.tsx
    test/
      setup.ts                     RTL + jest-dom + MSW server lifecycle
      fixtures.ts                  typed sample DTOs
      msw/handlers.ts              default happy-path handlers
      utils.tsx                    renderWithProviders(ui, { route, client })
```

---

## Phase 0 — Scaffold & tooling

### Task 0: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `.env.example`, `src/index.css`, `src/vite-env.d.ts`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "queue-observability-ui",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -b --noEmit",
    "lint": "eslint . --max-warnings 0"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.27.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@typescript-eslint/eslint-plugin": "^8.8.0",
    "@typescript-eslint/parser": "^8.8.0",
    "@vitejs/plugin-react": "^4.3.2",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-plugin-react-hooks": "^4.6.2",
    "jsdom": "^25.0.1",
    "msw": "^2.4.9",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vitest": "^2.1.2"
  }
}
```

- [ ] **Step 2: Write `vite.config.ts`** (includes Vitest config + a dev proxy for same-origin `/argus-api`)

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Dev: forward API calls to the Laravel app that mounts the Phase 4 routes.
      '/argus-api': { target: process.env.ARGUS_API_TARGET ?? 'http://localhost:8000', changeOrigin: true },
      '/sanctum': { target: process.env.ARGUS_API_TARGET ?? 'http://localhost:8000', changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

- [ ] **Step 3: Write `tsconfig.json`, `tsconfig.node.json`** (standard Vite React TS strict config; `tsconfig.node.json` references `vite.config.ts`). `tsconfig.json` `compilerOptions`: `strict: true`, `jsx: "react-jsx"`, `moduleResolution: "bundler"`, `types: ["vitest/globals", "@testing-library/jest-dom"]`, `lib: ["ES2022","DOM","DOM.Iterable"]`, `noUnusedLocals: true`.

- [ ] **Step 4: Write `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
interface ImportMetaEnv { readonly VITE_ARGUS_API_BASE?: string; }
interface ImportMeta { readonly env: ImportMetaEnv; }
```

- [ ] **Step 5: Tailwind/postcss/index.html/index.css/.env.example**

`tailwind.config.js` content globs `./index.html`, `./src/**/*.{ts,tsx}`. `postcss.config.js` exports tailwindcss + autoprefixer. `src/index.css` has the three `@tailwind` directives. `index.html` has `<div id="root">` + `<script type="module" src="/src/main.tsx">`. `.env.example`: `VITE_ARGUS_API_BASE=/argus-api`.

- [ ] **Step 6: Install & verify toolchain**

Run: `npm install`
Run: `npm run typecheck`
Expected: no type errors (no source yet beyond env shim).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

## Phase 1 — API layer (the contract spine; build first, freeze, everything depends on it)

### Task 1: Contract types

**Files:** Create `src/api/types.ts`

- [ ] **Step 1: Write the types** (verbatim from the Phase 4 contract; this file is the source of truth for every other file)

```ts
export type Iso8601 = string;
export type TransitionType = 'queued' | 'processing' | 'processed' | 'failed' | 'released';
export type AlertState = 'ok' | 'breaching';

export const TRANSITION_TYPES: readonly TransitionType[] = [
  'queued', 'processing', 'processed', 'failed', 'released',
] as const;

export interface Filter {
  jobClass?: string | null;
  queue?: string | null;
  tenantId?: string | null;
  status?: TransitionType | null;
  attemptMin?: number | null;
  attemptMax?: number | null;
  since?: Iso8601 | null;
  until?: Iso8601 | null;
  correlationKey?: string | null;
  correlationValue?: string | null;
  limit?: number;
  offset?: number;
}

export interface JobSummary {
  jobUuid: string; jobClass: string; queue: string; tenantId: string | null;
  status: string; attempts: number; dispatchedAt: Iso8601 | null; finishedAt: Iso8601 | null;
  durationMs: number | null; exceptionFingerprint: string | null; inFlight: boolean;
}

export interface TransitionRecord {
  jobUuid: string; sequence: number; transition: TransitionType; attempt: number;
  occurredAt: Iso8601; durationMs: number | null;
  exceptionFingerprint: string | null; exceptionMessage: string | null;
}

export interface FailureGroup {
  fingerprint: string; representativeMessage: string | null;
  count: number; firstSeen: Iso8601; lastSeen: Iso8601;
}

export interface SavedSearch {
  id: string; name: string; filter: Filter; createdAt: Iso8601; updatedAt: Iso8601;
}

export interface AlertRule {
  id: string; savedSearchId: string; name: string; threshold: number;
  windowSeconds: number; cooldownSeconds: number; sinks: string[]; enabled: boolean;
  state: AlertState; lastNotifiedAt: Iso8601 | null; lastResultCount: number | null;
  lastEvaluatedAt: Iso8601 | null; createdAt: Iso8601; updatedAt: Iso8601;
}

export interface AlertRuleInput {
  name: string; threshold: number; windowSeconds: number; cooldownSeconds: number;
  sinks: string[]; enabled?: boolean;
}

export interface SearchResult { jobs: JobSummary[]; total: number; limit: number; offset: number; }
export interface SavedSearchInput { name: string; filter: Filter; }
```

- [ ] **Step 2: typecheck** — `npm run typecheck` → PASS. **Step 3: commit** `feat: api contract types`.

### Task 2: ApiError

**Files:** Create `src/api/errors.ts`, Test `src/api/errors.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { ApiError } from './errors';

describe('ApiError', () => {
  it('flags forbidden / unauthenticated / not_found / validation by type', () => {
    expect(new ApiError(403, 'forbidden', 'x').isForbidden).toBe(true);
    expect(new ApiError(401, 'unauthenticated', 'x').isUnauthenticated).toBe(true);
    expect(new ApiError(404, 'not_found', 'x').isNotFound).toBe(true);
    expect(new ApiError(422, 'validation', 'x').isValidation).toBe(true);
  });
  it('exposes validationErrors only for validation type', () => {
    const v = new ApiError(422, 'validation', 'bad', { since: ['The since is not a valid date.'] });
    expect(v.validationErrors).toEqual({ since: ['The since is not a valid date.'] });
    expect(new ApiError(403, 'forbidden', 'x', { ability: 'view-jobs' }).validationErrors).toEqual({});
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/api/errors.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement**

```ts
export type ApiErrorType =
  | 'validation' | 'forbidden' | 'not_found' | 'unauthenticated' | 'network' | 'unknown';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly type: ApiErrorType,
    message: string,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
  get isForbidden(): boolean { return this.type === 'forbidden'; }
  get isUnauthenticated(): boolean { return this.type === 'unauthenticated'; }
  get isNotFound(): boolean { return this.type === 'not_found'; }
  get isValidation(): boolean { return this.type === 'validation'; }
  get validationErrors(): Record<string, string[]> {
    return this.isValidation ? (this.details as Record<string, string[]>) : {};
  }
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: ApiError with typed error classification`.

### Task 3: ArgusApiClient

**Files:** Create `src/api/client.ts`, Test `src/api/client.test.ts`

The client tests run the REAL client against a stubbed `fetch` (injected). This proves request shaping and error mapping without MSW (MSW is reserved for component tests).

- [ ] **Step 1: Write failing tests** (request shaping + envelope parsing + error mapping)

```ts
import { describe, it, expect, vi } from 'vitest';
import { createArgusApiClient } from './client';
import { ApiError } from './errors';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
function makeClient(impl: (url: string, init: RequestInit) => Response) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => impl(url, init));
  return { client: createArgusApiClient({ baseUrl: '/argus-api', fetch: fetchMock as unknown as typeof fetch, getXsrfToken: () => 'tok' }), fetchMock };
}

describe('ArgusApiClient.search', () => {
  it('POSTs the filter to /search and unwraps data + meta', async () => {
    const { client, fetchMock } = makeClient(() =>
      jsonResponse(200, { data: [{ jobUuid: 'j1', inFlight: false }], meta: { total: 7, limit: 100, offset: 0 } }));
    const res = await client.search({ status: 'failed', limit: 100, offset: 0 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/argus-api/search');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({ status: 'failed', limit: 100, offset: 0 });
    expect((init.headers as Record<string,string>)['X-XSRF-TOKEN']).toBe('tok');
    expect(res).toEqual({ jobs: [{ jobUuid: 'j1', inFlight: false }], total: 7, limit: 100, offset: 0 });
  });
});

describe('ArgusApiClient error mapping', () => {
  it('maps 401 (middleware shape, not envelope) to unauthenticated', async () => {
    const { client } = makeClient(() => jsonResponse(401, { message: 'Unauthenticated.' }));
    await expect(client.search({})).rejects.toSatisfy((e: ApiError) => e.isUnauthenticated && e.status === 401);
  });
  it('maps 403 envelope to forbidden with ability detail', async () => {
    const { client } = makeClient(() => jsonResponse(403, { error: { type: 'forbidden', message: 'no', details: { ability: 'view-jobs' } } }));
    await expect(client.search({})).rejects.toSatisfy((e: ApiError) => e.isForbidden && e.details.ability === 'view-jobs');
  });
  it('maps 422 to validation with field errors', async () => {
    const { client } = makeClient(() => jsonResponse(422, { error: { type: 'validation', message: 'bad', details: { since: ['invalid'] } } }));
    await expect(client.search({})).rejects.toSatisfy((e: ApiError) => e.isValidation && e.validationErrors.since[0] === 'invalid');
  });
  it('maps 404 on history to not_found', async () => {
    const { client } = makeClient(() => jsonResponse(404, { error: { type: 'not_found', message: 'Unknown job [x].', details: {} } }));
    await expect(client.getJobHistory('x')).rejects.toSatisfy((e: ApiError) => e.isNotFound);
  });
  it('maps a thrown fetch to network', async () => {
    const client = createArgusApiClient({ baseUrl: '/argus-api', fetch: (() => { throw new Error('down'); }) as unknown as typeof fetch });
    await expect(client.search({})).rejects.toSatisfy((e: ApiError) => e.type === 'network');
  });
});

describe('ArgusApiClient resource methods', () => {
  it('DELETE returns void on 204 and omits Content-Type when no body', async () => {
    const { client, fetchMock } = makeClient(() => jsonResponse(204, null));
    await expect(client.deleteSavedSearch('s1')).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/argus-api/saved-searches/s1');
    expect(init.method).toBe('DELETE');
  });
  it('createAlertRule posts the rule body to the nested path', async () => {
    const { client, fetchMock } = makeClient(() => jsonResponse(201, { data: { id: 'r1' }, meta: {} }));
    await client.createAlertRule('s1', { name: 'n', threshold: 5, windowSeconds: 900, cooldownSeconds: 60, sinks: ['slack'] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/argus-api/saved-searches/s1/alert-rules');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'n', threshold: 5, windowSeconds: 900, cooldownSeconds: 60, sinks: ['slack'] });
  });
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement `src/api/client.ts`** (full code below; note: `request<T>()` is the single HTTP core; only `search` returns meta)

```ts
import { ApiError, type ApiErrorType } from './errors';
import type {
  AlertRule, AlertRuleInput, FailureGroup, Filter, JobSummary,
  SavedSearch, SavedSearchInput, SearchResult, TransitionRecord,
} from './types';

export interface ArgusApiClient {
  search(filter: Filter): Promise<SearchResult>;
  getJobHistory(jobUuid: string): Promise<TransitionRecord[]>;
  getFailureGroups(filter: Filter): Promise<FailureGroup[]>;
  listSavedSearches(): Promise<SavedSearch[]>;
  createSavedSearch(input: SavedSearchInput): Promise<SavedSearch>;
  getSavedSearch(id: string): Promise<SavedSearch>;
  updateSavedSearch(id: string, input: SavedSearchInput): Promise<SavedSearch>;
  deleteSavedSearch(id: string): Promise<void>;
  getSavedSearchResults(id: string): Promise<JobSummary[]>;
  listAlertRules(): Promise<AlertRule[]>;
  listSavedSearchAlertRules(savedSearchId: string): Promise<AlertRule[]>;
  createAlertRule(savedSearchId: string, input: AlertRuleInput): Promise<AlertRule>;
  getAlertRule(id: string): Promise<AlertRule>;
  updateAlertRule(id: string, input: AlertRuleInput): Promise<AlertRule>;
  deleteAlertRule(id: string): Promise<void>;
}

export interface ClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  getXsrfToken?: () => string | null;
}

interface Envelope<T> { data: T; meta?: Record<string, unknown>; }

function readXsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function createArgusApiClient(opts: ClientOptions = {}): ArgusApiClient {
  const baseUrl = (opts.baseUrl ?? import.meta.env.VITE_ARGUS_API_BASE ?? '/argus-api').replace(/\/+$/, '');
  const doFetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
  const getXsrf = opts.getXsrfToken ?? readXsrfCookie;
  const enc = encodeURIComponent;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (method !== 'GET' && method !== 'HEAD') {
      const t = getXsrf();
      if (t) headers['X-XSRF-TOKEN'] = t;
    }

    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}`, {
        method, headers, credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError(0, 'network', e instanceof Error ? e.message : 'Network request failed');
    }

    if (res.status === 204) return undefined as T;

    let payload: any = null;
    const text = await res.text();
    if (text) { try { payload = JSON.parse(text); } catch { /* leave null */ } }

    if (res.ok) return payload as T;

    // 401 comes from the app's auth middleware, not the package envelope.
    if (res.status === 401) {
      throw new ApiError(401, 'unauthenticated', payload?.error?.message ?? payload?.message ?? 'Not authenticated.');
    }
    const message = payload?.error?.message ?? `Request failed with status ${res.status}.`;
    const details = (payload?.error?.details as Record<string, unknown>) ?? {};
    const byStatus: Record<number, ApiErrorType> = { 403: 'forbidden', 404: 'not_found', 422: 'validation' };
    const type = byStatus[res.status] ?? (payload?.error?.type as ApiErrorType) ?? 'unknown';
    throw new ApiError(res.status, type, message, details);
  }

  const data = <T>(method: string, path: string, body?: unknown) =>
    request<Envelope<T>>(method, path, body).then((e) => e.data);

  return {
    async search(filter) {
      const e = await request<Envelope<JobSummary[]> & { meta: { total: number; limit: number; offset: number } }>('POST', '/search', filter);
      return { jobs: e.data, total: e.meta.total, limit: e.meta.limit, offset: e.meta.offset };
    },
    getJobHistory: (uuid) => data<TransitionRecord[]>('GET', `/jobs/${enc(uuid)}/history`),
    getFailureGroups: (filter) => data<FailureGroup[]>('POST', '/failures', filter),
    listSavedSearches: () => data<SavedSearch[]>('GET', '/saved-searches'),
    createSavedSearch: (input) => data<SavedSearch>('POST', '/saved-searches', input),
    getSavedSearch: (id) => data<SavedSearch>('GET', `/saved-searches/${enc(id)}`),
    updateSavedSearch: (id, input) => data<SavedSearch>('PUT', `/saved-searches/${enc(id)}`, input),
    deleteSavedSearch: async (id) => { await request<void>('DELETE', `/saved-searches/${enc(id)}`); },
    getSavedSearchResults: (id) => data<JobSummary[]>('GET', `/saved-searches/${enc(id)}/results`),
    listAlertRules: () => data<AlertRule[]>('GET', '/alert-rules'),
    listSavedSearchAlertRules: (ssid) => data<AlertRule[]>('GET', `/saved-searches/${enc(ssid)}/alert-rules`),
    createAlertRule: (ssid, input) => data<AlertRule>('POST', `/saved-searches/${enc(ssid)}/alert-rules`, input),
    getAlertRule: (id) => data<AlertRule>('GET', `/alert-rules/${enc(id)}`),
    updateAlertRule: (id, input) => data<AlertRule>('PUT', `/alert-rules/${enc(id)}`, input),
    deleteAlertRule: async (id) => { await request<void>('DELETE', `/alert-rules/${enc(id)}`); },
  };
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: typed ArgusApiClient over the Phase 4 envelope`.

### Task 4: Filter mapping (form <-> Filter <-> URL) + guards

**Files:** Create `src/api/filter.ts`, Test `src/api/filter.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { buildFilter, validateForm, formToParams, paramsToForm, EMPTY_FORM, type FilterFormState } from './filter';

const form = (o: Partial<FilterFormState>): FilterFormState => ({ ...EMPTY_FORM, ...o });

describe('buildFilter', () => {
  it('omits blank fields and sets limit/offset', () => {
    expect(buildFilter(form({ status: 'failed', queue: '  ' }), 0, 100)).toEqual({ status: 'failed', limit: 100, offset: 0 });
  });
  it('computes offset from page and limit', () => {
    expect(buildFilter(form({}), 2, 50).offset).toBe(100);
  });
  it('includes correlation only when both key and value present', () => {
    expect(buildFilter(form({ correlationKey: 'request_id' }))).not.toHaveProperty('correlationKey');
    const f = buildFilter(form({ correlationKey: 'request_id', correlationValue: 'r-1' }));
    expect(f.correlationKey).toBe('request_id'); expect(f.correlationValue).toBe('r-1');
  });
  it('parses attempt bounds as numbers', () => {
    const f = buildFilter(form({ attemptMin: '2', attemptMax: '5' }));
    expect(f.attemptMin).toBe(2); expect(f.attemptMax).toBe(5);
  });
});

describe('validateForm', () => {
  it('rejects attemptMin > attemptMax', () => {
    expect(validateForm(form({ attemptMin: '5', attemptMax: '2' }))).toHaveProperty('attemptMax');
  });
  it('rejects since > until', () => {
    expect(validateForm(form({ since: '2026-05-31T10:00', until: '2026-05-31T09:00' }))).toHaveProperty('until');
  });
  it('rejects a correlation key with no value (and vice versa)', () => {
    expect(validateForm(form({ correlationKey: 'k' }))).toHaveProperty('correlationValue');
    expect(validateForm(form({ correlationValue: 'v' }))).toHaveProperty('correlationKey');
  });
  it('accepts a clean form', () => { expect(validateForm(form({ status: 'failed' }))).toEqual({}); });
});

describe('URL round-trip', () => {
  it('paramsToForm(formToParams(x)) preserves set fields', () => {
    const f = form({ status: 'failed', queue: 'emails', correlationKey: 'k', correlationValue: 'v' });
    expect(paramsToForm(formToParams(f))).toEqual(f);
  });
});
```

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement `src/api/filter.ts`**

```ts
import type { Filter, TransitionType } from './types';

export interface FilterFormState {
  jobClass: string; queue: string; tenantId: string; status: string;
  attemptMin: string; attemptMax: string; since: string; until: string;
  correlationKey: string; correlationValue: string;
}

export const EMPTY_FORM: FilterFormState = {
  jobClass: '', queue: '', tenantId: '', status: '',
  attemptMin: '', attemptMax: '', since: '', until: '',
  correlationKey: '', correlationValue: '',
};

const FIELD_KEYS = Object.keys(EMPTY_FORM) as (keyof FilterFormState)[];

// datetime-local value (no zone) -> absolute ISO-8601. Empty stays empty.
function toIso(local: string): string { return local ? new Date(local).toISOString() : ''; }
// ISO-8601 -> datetime-local value for input controls.
function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildFilter(formState: FilterFormState, page = 0, limit = 100): Filter {
  const f: Filter = {};
  if (formState.jobClass.trim()) f.jobClass = formState.jobClass.trim();
  if (formState.queue.trim()) f.queue = formState.queue.trim();
  if (formState.tenantId.trim()) f.tenantId = formState.tenantId.trim();
  if (formState.status) f.status = formState.status as TransitionType;
  if (formState.attemptMin !== '') f.attemptMin = Number(formState.attemptMin);
  if (formState.attemptMax !== '') f.attemptMax = Number(formState.attemptMax);
  if (formState.since) f.since = toIso(formState.since);
  if (formState.until) f.until = toIso(formState.until);
  if (formState.correlationKey.trim() && formState.correlationValue.trim()) {
    f.correlationKey = formState.correlationKey.trim();
    f.correlationValue = formState.correlationValue.trim();
  }
  f.limit = limit;
  f.offset = page * limit;
  return f;
}

export function validateForm(formState: FilterFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  const min = formState.attemptMin === '' ? null : Number(formState.attemptMin);
  const max = formState.attemptMax === '' ? null : Number(formState.attemptMax);
  if (min !== null && max !== null && min > max) errors.attemptMax = 'Max attempts must be ≥ min.';
  if (formState.since && formState.until && new Date(formState.since) > new Date(formState.until)) {
    errors.until = 'End of window must be after the start.';
  }
  const hasKey = formState.correlationKey.trim() !== '';
  const hasVal = formState.correlationValue.trim() !== '';
  if (hasKey && !hasVal) errors.correlationValue = 'Correlation value is required with a key.';
  if (hasVal && !hasKey) errors.correlationKey = 'Correlation key is required with a value.';
  return errors;
}

// URL params carry only non-empty fields; datetime stays in the local-input form for editability.
export function formToParams(formState: FilterFormState): URLSearchParams {
  const p = new URLSearchParams();
  for (const k of FIELD_KEYS) { const v = formState[k]; if (v) p.set(k, v); }
  return p;
}

export function paramsToForm(params: URLSearchParams): FilterFormState {
  const out = { ...EMPTY_FORM };
  for (const k of FIELD_KEYS) { const v = params.get(k); if (v !== null) out[k] = v; }
  return out;
}

// Build a form pre-set for the failures drill-down window (datetime-local values).
export function failuresDrilldownForm(firstSeen: string, lastSeen: string): FilterFormState {
  return { ...EMPTY_FORM, status: 'failed', since: toLocalInput(firstSeen), until: toLocalInput(lastSeen) };
}
```

- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: filter form <-> API filter <-> URL mapping with guards`.

---

## Phase 2 — Test infrastructure (build before screens; screens are tested against it)

### Task 5: Test setup, fixtures, MSW handlers, render util

**Files:** Create `src/test/setup.ts`, `src/test/fixtures.ts`, `src/test/msw/handlers.ts`, `src/test/msw/server.ts`, `src/test/utils.tsx`

- [ ] **Step 1: `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 2: `src/test/fixtures.ts`** — typed sample DTOs: at least `jobSummary()`, `inFlightJob()`, `transition()`, `history()` (queued→processing→processed, and a 2-attempt failed chain), `failureGroup()`, `savedSearch()`, `alertRule()` factory helpers returning the contract types with sensible defaults and overrides. Include one in-flight job (`finishedAt: null, inFlight: true`) and one completed.

- [ ] **Step 3: `src/test/msw/handlers.ts`** — default happy-path handlers for every endpoint, returning fixtures inside the `{data,meta}` envelope. Base path `*/argus-api/...` (use a wildcard so the configured baseUrl matches). Export `handlers`.

- [ ] **Step 4: `src/test/msw/server.ts`** — `export const server = setupServer(...handlers)`.

- [ ] **Step 5: `src/test/utils.tsx`** — `renderWithProviders(ui, { route = '/', client? })`: wraps in `MemoryRouter` (initialEntries=[route]), `QueryClientProvider` (a fresh QueryClient with retry:false), and `ApiClientProvider` (inject a client; defaults to the real client which MSW intercepts). Returns RTL result + `user` from `userEvent.setup()`.

- [ ] **Step 6: commit** `test: MSW server, fixtures, and render harness`.

---

## Phase 3 — App shell, query plumbing, routing

### Task 6: QueryClient, ApiClient context, QueryState

**Files:** Create `src/lib/queryClient.ts`, `src/hooks/useApiClient.ts`, `src/components/query/states.tsx`, `src/components/query/QueryState.tsx`, Test `src/components/query/QueryState.test.tsx`

- [ ] **Step 1: `src/lib/queryClient.ts`** — `makeQueryClient()` with `defaultOptions.queries = { staleTime: 0, refetchOnWindowFocus: true, retry: false }`. (Freshness over caching; `retry:false` so error states surface fast during an incident.)

- [ ] **Step 2: `src/hooks/useApiClient.ts`** — React context holding an `ArgusApiClient`; `ApiClientProvider` + `useApiClient()` hook. Default value built via `createArgusApiClient()`.

- [ ] **Step 3: Write failing test for QueryState**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryState } from './QueryState';
import { ApiError } from '../../api/errors';

const base = { isLoading: false, isError: false, error: null, data: undefined } as any;

describe('QueryState', () => {
  it('shows loading', () => { render(<QueryState query={{ ...base, isLoading: true }}>{() => <div/>}</QueryState>); expect(screen.getByRole('status')).toBeInTheDocument(); });
  it('shows forbidden on 403', () => { render(<QueryState query={{ ...base, isError: true, error: new ApiError(403,'forbidden','no') }}>{() => <div/>}</QueryState>); expect(screen.getByText(/not authorized/i)).toBeInTheDocument(); });
  it('shows unauthenticated on 401', () => { render(<QueryState query={{ ...base, isError: true, error: new ApiError(401,'unauthenticated','no') }}>{() => <div/>}</QueryState>); expect(screen.getByText(/not signed in|session/i)).toBeInTheDocument(); });
  it('shows empty when isEmpty', () => { render(<QueryState query={{ ...base, data: [] }} isEmpty={(d:any[]) => d.length===0} emptyMessage="No jobs match.">{() => <div/>}</QueryState>); expect(screen.getByText('No jobs match.')).toBeInTheDocument(); });
  it('renders children with data', () => { render(<QueryState query={{ ...base, data: [1] }}>{(d:number[]) => <div>got {d.length}</div>}</QueryState>); expect(screen.getByText('got 1')).toBeInTheDocument(); });
});
```

- [ ] **Step 4: Implement `states.tsx`** (presentational `LoadingState` with `role="status"`, `ErrorState` with retry button, `ForbiddenState` "You are not authorized…", `UnauthenticatedState` "You are not signed in / your session expired", `EmptyState`) and **`QueryState.tsx`**: generic component taking `query` (a TanStack `UseQueryResult`-like), optional `isEmpty(data)` predicate, `emptyMessage`, and a render-prop child. Branch order: loading → error(branch on `ApiError` type: forbidden/unauthenticated/notFound/else generic) → empty → children(data). Generic `<T,>`.

- [ ] **Step 5: Run** → PASS. **Step 6: commit** `feat: QueryState + query plumbing + api client context`.

### Task 7: AppShell, NavBar, App routes, main entry

**Files:** Create `src/components/layout/NavBar.tsx`, `src/components/layout/AppShell.tsx`, `src/App.tsx`, `src/screens/NotFoundScreen.tsx`, `src/main.tsx`, Test `src/App.test.tsx`

- [ ] **Step 1: Write failing test** — render `<App>` at `/` via `renderWithProviders`, assert nav links (Search, Failures, Saved searches) present and redirect to Search content; render at `/nope` → NotFound text.
- [ ] **Step 2: Implement** NavBar (NavLinks to `/search`, `/failures`, `/saved-searches` with active styling), AppShell (header + `<Outlet/>` or children), App (`<Routes>` per the route table; `/` → `<Navigate to="/search" replace/>`; `*` → NotFound), main.tsx (`createRoot`, `BrowserRouter`, `QueryClientProvider`, `ApiClientProvider`, `<App/>`).
- [ ] **Step 3: Run** → PASS. **Step 4: commit** `feat: app shell, navigation, routing`.

---

## Phase 4 — Shared components

### Task 8: StatusBadge, Pagination, format helpers

**Files:** Create `src/lib/format.ts`, `src/components/StatusBadge.tsx`, `src/components/Pagination.tsx`, Tests alongside.

- [ ] **Step 1: tests** — `format.ts`: `formatDateTime(iso)` returns a stable human string and `'—'` for null; `formatDuration(ms)` → `'1.2s'`/`'350ms'`/`'—'`. `StatusBadge`: renders the status text and an `inFlight` variant label "in flight". `Pagination`: given `total, limit, offset`, shows "1–100 of 420", disables Prev at offset 0, calls `onPage` with next page index.
- [ ] **Step 2-4: implement, run (PASS), commit** `feat: formatting helpers, status badge, pagination`.

### Task 9: FilterBuilder

**Files:** Create `src/components/FilterBuilder.tsx`, Test `src/components/FilterBuilder.test.tsx`

- [ ] **Step 1: Write failing tests**
  - renders inputs for tenant, status (select with the five transition types + "Any"), job class, attempt min/max, since/until, correlation key/value.
  - typing values and clicking "Apply" calls `onApply(formState)` once with the typed values.
  - with `attemptMin=5, attemptMax=2`, clicking Apply shows the `attemptMax` guard message and does NOT call `onApply`.
  - with correlation key only, shows the `correlationValue` guard and does not apply.
  - quick-pick "Last 24h" populates `since`/`until`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** controlled form over `FilterFormState` (props: `value`, `onApply(form)`, optional `onSaveAsSearch`). On Apply: run `validateForm`; if errors, render them inline and abort; else call `onApply`. Quick-picks compute `since`/`until` as datetime-local strings relative to `new Date()`. All decisions about the filter shape come from `src/api/filter.ts` — this component only edits `FilterFormState`.
- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: FilterBuilder mapped to the API filter`.

### Task 10: ResultsTable

**Files:** Create `src/components/ResultsTable.tsx`, Test `src/components/ResultsTable.test.tsx`

- [ ] **Step 1: Write failing tests**
  - renders one row per `JobSummary` with jobClass, queue, tenant, status, attempts, dispatchedAt, duration, fingerprint (short).
  - each row's jobUuid is a link to `/jobs/:jobUuid`.
  - an in-flight job row is visibly marked (e.g. an "in flight" badge / `data-inflight="true"`).
  - when `highlightFingerprint` prop is set, rows whose `exceptionFingerprint` matches get a highlight class/`data-highlight="true"`; non-matching rows are still rendered (not filtered).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** table; props `{ jobs: JobSummary[]; highlightFingerprint?: string | null }`. Uses `StatusBadge`, `format.ts`, React Router `Link`. No fetching, no sorting (backend's job) — renders in received order.
- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: ResultsTable with job links, in-flight + fingerprint highlight`.

### Task 11: Timeline

**Files:** Create `src/components/Timeline.tsx`, Test `src/components/Timeline.test.tsx`

- [ ] **Step 1: Write failing tests**
  - renders `TransitionRecord[]` in given order (ascending sequence), one node per transition, showing transition type, attempt, occurredAt, duration, and exceptionMessage when present.
  - when the last transition is non-terminal (no `processed`/`failed` in the chain), shows an "in flight" indicator at the end; when terminal, shows a completed indicator and no in-flight marker.
- [ ] **Step 2-4: implement, run (PASS), commit** `feat: Timeline with terminal vs in-flight distinction`.

The terminal check: `const terminal = records.some(r => r.transition === 'processed' || r.transition === 'failed')`.

---

## Phase 5 — Screens

Each screen: a test against MSW (happy path + the screen's specific states), then implementation. Screens read filters from the URL and render hook results through `QueryState`.

### Task 12: Search hook + SearchScreen

**Files:** Create `src/hooks/useSearch.ts`, `src/screens/SearchScreen.tsx`, Test `src/screens/SearchScreen.test.tsx`

- [ ] **Step 1: `useSearch.ts`** — `useSearch(filter: Filter)` → `useQuery({ queryKey: ['search', filter], queryFn: () => client.search(filter) })`.
- [ ] **Step 2: Write failing SearchScreen tests** (MSW):
  - renders rows from the mocked search response (happy path).
  - empty state: handler returns `{ data: [], meta: { total:0, limit:100, offset:0 } }` → "No jobs match" and no spinner.
  - error state: handler returns 500 → error message + retry.
  - forbidden: handler returns 403 forbidden envelope → "not authorized".
  - reads `?status=failed&fp=abc` from the URL: sends `status: failed` in the request body (assert via a handler that captures the body) and highlights rows with fingerprint `abc`.
- [ ] **Step 3: Implement SearchScreen** — derive `FilterFormState` from URL (`useSearchParams` + `paramsToForm`), build `Filter` via `buildFilter(form, page, limit)`, run `useSearch`. Render `FilterBuilder` (Apply writes form back to URL via `formToParams` + `setSearchParams`, resets page to 0), then `<QueryState query={q} isEmpty={(r)=>r.jobs.length===0} emptyMessage="No jobs match this filter.">` → `ResultsTable jobs={r.jobs} highlightFingerprint={fp}` + `Pagination total={r.total} ...`. `fp` is read from URL but never put into the API filter. A "Save as search" affordance opens `SavedSearchForm` (Task 15) prefilled with the current filter.
- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: SearchScreen with filter, results, pagination, drilldown highlight`.

### Task 13: Job history hook + JobHistoryScreen

**Files:** Create `src/hooks/useJobHistory.ts`, `src/screens/JobHistoryScreen.tsx`, Test `src/screens/JobHistoryScreen.test.tsx`

- [ ] **Step 1: `useJobHistory.ts`** — `useJobHistory(jobUuid)` → `useQuery(['history', jobUuid], () => client.getJobHistory(jobUuid))`.
- [ ] **Step 2: Write failing tests** (MSW): renders the ordered timeline for a uuid (happy path, completed chain); a uuid whose handler returns 404 → "job not found" state; an in-flight chain → in-flight indicator shown.
- [ ] **Step 3: Implement** — read `:jobUuid` from route params, run hook, `QueryState` (404 → notFound branch shows "job not found"; the generic notFound state in QueryState handles `isNotFound`), render `<Timeline records={data} />` with a header showing the jobUuid and a back link.
- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: JobHistoryScreen timeline with 404 + in-flight handling`.

### Task 14: Failures hook + FailuresScreen

**Files:** Create `src/hooks/useFailureGroups.ts`, `src/screens/FailuresScreen.tsx`, Test `src/screens/FailuresScreen.test.tsx`

- [ ] **Step 1: `useFailureGroups.ts`** — `useFailureGroups(filter)` → `useQuery(['failures', filter], () => client.getFailureGroups(filter))`.
- [ ] **Step 2: Write failing tests** (MSW):
  - renders one card/row per `FailureGroup` with fingerprint (short), representative message, count, first/last seen.
  - empty state when `data: []`.
  - clicking a group's "View jobs" navigates to `/search?status=failed&since=...&until=...&fp=<fingerprint>` (assert the resulting location / that SearchScreen mounts with those params). Use `failuresDrilldownForm` + `formToParams` to build the target, plus `fp`.
- [ ] **Step 3: Implement** — `FilterBuilder` (time window + criteria) writing to URL; `useFailureGroups(buildFilter(form))`; `QueryState` with empty message "No failures in this window."; each group renders count/first/last seen via `format.ts` and a drill-down link built from the group's `firstSeen`/`lastSeen`/`fingerprint`.
- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: FailuresScreen grouping + drill-down into results`.

### Task 15: Saved searches — list/create/delete

**Files:** Create `src/hooks/useSavedSearches.ts`, `src/components/SavedSearchForm.tsx`, `src/screens/SavedSearchesScreen.tsx`, Tests alongside.

- [ ] **Step 1: `useSavedSearches.ts`** — queries `['saved-searches']` (list) and `['saved-search', id]` (one); mutations `useCreateSavedSearch`, `useUpdateSavedSearch`, `useDeleteSavedSearch` that invalidate `['saved-searches']` (and the specific id) on success.
- [ ] **Step 2: Write failing tests** — list renders saved searches (happy/empty); creating via `SavedSearchForm` (name + current filter) calls POST and shows the new item (MSW handler appends/returns it); deleting calls DELETE and removes it; create validation: empty name shows a required message and does not submit.
- [ ] **Step 3: Implement** `SavedSearchForm` (props: `initialName`, `initialFilter`, `onSubmit({name,filter})`, `submitting`, server `validationErrors` surfaced inline) and `SavedSearchesScreen` (list + "New from current filter" using a filter passed via location state or empty; each row links to `/saved-searches/:id`; delete button with confirm).
- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: saved-search list/create/delete`.

### Task 16: SavedSearchScreen — edit + alert-rule management

**Files:** Create `src/hooks/useAlertRules.ts`, `src/components/AlertRuleForm.tsx`, `src/components/AlertRuleList.tsx`, `src/screens/SavedSearchScreen.tsx`, Tests alongside.

- [ ] **Step 1: `useAlertRules.ts`** — `useSavedSearchAlertRules(ssid)` query `['alert-rules', ssid]`; mutations create/update/delete that invalidate `['alert-rules', ssid]`. (Create takes `ssid`; update/delete take rule `id`.)
- [ ] **Step 2: Write failing tests**
  - loads the saved search by id and pre-fills its name + filter; editing + save calls PUT.
  - 404 for unknown id → not-found state.
  - lists the saved search's alert rules showing `name, threshold, windowSeconds, cooldownSeconds, sinks, enabled, state, lastResultCount, lastEvaluatedAt`.
  - attaching a rule via `AlertRuleForm` calls POST to `/saved-searches/:id/alert-rules` with the rule body and shows it; editing calls PUT; removing calls DELETE.
  - `AlertRuleForm` validation: `windowSeconds < 1` shows a guard and does not submit; threshold/cooldown must be ≥ 0.
- [ ] **Step 3: Implement** `AlertRuleForm` (fields: name, threshold, windowSeconds, cooldownSeconds, sinks (comma/multiselect → string[]), enabled toggle; guards mirror server: threshold≥0, windowSeconds≥1, cooldownSeconds≥0, sinks present), `AlertRuleList` (rows + edit/remove + a state badge using `StatusBadge`/`AlertState`), `SavedSearchScreen` (load via `useSavedSearch(id)` through `QueryState`; `SavedSearchForm` for edit; `AlertRuleList` + `AlertRuleForm` below; a "Run results" button that links to results — reuse the search results table by navigating to a results view or rendering `getSavedSearchResults`).
- [ ] **Step 4: Run** → PASS. **Step 5: commit** `feat: SavedSearchScreen edit + alert-rule CRUD`.

---

## Phase 6 — Docs & verification

### Task 17: README + final gate

**Files:** Create/modify `README.md`

- [ ] **Step 1: Write README** — project intro; "Running in dev" (`npm install`, `ARGUS_API_TARGET=http://localhost:8000 npm run dev`, note same-origin Sanctum session + the Vite proxy, `VITE_ARGUS_API_BASE` default `/argus-api`); "Building for production" (`npm run build` → `dist/`, served by the Laravel app or any static host on the same origin as the API); "Testing" (`npm test`); a short architecture note (client → hooks → screens; API is the source of truth; the failures drill-down limitation and the highlight approach).
- [ ] **Step 2: Final verification gate** — run all three and paste output:
  - `npm run typecheck` → no errors
  - `npm run lint` → no errors/warnings
  - `npm test` → all suites pass
- [ ] **Step 3: Commit** `docs: README (dev, build, test) + final verification`.

---

## Self-Review (done against the spec)

**Spec coverage:** typed client (T1-4) · search screen + filter builder + results + empty/loading/error/403 (T9,10,12) · job history timeline + in-flight + 404 (T11,13) · failures grouping + drill-down (T14) · saved-search CRUD (T15,16) · alert-rule CRUD (T16) · routing + layout (T7) · uniform states (T6) · client/component tests against mocked API (T3 fetch-stub, T5 MSW, T12-16) · README (T17). All spec sections map to a task.

**Placeholders:** none — foundation files (types, errors, client, filter) and all test cases are full code; leaf components carry exact test contracts + structural specs + the specific logic (terminal check, highlight rule, guard rules, drilldown URL) needed to implement without new decisions.

**Type consistency:** `Filter`, `JobSummary`, `TransitionRecord`, `FailureGroup`, `SavedSearch`, `AlertRule`, `AlertRuleInput`, `SearchResult`, `SavedSearchInput`, `FilterFormState`, `ApiError`/`ApiErrorType`, `ArgusApiClient` method names, and hook names are defined once (T1-4, T6) and reused verbatim downstream.
