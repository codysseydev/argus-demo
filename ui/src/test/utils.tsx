import { type ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '../lib/queryClient';
import { ApiClientProvider } from '../hooks/useApiClient';
import { type ArgusApiClient, createArgusApiClient } from '../api/client';

/** Absolute base so node's fetch (undici) can parse the URL; MSW intercepts it. */
export const TEST_API_BASE = 'http://localhost/argus-api';

interface Options {
  route?: string;
  client?: ArgusApiClient;
}

/**
 * Render a component inside the router + query + api-client providers, exactly
 * as the real app wires them. Defaults to a real client pointed at the test
 * base URL, which MSW intercepts; pass `client` to inject a stub.
 */
export function renderWithProviders(ui: ReactElement, opts: Options = {}) {
  const client = opts.client ?? createArgusApiClient({ baseUrl: TEST_API_BASE });
  const queryClient = makeQueryClient();
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter
      initialEntries={[opts.route ?? '/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <QueryClientProvider client={queryClient}>
        <ApiClientProvider client={client}>{ui}</ApiClientProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
  return { ...result, user, client, queryClient };
}
