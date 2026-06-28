import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText('failed')).toBeInTheDocument();
  });
  it('shows an "in flight" marker only when inFlight', () => {
    const { rerender } = render(<StatusBadge status="processing" inFlight />);
    expect(screen.getByText('in flight')).toBeInTheDocument();
    rerender(<StatusBadge status="processed" />);
    expect(screen.queryByText('in flight')).not.toBeInTheDocument();
  });
});
