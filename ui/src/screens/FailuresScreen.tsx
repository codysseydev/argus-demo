import { Link, useSearchParams } from 'react-router-dom';
import { buildFilter, failuresDrilldownForm, formToParams, paramsToForm } from '../api/filter';
import type { FailureGroup } from '../api/types';
import { formatDateTime, shortFingerprint } from '../lib/format';
import { FilterBuilder } from '../components/FilterBuilder';
import { QueryState } from '../components/query/QueryState';
import { card } from '../lib/ui';
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
      <div className={card}>
        <FilterBuilder value={form} onApply={(f) => setParams(formToParams(f))} />
      </div>

      <QueryState query={q} isEmpty={(g) => g.length === 0} emptyMessage="No failures in this window.">
        {(groups) => (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div key={g.fingerprint} className={`${card} flex flex-col gap-1`}>
                <div className="flex items-center justify-between">
                  <code className="text-xs font-medium text-blue-40">{shortFingerprint(g.fingerprint)}</code>
                  <span className="text-sm font-semibold text-white">count: {g.count}</span>
                </div>
                <p className="text-sm text-white-whisper">{g.representativeMessage}</p>
                <div className="flex items-center justify-between text-xs text-blue-40">
                  <span>
                    first {formatDateTime(g.firstSeen)} · last {formatDateTime(g.lastSeen)}
                  </span>
                  <Link to={drilldownTo(g)} className="font-medium text-blue-periwinkle hover:underline">
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
