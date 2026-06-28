import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBuilder } from './FilterBuilder';
import { EMPTY_FORM } from '../api/filter';
import { TRANSITION_TYPES } from '../api/types';

describe('FilterBuilder', () => {
  it('renders the status select and all the filter inputs', () => {
    render(<FilterBuilder value={EMPTY_FORM} onApply={vi.fn()} />);

    const status = screen.getByLabelText('Status');
    const options = within(status).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Any status', ...TRANSITION_TYPES]);

    expect(screen.getByLabelText('Tenant ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Job class')).toBeInTheDocument();
    expect(screen.getByLabelText('Queue')).toBeInTheDocument();
    expect(screen.getByLabelText('Min attempts')).toBeInTheDocument();
    expect(screen.getByLabelText('Max attempts')).toBeInTheDocument();
    expect(screen.getByLabelText('Since')).toBeInTheDocument();
    expect(screen.getByLabelText('Until')).toBeInTheDocument();
    expect(screen.getByLabelText('Correlation key')).toBeInTheDocument();
    expect(screen.getByLabelText('Correlation value')).toBeInTheDocument();
  });

  it('applies queue + status via onApply with the typed values', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterBuilder value={EMPTY_FORM} onApply={onApply} />);

    await user.type(screen.getByLabelText('Queue'), 'emails');
    await user.selectOptions(screen.getByLabelText('Status'), 'failed');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ queue: 'emails', status: 'failed' }),
    );
  });

  it('shows a max-attempts error and blocks apply when min > max', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterBuilder value={EMPTY_FORM} onApply={onApply} />);

    await user.type(screen.getByLabelText('Min attempts'), '5');
    await user.type(screen.getByLabelText('Max attempts'), '2');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByText(/Max attempts must be/i)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('shows a correlation-value error and blocks apply when only the key is set', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<FilterBuilder value={EMPTY_FORM} onApply={onApply} />);

    await user.type(screen.getByLabelText('Correlation key'), 'order_id');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByText(/Correlation value is required/i)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('fills since and until when a quick-pick window is chosen', async () => {
    const user = userEvent.setup();
    render(<FilterBuilder value={EMPTY_FORM} onApply={vi.fn()} />);

    const since = screen.getByLabelText('Since') as HTMLInputElement;
    const until = screen.getByLabelText('Until') as HTMLInputElement;
    expect(since.value).toBe('');
    expect(until.value).toBe('');

    await user.click(screen.getByRole('button', { name: '24h' }));

    expect(since.value).not.toBe('');
    expect(until.value).not.toBe('');
  });
});
