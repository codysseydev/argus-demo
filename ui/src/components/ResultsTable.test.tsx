import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ResultsTable } from './ResultsTable';
import { jobSummary, inFlightJob, failedJob } from '../test/fixtures';

function renderTable(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('ResultsTable', () => {
  it('renders one row per job with class/queue/status/attempts visible', () => {
    const jobs = [
      jobSummary({ jobUuid: 'job-a', jobClass: 'App\\Jobs\\Alpha', queue: 'emails' }),
      failedJob({ jobUuid: 'job-b', queue: 'webhooks' }),
    ];
    renderTable(<ResultsTable jobs={jobs} />);

    const bodyRows = screen.getAllByRole('row').slice(1); // drop header row
    expect(bodyRows).toHaveLength(2);
    expect(screen.getByText('App\\Jobs\\Alpha')).toBeInTheDocument();
    expect(screen.getByText('emails')).toBeInTheDocument();
    expect(screen.getByText('webhooks')).toBeInTheDocument();
    expect(screen.getByText('processed')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
    // attempts: 1 (processed) and 3 (failed)
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders the job uuid as a link to /jobs/<uuid>', () => {
    renderTable(<ResultsTable jobs={[jobSummary({ jobUuid: 'job-xyz' })]} />);
    const link = screen.getByRole('link', { name: 'job-xyz' });
    expect(link).toHaveAttribute('href', expect.stringContaining('/jobs/job-xyz'));
  });

  it('marks in-flight rows with data-inflight and shows the marker', () => {
    renderTable(<ResultsTable jobs={[inFlightJob({ jobUuid: 'job-live' })]} />);
    const link = screen.getByRole('link', { name: 'job-live' });
    const row = link.closest('tr');
    expect(row).toHaveAttribute('data-inflight', 'true');
    expect(screen.getByText('in flight')).toBeInTheDocument();
  });

  it('highlights the matching fingerprint row and keeps non-matching rows', () => {
    const jobs = [
      jobSummary({ jobUuid: 'job-clean', exceptionFingerprint: null }),
      failedJob({ jobUuid: 'job-bad', exceptionFingerprint: 'fp-target' }),
    ];
    renderTable(<ResultsTable jobs={jobs} highlightFingerprint="fp-target" />);

    const bodyRows = screen.getAllByRole('row').slice(1);
    expect(bodyRows).toHaveLength(2);

    const matchRow = screen.getByRole('link', { name: 'job-bad' }).closest('tr');
    const otherRow = screen.getByRole('link', { name: 'job-clean' }).closest('tr');
    expect(matchRow).toHaveAttribute('data-highlight', 'true');
    expect(otherRow).not.toHaveAttribute('data-highlight');
  });
});
