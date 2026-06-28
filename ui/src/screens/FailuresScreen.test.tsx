import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { renderWithProviders } from '../test/utils';
import { FailuresScreen } from './FailuresScreen';

describe('FailuresScreen', () => {
  it('renders a group card with its representative message and count', async () => {
    renderWithProviders(<FailuresScreen />, { route: '/failures' });

    expect(await screen.findByText('Connection timed out to [host]')).toBeInTheDocument();
    expect(screen.getByText('count: 42')).toBeInTheDocument();
  });

  it('shows the empty message when there are no failures', async () => {
    server.use(
      http.post('*/argus-api/failures', () => HttpResponse.json({ data: [], meta: { count: 0 } })),
    );

    renderWithProviders(<FailuresScreen />, { route: '/failures' });

    expect(await screen.findByText('No failures in this window.')).toBeInTheDocument();
  });

  it('builds a drill-down link carrying the failed status and fingerprint', async () => {
    renderWithProviders(<FailuresScreen />, { route: '/failures' });

    const link = await screen.findByRole('link', { name: 'View jobs' });
    const href = link.getAttribute('href') ?? '';
    expect(href).toContain('status=failed');
    expect(href).toContain('fp=fp-abc123');
  });
});
