import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from './lib/queryClient';
import { ApiClientProvider } from './hooks/useApiClient';
import { createArgusApiClient } from './api/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <QueryClientProvider client={makeQueryClient()}>
          <ApiClientProvider client={createArgusApiClient()}>
            <App />
          </ApiClientProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
