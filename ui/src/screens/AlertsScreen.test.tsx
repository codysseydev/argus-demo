import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { AlertsScreen } from './AlertsScreen';
import { renderWithProviders } from '../test/utils';
import { server } from '../test/msw/server';
import { alertFiring, alertRule } from '../test/fixtures';

function renderScreen() {
  return renderWithProviders(
    <Routes>
      <Route path="/alerts" element={<AlertsScreen />} />
    </Routes>,
    { route: '/alerts' },
  );
}

describe('AlertsScreen', () => {
  it('lists alert rules and the recent firing history', async () => {
    server.use(
      http.get('*/argus-api/alert-rules', () =>
        HttpResponse.json({ data: [alertRule({ name: 'billing-spike' })], meta: { count: 1 } }),
      ),
      http.get('*/argus-api/alert-firings', () =>
        HttpResponse.json(
          { data: [alertFiring({ id: 9, alertRuleId: 'ar-1', observedValue: 73 })], meta: { count: 1 } },
        ),
      ),
    );

    renderScreen();

    // The rule name shows in both the overview and (resolved from its id) the
    // firing-history row.
    expect((await screen.findAllByText('billing-spike')).length).toBeGreaterThanOrEqual(1);
    // The observed breach value renders in the firing-history table.
    await waitFor(() => expect(screen.getByText('73')).toBeInTheDocument());
  });

  it('shows an empty state when no alerts have fired', async () => {
    server.use(
      http.get('*/argus-api/alert-firings', () => HttpResponse.json({ data: [], meta: { count: 0 } })),
    );

    renderScreen();

    expect(await screen.findByText('No alerts have fired yet.')).toBeInTheDocument();
  });
});
