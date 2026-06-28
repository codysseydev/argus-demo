import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildFilter, formToParams, paramsToForm } from '../api/filter';
import { FilterBuilder } from '../components/FilterBuilder';
import { Pagination } from '../components/Pagination';
import { ResultsTable } from '../components/ResultsTable';
import { QueryState } from '../components/query/QueryState';
import { inputCls } from '../lib/formStyles';
import { btnGhost, card } from '../lib/ui';
import { useSearch } from '../hooks/useSearch';

const PAGE_SIZES = [50, 100, 250, 500];
const DEFAULT_LIMIT = 100;

/** Filter + paginated results, with all state driven by the URL query string. */
export function SearchScreen() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const form = paramsToForm(params);
  const page = Number(params.get('page') ?? '0') || 0;
  const limit = Number(params.get('limit') ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT;
  const fp = params.get('fp');
  const filter = buildFilter(form, page, limit);
  const q = useSearch(filter);

  // Preserve paging / page-size / drill-down highlight across a page or
  // page-size change. A fresh filter Apply intentionally resets all of them.
  const navParams = (nextPage: number, nextLimit: number) => {
    const p = formToParams(form);
    if (nextPage > 0) p.set('page', String(nextPage));
    if (nextLimit !== DEFAULT_LIMIT) p.set('limit', String(nextLimit));
    if (fp) p.set('fp', fp);
    setParams(p);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={card}>
        <FilterBuilder value={form} onApply={(f) => setParams(formToParams(f))} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-blue-40">
          Page size
          <select className={inputCls} value={limit} onChange={(e) => navParams(0, Number(e.target.value))}>
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={btnGhost} onClick={() => navigate('/saved-searches', { state: { form } })}>
          Save as search
        </button>
      </div>

      <QueryState query={q} isEmpty={(r) => r.jobs.length === 0} emptyMessage="No jobs match this filter.">
        {(r) => (
          <div className={`${card} flex flex-col gap-3`}>
            <ResultsTable jobs={r.jobs} highlightFingerprint={fp} />
            <Pagination total={r.total} limit={r.limit} offset={r.offset} onPage={(pg) => navParams(pg, limit)} />
          </div>
        )}
      </QueryState>
    </div>
  );
}
