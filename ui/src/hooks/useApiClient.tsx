import { createContext, useContext, type ReactNode } from 'react';
import { type ArgusApiClient, createArgusApiClient } from '../api/client';

const defaultClient = createArgusApiClient();
const ApiClientContext = createContext<ArgusApiClient>(defaultClient);

export function ApiClientProvider({ client, children }: { client: ArgusApiClient; children: ReactNode }) {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}

/** The single typed client every hook reads from. Injected in tests. */
export function useApiClient(): ArgusApiClient {
  return useContext(ApiClientContext);
}
