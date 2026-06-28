import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertRuleForm } from './AlertRuleForm';
import { alertRule } from '../test/fixtures';

describe('AlertRuleForm', () => {
  it('populates fields from `initial` when editing', () => {
    render(<AlertRuleForm initial={alertRule()} onSubmit={vi.fn()} />);
    expect((screen.getByLabelText('Rule name') as HTMLInputElement).value).toBe('too-many-failed-emails');
    expect((screen.getByLabelText('Threshold') as HTMLInputElement).value).toBe('50');
    expect((screen.getByLabelText('Window (seconds)') as HTMLInputElement).value).toBe('900');
    expect(screen.getByRole('button', { name: 'Update rule' })).toBeInTheDocument();
  });

  it('surfaces server-side (422) field errors passed via the errors prop', () => {
    render(<AlertRuleForm onSubmit={vi.fn()} errors={{ threshold: ['Threshold is too low.'] }} />);
    expect(screen.getByText('Threshold is too low.')).toBeInTheDocument();
  });

  it('blocks submit and shows a guard when windowSeconds < 1', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AlertRuleForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Rule name'), 'spike');
    await user.type(screen.getByLabelText('Threshold'), '10');
    await user.type(screen.getByLabelText('Window (seconds)'), '0');
    await user.type(screen.getByLabelText('Cooldown (seconds)'), '60');
    await user.click(screen.getByRole('button', { name: 'Add rule' }));

    expect(screen.getByText(/Window must be/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a parsed AlertRuleInput with comma-separated sinks', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<AlertRuleForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Rule name'), 'spike');
    await user.type(screen.getByLabelText('Threshold'), '10');
    await user.type(screen.getByLabelText('Window (seconds)'), '900');
    await user.type(screen.getByLabelText('Cooldown (seconds)'), '1800');
    await user.type(screen.getByLabelText('Sinks'), 'slack, webhook');
    await user.click(screen.getByRole('button', { name: 'Add rule' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'spike',
      threshold: 10,
      windowSeconds: 900,
      cooldownSeconds: 1800,
      sinks: ['slack', 'webhook'],
      enabled: true,
    });
  });
});
