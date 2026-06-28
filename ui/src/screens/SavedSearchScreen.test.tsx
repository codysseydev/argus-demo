import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../test/msw/server';
import { renderWithProviders } from '../test/utils';
import { SavedSearchScreen } from './SavedSearchScreen';

function renderScreen(route = '/saved-searches/ss-1') {
  return renderWithProviders(
    <Routes>
      <Route path="/saved-searches/:id" element={<SavedSearchScreen />} />
    </Routes>,
    { route },
  );
}

describe('SavedSearchScreen', () => {
  it('prefills the name and lists existing alert rules', async () => {
    renderScreen();

    const name = (await screen.findByLabelText('Name')) as HTMLInputElement;
    expect(name.value).toBe('failed-emails');

    expect(await screen.findByText('too-many-failed-emails')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('shows the not-found message on a 404', async () => {
    server.use(
      http.get('*/argus-api/saved-searches/:id', () =>
        HttpResponse.json({ error: { type: 'not_found', message: 'gone' } }, { status: 404 }),
      ),
    );
    renderScreen();

    expect(await screen.findByText('Saved search not found.')).toBeInTheDocument();
  });

  it('posts a new alert rule with the entered name and threshold', async () => {
    let body: { name?: string; threshold?: number } | null = null;
    server.use(
      http.post('*/argus-api/saved-searches/:id/alert-rules', async ({ request }) => {
        body = (await request.json()) as { name?: string; threshold?: number };
        return HttpResponse.json({ data: { id: 'ar-new' }, meta: {} }, { status: 201 });
      }),
    );
    const { user } = renderScreen();

    await screen.findByLabelText('Rule name');
    await user.type(screen.getByLabelText('Rule name'), 'spike');
    await user.type(screen.getByLabelText('Threshold'), '5');
    await user.type(screen.getByLabelText('Window (seconds)'), '900');
    await user.type(screen.getByLabelText('Cooldown (seconds)'), '60');
    await user.click(screen.getByRole('button', { name: 'Add rule' }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body!.name).toBe('spike');
    expect(body!.threshold).toBe(5);
  });

  it('blocks the alert-rule post when windowSeconds is 0', async () => {
    let posted = false;
    server.use(
      http.post('*/argus-api/saved-searches/:id/alert-rules', () => {
        posted = true;
        return HttpResponse.json({ data: { id: 'ar-new' }, meta: {} }, { status: 201 });
      }),
    );
    const { user } = renderScreen();

    await screen.findByLabelText('Rule name');
    await user.type(screen.getByLabelText('Rule name'), 'spike');
    await user.type(screen.getByLabelText('Threshold'), '5');
    await user.type(screen.getByLabelText('Window (seconds)'), '0');
    await user.type(screen.getByLabelText('Cooldown (seconds)'), '60');
    await user.click(screen.getByRole('button', { name: 'Add rule' }));

    expect(await screen.findByText(/Window must be/i)).toBeInTheDocument();
    expect(posted).toBe(false);
  });

  it("renders the saved search's current matches via /results", async () => {
    renderScreen();
    expect(await screen.findByText('Current matches')).toBeInTheDocument();
    // The default /results handler returns one job; the shared ResultsTable links it.
    expect(await screen.findByRole('link', { name: 'job-0001' })).toBeInTheDocument();
  });

  it('populates the alert-rule form when Edit is clicked', async () => {
    const { user } = renderScreen();
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    expect((screen.getByLabelText('Rule name') as HTMLInputElement).value).toBe('too-many-failed-emails');
    expect((screen.getByLabelText('Threshold') as HTMLInputElement).value).toBe('50');
    expect(screen.getByRole('button', { name: 'Update rule' })).toBeInTheDocument();
  });

  it('surfaces a 422 field error when alert-rule create is rejected', async () => {
    server.use(
      http.post('*/argus-api/saved-searches/:id/alert-rules', () =>
        HttpResponse.json(
          { error: { type: 'validation', message: 'invalid', details: { threshold: ['Threshold is too low.'] } } },
          { status: 422 },
        ),
      ),
    );
    const { user } = renderScreen();

    await screen.findByLabelText('Rule name');
    await user.type(screen.getByLabelText('Rule name'), 'spike');
    await user.type(screen.getByLabelText('Threshold'), '5');
    await user.type(screen.getByLabelText('Window (seconds)'), '900');
    await user.type(screen.getByLabelText('Cooldown (seconds)'), '60');
    await user.click(screen.getByRole('button', { name: 'Add rule' }));

    expect(await screen.findByText('Threshold is too low.')).toBeInTheDocument();
  });
});
