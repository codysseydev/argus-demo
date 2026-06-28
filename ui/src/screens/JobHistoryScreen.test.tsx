import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { JobHistoryScreen } from './JobHistoryScreen';
import { renderWithProviders } from '../test/utils';
import { server } from '../test/msw/server';
import { inFlightHistory } from '../test/fixtures';

function renderScreen(route = '/jobs/job-0001') {
  return renderWithProviders(
    <Routes>
      <Route path="/jobs/:jobUuid" element={<JobHistoryScreen />} />
    </Routes>,
    { route },
  );
}

describe('JobHistoryScreen', () => {
  it('renders the uuid header, a back link, and the completed timeline', async () => {
    renderScreen();

    expect(screen.getByText('job-0001')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to search' })).toHaveAttribute('href', '/search');

    expect(await screen.findByText('completed')).toBeInTheDocument();
    expect(screen.queryByText('in flight')).not.toBeInTheDocument();
  });

  it('shows the not-found message on a 404', async () => {
    server.use(
      http.get('*/argus-api/jobs/:uuid/history', () =>
        HttpResponse.json(
          { error: { type: 'not_found', message: 'Unknown job [x].', details: {} } },
          { status: 404 },
        ),
      ),
    );
    renderScreen();

    expect(await screen.findByText('Job not found.')).toBeInTheDocument();
  });

  it('marks an in-flight job with data-inflight', async () => {
    server.use(
      http.get('*/argus-api/jobs/:uuid/history', () =>
        HttpResponse.json({ data: inFlightHistory(), meta: { jobUuid: 'x', count: 2 } }),
      ),
    );
    renderScreen();

    await waitFor(() => {
      expect(document.querySelector('[data-inflight="true"]')).toBeInTheDocument();
    });
  });
});
