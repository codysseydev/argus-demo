import { http, HttpResponse } from 'msw';
import {
  alertFiring,
  alertRule,
  completedHistory,
  failureGroup,
  inFlightJob,
  jobSummary,
  savedSearch,
} from '../fixtures';

const ok = (data: unknown, meta: Record<string, unknown> = {}) => HttpResponse.json({ data, meta });

/**
 * Default happy-path handlers for every Phase 4 endpoint, returning fixtures in
 * the `{ data, meta }` envelope. The `*` origin wildcard matches whatever base
 * URL the test client uses. Individual tests override these with
 * `server.use(...)` for empty/error/403 cases.
 */
export const handlers = [
  http.post('*/argus-api/search', () => ok([jobSummary(), inFlightJob()], { total: 2, limit: 100, offset: 0 })),
  http.get('*/argus-api/jobs/:uuid/history', ({ params }) =>
    ok(completedHistory(String(params.uuid)), { jobUuid: params.uuid, count: 3 }),
  ),
  http.post('*/argus-api/failures', () => ok([failureGroup()], { count: 1 })),

  http.get('*/argus-api/saved-searches/:id/results', ({ params }) =>
    ok([jobSummary()], { savedSearchId: params.id, count: 1 }),
  ),
  http.get('*/argus-api/saved-searches/:id/alert-rules', ({ params }) =>
    ok([alertRule({ savedSearchId: String(params.id) })], { savedSearchId: params.id, count: 1 }),
  ),
  http.post('*/argus-api/saved-searches/:id/alert-rules', ({ params }) =>
    HttpResponse.json({ data: alertRule({ savedSearchId: String(params.id) }), meta: {} }, { status: 201 }),
  ),
  http.get('*/argus-api/saved-searches', () => ok([savedSearch()], { count: 1 })),
  http.post('*/argus-api/saved-searches', () => HttpResponse.json({ data: savedSearch(), meta: {} }, { status: 201 })),
  http.get('*/argus-api/saved-searches/:id', ({ params }) => ok(savedSearch({ id: String(params.id) }))),
  http.put('*/argus-api/saved-searches/:id', ({ params }) => ok(savedSearch({ id: String(params.id), name: 'updated' }))),
  http.delete('*/argus-api/saved-searches/:id', () => new HttpResponse(null, { status: 204 })),

  http.get('*/argus-api/alert-firings', () => ok([alertFiring()], { count: 1 })),
  http.get('*/argus-api/alert-rules', () => ok([alertRule()], { count: 1 })),
  http.get('*/argus-api/alert-rules/:id/firings', ({ params }) =>
    ok([alertFiring({ alertRuleId: String(params.id) })], { alertRuleId: params.id, count: 1 }),
  ),
  http.get('*/argus-api/alert-rules/:id', ({ params }) => ok(alertRule({ id: String(params.id) }))),
  http.put('*/argus-api/alert-rules/:id', ({ params }) => ok(alertRule({ id: String(params.id) }))),
  http.delete('*/argus-api/alert-rules/:id', () => new HttpResponse(null, { status: 204 })),
];
