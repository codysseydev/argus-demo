import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { renderWithProviders } from '../test/utils';
import { SavedSearchesScreen } from './SavedSearchesScreen';

describe('SavedSearchesScreen', () => {
  it('lists saved searches as links', async () => {
    renderWithProviders(<SavedSearchesScreen />, { route: '/saved-searches' });

    const link = await screen.findByRole('link', { name: 'failed-emails' });
    expect(link).toHaveAttribute('href', '/saved-searches/ss-1');
  });

  it('shows the empty message when there are none', async () => {
    server.use(
      http.get('*/argus-api/saved-searches', () => HttpResponse.json({ data: [], meta: { count: 0 } })),
    );
    renderWithProviders(<SavedSearchesScreen />, { route: '/saved-searches' });

    expect(await screen.findByText('No saved searches yet.')).toBeInTheDocument();
  });

  it('posts the typed name when Save is clicked', async () => {
    let body: { name?: string } | null = null;
    server.use(
      http.post('*/argus-api/saved-searches', async ({ request }) => {
        body = (await request.json()) as { name?: string };
        return HttpResponse.json({ data: { id: 'ss-new' }, meta: {} }, { status: 201 });
      }),
    );
    const { user } = renderWithProviders(<SavedSearchesScreen />, { route: '/saved-searches' });

    await screen.findByRole('link', { name: 'failed-emails' });
    await user.type(screen.getByLabelText('Name'), 'my-new-search');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body!.name).toBe('my-new-search');
  });

  it('shows a required error and does not post when name is empty', async () => {
    let posted = false;
    server.use(
      http.post('*/argus-api/saved-searches', () => {
        posted = true;
        return HttpResponse.json({ data: { id: 'ss-new' }, meta: {} }, { status: 201 });
      }),
    );
    const { user } = renderWithProviders(<SavedSearchesScreen />, { route: '/saved-searches' });

    await screen.findByRole('link', { name: 'failed-emails' });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it('surfaces a forbidden (403) delete failure instead of swallowing it', async () => {
    server.use(
      http.delete('*/argus-api/saved-searches/:id', () =>
        HttpResponse.json(
          { error: { type: 'forbidden', message: 'no', details: { ability: 'manage-saved-searches' } } },
          { status: 403 },
        ),
      ),
    );
    const { user } = renderWithProviders(<SavedSearchesScreen />, { route: '/saved-searches' });

    await screen.findByRole('link', { name: 'failed-emails' });
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText(/not authorized to perform this action/i)).toBeInTheDocument();
  });
});
