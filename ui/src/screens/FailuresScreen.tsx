import { Link, useSearchParams } from 'react-router-dom';
import { buildFilter, failuresDrilldownForm, formToParams, paramsToForm } from '../api/filter';
import type { FailureGroup } from '../api/types';
import { formatDateTime, shortFingerprint } from '../lib/format';
import { FilterBuilder } from '../components/FilterBuilder';
import { QueryState } from '../components/query/QueryState';
import { useFailureGroups } from '../hooks/useFailureGroups';

/** Build the /search drill-down URL for a failure group's window + fingerprint. */
function drilldownTo(group: FailureGroup): string {
  const p = formToParams(failuresDrilldownForm(group.firstSeen, group.lastSeen));
  p.set('fp', group.fingerprint);
  return `/search?${p.toString()}`;
}

/** Failures view: grouped exceptions for a filter window, each linking to the matching jobs. */
export function FailuresScreen() {
  const [params, setParams] = useSearchParams();
  const form = paramsToForm(params);
  const q = useFailureGroups(buildFilter(form));

  return (
    <div className="flex flex-col gap-4">
      <FilterBuilder value={form} onApply={(f) => setParams(formToParams(f))} />

      <QueryState
        query={q}
        isEmpty={(g) => g.length === 0}
        emptyMessage="No failures in this window."
      >
        {(groups) => (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div
                key={g.fingerprint}
                className="flex flex-col gap-1 rounded border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between">
                  <code className="text-xs font-medium text-slate-500">
                    {shortFingerprint(g.fingerprint)}
                  </code>
                  <span className="text-sm font-semibold text-slate-700">count: {g.count}</span>
                </div>
                <p className="text-sm text-slate-800">{g.representativeMessage}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    first {formatDateTime(g.firstSeen)} · last {formatDateTime(g.lastSeen)}
                  </span>
                  <Link to={drilldownTo(g)} className="font-medium text-blue-600 hover:text-blue-700">
                    View jobs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
