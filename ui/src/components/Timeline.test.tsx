import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timeline } from './Timeline';
import { completedHistory, inFlightHistory, transition } from '../test/fixtures';

describe('Timeline', () => {
  it('renders nodes in order with a completed (not in-flight) end for a terminal history', () => {
    const records = completedHistory();
    const { container } = render(<Timeline records={records} />);

    const badges = screen.getAllByText(/^(queued|processing|processed)$/);
    expect(badges.map((b) => b.textContent)).toEqual(['queued', 'processing', 'processed']);

    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(container.querySelector('[data-inflight="true"]')).toBeNull();
  });

  it('shows an in-flight indicator for a non-terminal history', () => {
    const { container } = render(<Timeline records={inFlightHistory()} />);
    expect(container.querySelector('[data-inflight="true"]')).not.toBeNull();
  });

  it('renders a transition exception message', () => {
    const records = [
      transition({
        sequence: 1,
        transition: 'failed',
        exceptionMessage: 'Connection timed out to [host]',
      }),
    ];
    render(<Timeline records={records} />);
    expect(screen.getByText('Connection timed out to [host]')).toBeInTheDocument();
  });
});
