import { Link, useLocation } from 'react-router-dom';
import { validationErrorsOf } from '../api/errors';
import { buildFilter, type FilterFormState } from '../api/filter';
import { QueryState } from '../components/query/QueryState';
import { MutationError } from '../components/query/states';
import { SavedSearchForm } from '../components/SavedSearchForm';
import { btnDanger, card, pageHeading, sectionHeading } from '../lib/ui';
import { useCreateSavedSearch, useDeleteSavedSearch, useSavedSearches } from '../hooks/useSavedSearches';

/** Lists saved searches and offers a "new saved search" form, optionally prefilled. */
export function SavedSearchesScreen() {
  const q = useSavedSearches();
  const loc = useLocation();
  const prefill = loc.state?.form as FilterFormState | undefined;
  const create = useCreateSavedSearch();
  const del = useDeleteSavedSearch();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h1 className={pageHeading}>Saved searches</h1>
        <QueryState query={q} isEmpty={(l) => l.length === 0} emptyMessage="No saved searches yet.">
          {(list) => (
            <ul className="flex flex-col divide-y divide-blue-10 overflow-hidden rounded-2xl border border-blue-20 bg-blue-cosmic">
              {list.map((ss) => (
                <li key={ss.id} className="flex items-center justify-between px-4 py-3">
                  <Link to={`/saved-searches/${ss.id}`} className="font-medium text-blue-periwinkle hover:underline">
                    {ss.name}
                  </Link>
                  <button type="button" className={btnDanger} onClick={() => del.mutate(ss.id)}>
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
        <h2 className={sectionHeading}>New saved search</h2>
        <div className={card}>
          <SavedSearchForm
            initialName=""
            initialFilter={prefill ? buildFilter(prefill) : {}}
            submitting={create.isPending}
            errors={validationErrorsOf(create.error)}
            onSubmit={(v) => create.mutate(v)}
          />
        </div>
        <MutationError error={create.error} />
      </section>
    </div>
  );
}
