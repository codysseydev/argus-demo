import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('shows the first page range, disables Prev, and pages forward on Next', async () => {
    const user = userEvent.setup();
    const onPage = vi.fn();
    render(<Pagination total={420} limit={100} offset={0} onPage={onPage} />);

    expect(screen.getByText('1-100 of 420')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPage).toHaveBeenCalledWith(1);
  });

  it('shows the last page range and disables Next on the final page', () => {
    render(<Pagination total={420} limit={100} offset={400} onPage={vi.fn()} />);

    expect(screen.getByText('401-420 of 420')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('shows a zero range and disables both buttons when empty', () => {
    render(<Pagination total={0} limit={100} offset={0} onPage={vi.fn()} />);

    expect(screen.getByText('0-0 of 0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
