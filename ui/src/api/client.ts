import { ApiError, type ApiErrorType } from './errors';
import type {
  AlertRule,
  AlertRuleInput,
  FailureGroup,
  Filter,
  JobSummary,
  SavedSearch,
  SavedSearchInput,
  SearchResult,
  TransitionRecord,
} from './types';

/**
 * The one place that owns HTTP. Components never call this directly; they go
 * through TanStack Query hooks. Only this module knows URLs, unwraps the
 * `{ data, meta }` envelope, and maps non-2xx responses to `ApiError`.
 */
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

interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

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
      const token = getXsrf();
      if (token) headers['X-XSRF-TOKEN'] = token;
    }

    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}`, {
        method,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError(0, 'network', e instanceof Error ? e.message : 'Network request failed.');
    }

    if (res.status === 204) return undefined as T;

    let payload: { error?: { type?: string; message?: string; details?: Record<string, unknown> }; message?: string } | null =
      null;
    const text = await res.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (res.ok) return payload as T;

    // 401 comes from the app's auth middleware, not the package envelope.
    if (res.status === 401) {
      throw new ApiError(401, 'unauthenticated', payload?.error?.message ?? payload?.message ?? 'Not authenticated.');
    }

    const message = payload?.error?.message ?? `Request failed with status ${res.status}.`;
    const details = payload?.error?.details ?? {};
    const byStatus: Record<number, ApiErrorType> = { 403: 'forbidden', 404: 'not_found', 422: 'validation' };
    const type = byStatus[res.status] ?? (payload?.error?.type as ApiErrorType | undefined) ?? 'unknown';
    throw new ApiError(res.status, type, message, details);
  }

  const data = <T>(method: string, path: string, body?: unknown): Promise<T> =>
    request<Envelope<T>>(method, path, body).then((e) => e.data);

  return {
    async search(filter) {
      const e = await request<Envelope<JobSummary[]> & { meta: { total: number; limit: number; offset: number } }>(
        'POST',
        '/search',
        filter,
      );
      return { jobs: e.data, total: e.meta.total, limit: e.meta.limit, offset: e.meta.offset };
    },
    getJobHistory: (uuid) => data<TransitionRecord[]>('GET', `/jobs/${enc(uuid)}/history`),
    getFailureGroups: (filter) => data<FailureGroup[]>('POST', '/failures', filter),
    listSavedSearches: () => data<SavedSearch[]>('GET', '/saved-searches'),
    createSavedSearch: (input) => data<SavedSearch>('POST', '/saved-searches', input),
    getSavedSearch: (id) => data<SavedSearch>('GET', `/saved-searches/${enc(id)}`),
    updateSavedSearch: (id, input) => data<SavedSearch>('PUT', `/saved-searches/${enc(id)}`, input),
    deleteSavedSearch: async (id) => {
      await request<void>('DELETE', `/saved-searches/${enc(id)}`);
    },
    getSavedSearchResults: (id) => data<JobSummary[]>('GET', `/saved-searches/${enc(id)}/results`),
    listAlertRules: () => data<AlertRule[]>('GET', '/alert-rules'),
    listSavedSearchAlertRules: (ssid) => data<AlertRule[]>('GET', `/saved-searches/${enc(ssid)}/alert-rules`),
    createAlertRule: (ssid, input) => data<AlertRule>('POST', `/saved-searches/${enc(ssid)}/alert-rules`, input),
    getAlertRule: (id) => data<AlertRule>('GET', `/alert-rules/${enc(id)}`),
    updateAlertRule: (id, input) => data<AlertRule>('PUT', `/alert-rules/${enc(id)}`, input),
    deleteAlertRule: async (id) => {
      await request<void>('DELETE', `/alert-rules/${enc(id)}`);
    },
  };
}
