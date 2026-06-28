import { btnGhost } from '../lib/ui';

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPage: (page: number) => void;
}

/** Dense range label + Prev/Next controls driven by offset/limit. */
export function Pagination({ total, limit, offset, onPage }: PaginationProps) {
  const currentPage = Math.floor(offset / limit);
  const start = total === 0 ? 0 : offset + 1;
  const end = Math.min(offset + limit, total);
  const prevDisabled = offset <= 0;
  const nextDisabled = offset + limit >= total;

  return (
    <div className="flex items-center gap-2 text-xs text-blue-40">
      <span>
        {start}-{end} of {total}
      </span>
      <button type="button" className={btnGhost} disabled={prevDisabled} onClick={() => onPage(currentPage - 1)}>
        Prev
      </button>
      <button type="button" className={btnGhost} disabled={nextDisabled} onClick={() => onPage(currentPage + 1)}>
        Next
      </button>
    </div>
  );
}
