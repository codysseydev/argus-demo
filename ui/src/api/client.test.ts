import { describe, it, expect, vi } from 'vitest';
import { createArgusApiClient } from './client';
import { ApiError } from './errors';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** vitest types the toSatisfy predicate arg as unknown; cast it to ApiError. */
const sat = (fn: (e: ApiError) => boolean) => (e: unknown): boolean => fn(e as ApiError);

function makeClient(impl: (url: string, init: RequestInit) => Response) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => impl(url, init));
  return {
    client: createArgusApiClient({
      baseUrl: '/argus-api',
      fetch: fetchMock as unknown as typeof fetch,
      getXsrfToken: () => 'tok',
    }),
    fetchMock,
  };
}

describe('ArgusApiClient.search', () => {
  it('POSTs the filter to /search and unwraps data + meta', async () => {
    const { client, fetchMock } = makeClient(() =>
      jsonResponse(200, { data: [{ jobUuid: 'j1', inFlight: false }], meta: { total: 7, limit: 100, offset: 0 } }),
    );
    const res = await client.search({ status: 'failed', limit: 100, offset: 0 });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/argus-api/search');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body as string)).toEqual({ status: 'failed', limit: 100, offset: 0 });
    expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('tok');
    expect(res).toEqual({ jobs: [{ jobUuid: 'j1', inFlight: false }], total: 7, limit: 100, offset: 0 });
  });
});

describe('ArgusApiClient error mapping', () => {
  it('maps 401 (middleware shape, not envelope) to unauthenticated', async () => {
    const { client } = makeClient(() => jsonResponse(401, { message: 'Unauthenticated.' }));
    await expect(client.search({})).rejects.toSatisfy(sat((e) => e.isUnauthenticated && e.status === 401));
  });
  it('maps 403 envelope to forbidden with ability detail', async () => {
    const { client } = makeClient(() =>
      jsonResponse(403, { error: { type: 'forbidden', message: 'no', details: { ability: 'view-jobs' } } }),
    );
    await expect(client.search({})).rejects.toSatisfy(sat((e) => e.isForbidden && e.details.ability === 'view-jobs'));
  });
  it('maps 422 to validation with field errors', async () => {
    const { client } = makeClient(() =>
      jsonResponse(422, { error: { type: 'validation', message: 'bad', details: { since: ['invalid'] } } }),
    );
    await expect(client.search({})).rejects.toSatisfy(
      sat((e) => e.isValidation && e.validationErrors.since[0] === 'invalid'),
    );
  });
  it('maps 404 on history to not_found', async () => {
    const { client } = makeClient(() =>
      jsonResponse(404, { error: { type: 'not_found', message: 'Unknown job [x].', details: {} } }),
    );
    await expect(client.getJobHistory('x')).rejects.toSatisfy(sat((e) => e.isNotFound));
  });
  it('maps a thrown fetch to network', async () => {
    const client = createArgusApiClient({
      baseUrl: '/argus-api',
      fetch: (() => {
        throw new Error('down');
      }) as unknown as typeof fetch,
    });
    await expect(client.search({})).rejects.toSatisfy(sat((e) => e.type === 'network'));
  });
});

describe('ArgusApiClient resource methods', () => {
  it('GET history encodes the uuid into the path', async () => {
    const { client, fetchMock } = makeClient(() => jsonResponse(200, { data: [], meta: { jobUuid: 'a/b', count: 0 } }));
    await client.getJobHistory('a/b');
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[0]).toBe('/argus-api/jobs/a%2Fb/history');
  });
  it('DELETE returns void on 204', async () => {
    const { client, fetchMock } = makeClient(() => jsonResponse(204, null));
    await expect(client.deleteSavedSearch('s1')).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/argus-api/saved-searches/s1');
    expect(init.method).toBe('DELETE');
  });
  it('createAlertRule posts the rule body to the nested path', async () => {
    const { client, fetchMock } = makeClient(() => jsonResponse(201, { data: { id: 'r1' }, meta: {} }));
    await client.createAlertRule('s1', {
      name: 'n',
      threshold: 5,
      windowSeconds: 900,
      cooldownSeconds: 60,
      sinks: ['slack'],
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/argus-api/saved-searches/s1/alert-rules');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'n',
      threshold: 5,
      windowSeconds: 900,
      cooldownSeconds: 60,
      sinks: ['slack'],
    });
  });
  it('createSavedSearch sends { name, filter } and parses the 201 body', async () => {
    const { client, fetchMock } = makeClient(() =>
      jsonResponse(201, { data: { id: 'ss9', name: 'n', filter: {} }, meta: {} }),
    );
    const ss = await client.createSavedSearch({ name: 'n', filter: { status: 'failed' } });
    expect(JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string)).toEqual({
      name: 'n',
      filter: { status: 'failed' },
    });
    expect(ss.id).toBe('ss9');
  });
});
