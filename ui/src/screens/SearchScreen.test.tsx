import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { renderWithProviders } from '../test/utils';
import { failedJob, jobSummary } from '../test/fixtures';
import { SearchScreen } from './SearchScreen';

describe('SearchScreen', () => {
  it('renders result rows from the default handler', async () => {
    renderWithProviders(<SearchScreen />, { route: '/search' });
    expect(await screen.findByRole('link', { name: 'job-0001' })).toBeInTheDocument();
    expect(screen.getAllByText('App\\Jobs\\SendWelcomeEmail').length).toBeGreaterThan(0);
  });

  it('shows the empty message when no jobs match', async () => {
    server.use(
      http.post('*/argus-api/search', () =>
        HttpResponse.json({ data: [], meta: { total: 0, limit: 100, offset: 0 } }),
      ),
    );
    renderWithProviders(<SearchScreen />, { route: '/search' });
    expect(await screen.findByText('No jobs match this filter.')).toBeInTheDocument();
  });

  it('shows an alert on a server error', async () => {
    server.use(http.post('*/argus-api/search', () => new HttpResponse(null, { status: 500 })));
    renderWithProviders(<SearchScreen />, { route: '/search' });
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('shows a not-authorized message on 403', async () => {
    server.use(
      http.post('*/argus-api/search', () =>
        HttpResponse.json(
          { error: { type: 'forbidden', message: 'no', details: { ability: 'view-jobs' } } },
          { status: 403 },
        ),
      ),
    );
    renderWithProviders(<SearchScreen />, { route: '/search' });
    expect(await screen.findByText(/not authorized/i)).toBeInTheDocument();
  });

  it('drives the filter from the URL and highlights the matching fingerprint row', async () => {
    let captured: { status?: string } = {};
    server.use(
      http.post('*/argus-api/search', async ({ request }) => {
        captured = (await request.json()) as { status?: string };
        return HttpResponse.json({
          data: [
            failedJob({ exceptionFingerprint: 'fp-abc123' }),
            jobSummary({ jobUuid: 'jb-other', exceptionFingerprint: 'fp-zzz' }),
          ],
          meta: { total: 2, limit: 100, offset: 0 },
        });
      }),
    );

    renderWithProviders(<SearchScreen />, { route: '/search?status=failed&fp=fp-abc123' });

    const matchLink = await screen.findByRole('link', { name: 'job-failed' });
    expect(captured.status).toBe('failed');
    expect(matchLink.closest('tr')).toHaveAttribute('data-highlight', 'true');
    expect(screen.getByRole('link', { name: 'jb-other' })).toBeInTheDocument();
  });
});
