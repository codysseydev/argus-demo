import { Link, useLocation } from 'react-router-dom';
import { validationErrorsOf } from '../api/errors';
import { buildFilter, type FilterFormState } from '../api/filter';
import { QueryState } from '../components/query/QueryState';
import { MutationError } from '../components/query/states';
import { SavedSearchForm } from '../components/SavedSearchForm';
import { useCreateSavedSearch, useDeleteSavedSearch, useSavedSearches } from '../hooks/useSavedSearches';

/** Lists saved searches and offers a "new saved search" form, optionally prefilled. */
export function SavedSearchesScreen() {
  const q = useSavedSearches();
  const loc = useLocation();
  const prefill = loc.state?.form as FilterFormState | undefined;
  const create = useCreateSavedSearch();
  const del = useDeleteSavedSearch();

  return (
    <div className="flex flex-col gap-6 p-4">
      <section className="flex flex-col gap-3">
        <h1 className="text-lg font-semibold text-slate-800">Saved searches</h1>
        <QueryState query={q} isEmpty={(l) => l.length === 0} emptyMessage="No saved searches yet.">
          {(list) => (
            <ul className="flex flex-col divide-y divide-slate-100 rounded border border-slate-200">
              {list.map((ss) => (
                <li key={ss.id} className="flex items-center justify-between px-3 py-2">
                  <Link to={`/saved-searches/${ss.id}`} className="font-medium text-blue-700 hover:underline">
                    {ss.name}
                  </Link>
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    onClick={() => del.mutate(ss.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </QueryState>
        <MutationError error={del.error} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-800">New saved search</h2>
        <SavedSearchForm
          initialName=""
          initialFilter={prefill ? buildFilter(prefill) : {}}
          submitting={create.isPending}
          errors={validationErrorsOf(create.error)}
          onSubmit={(v) => create.mutate(v)}
        />
        <MutationError error={create.error} />
      </section>
    </div>
  );
}
