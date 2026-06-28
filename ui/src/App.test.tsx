import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './test/utils';
import App from './App';

describe('App', () => {
  it('shows the nav links on the search route', async () => {
    renderWithProviders(<App />, { route: '/search' });
    expect(await screen.findByRole('link', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Failures' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Saved searches' })).toBeInTheDocument();
  });

  it('redirects / to the search screen', async () => {
    renderWithProviders(<App />, { route: '/' });
    expect(await screen.findByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it('renders the not-found screen for unknown routes', () => {
    renderWithProviders(<App />, { route: '/totally-unknown' });
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});
