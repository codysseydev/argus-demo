import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryState, type QueryLike } from './QueryState';
import { ApiError } from '../../api/errors';

const base: QueryLike<unknown> = { isLoading: false, isError: false, error: null, data: undefined };

describe('QueryState', () => {
  it('shows loading', () => {
    render(<QueryState query={{ ...base, isLoading: true }}>{() => <div />}</QueryState>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('shows forbidden on a 403 ApiError', () => {
    render(
      <QueryState query={{ ...base, isError: true, error: new ApiError(403, 'forbidden', 'no') }}>
        {() => <div />}
      </QueryState>,
    );
    expect(screen.getByText(/not authorized/i)).toBeInTheDocument();
  });
  it('shows unauthenticated on a 401 ApiError', () => {
    render(
      <QueryState query={{ ...base, isError: true, error: new ApiError(401, 'unauthenticated', 'no') }}>
        {() => <div />}
      </QueryState>,
    );
    expect(screen.getByText(/not signed in|session/i)).toBeInTheDocument();
  });
  it('shows a generic error with retry otherwise', () => {
    render(
      <QueryState query={{ ...base, isError: true, error: new Error('boom') }}>{() => <div />}</QueryState>,
    );
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
  it('shows empty when isEmpty matches', () => {
    render(
      <QueryState query={{ ...base, data: [] }} isEmpty={(d: unknown[]) => d.length === 0} emptyMessage="No jobs match.">
        {() => <div />}
      </QueryState>,
    );
    expect(screen.getByText('No jobs match.')).toBeInTheDocument();
  });
  it('renders children with data', () => {
    render(
      <QueryState query={{ ...base, data: [1] }}>{(d: number[]) => <div>got {d.length}</div>}</QueryState>,
    );
    expect(screen.getByText(/got 1/)).toBeInTheDocument();
  });
});
