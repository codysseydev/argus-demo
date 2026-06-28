import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { validationErrorsOf } from '../api/errors';
import type { AlertRule, AlertRuleInput } from '../api/types';
import { AlertRuleForm } from '../components/AlertRuleForm';
import { AlertRuleList } from '../components/AlertRuleList';
import { QueryState } from '../components/query/QueryState';
import { MutationError } from '../components/query/states';
import { ResultsTable } from '../components/ResultsTable';
import { SavedSearchForm } from '../components/SavedSearchForm';
import {
  useCreateAlertRule,
  useDeleteAlertRule,
  useSavedSearchAlertRules,
  useUpdateAlertRule,
} from '../hooks/useAlertRules';
import { useSavedSearch, useSavedSearchResults, useUpdateSavedSearch } from '../hooks/useSavedSearches';

/** Edit one saved search, see its current matches, and manage its alert rules. */
export function SavedSearchScreen() {
  const { id } = useParams();
  const q = useSavedSearch(id!);
  const upd = useUpdateSavedSearch();
  const results = useSavedSearchResults(id!);
  const rq = useSavedSearchAlertRules(id!);
  const createRule = useCreateAlertRule(id!);
  const updRule = useUpdateAlertRule(id!);
  const delRule = useDeleteAlertRule(id!);
  const [editing, setEditing] = useState<AlertRule | null>(null);
  // Bumped after a successful create so the "add rule" form remounts empty.
  const [newFormNonce, setNewFormNonce] = useState(0);

  const ruleError = editing ? updRule.error : createRule.error;

  const submitRule = async (input: AlertRuleInput) => {
    try {
      if (editing) {
        await updRule.mutateAsync({ id: editing.id, input });
        setEditing(null);
      } else {
        await createRule.mutateAsync(input);
        setNewFormNonce((n) => n + 1);
      }
    } catch {
      // Failure is surfaced via MutationError / the form's errors prop; keep the
      // form populated so the user can correct and retry.
    }
  };

  return (
    <QueryState query={q} notFoundMessage="Saved search not found.">
      {(ss) => (
        <div className="flex flex-col gap-6 p-4">
          <section className="flex flex-col gap-3">
            <h1 className="text-lg font-semibold text-slate-800">{ss.name}</h1>
            <SavedSearchForm
              initialName={ss.name}
              initialFilter={ss.filter}
              submitting={upd.isPending}
              errors={validationErrorsOf(upd.error)}
              onSubmit={(v) => upd.mutate({ id: ss.id, input: v })}
            />
            <MutationError error={upd.error} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-slate-800">Current matches</h2>
            <QueryState
              query={results}
              isEmpty={(jobs) => jobs.length === 0}
              emptyMessage="This saved search matches no jobs right now."
            >
              {(jobs) => <ResultsTable jobs={jobs} />}
            </QueryState>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-slate-800">Alert rules</h2>
            <QueryState query={rq} isEmpty={(r) => r.length === 0} emptyMessage="No alert rules.">
              {(rules) => (
                <AlertRuleList
                  rules={rules}
                  // Clear any stale create error so it can't reappear after this edit.
                  onEdit={(rule) => {
                    createRule.reset();
                    setEditing(rule);
                  }}
                  onDelete={(rid) => delRule.mutate(rid)}
                />
              )}
            </QueryState>
            <MutationError error={delRule.error} />
            <AlertRuleForm
              key={editing ? editing.id : `new-${newFormNonce}`}
              initial={editing}
              submitting={createRule.isPending || updRule.isPending}
              errors={validationErrorsOf(ruleError)}
              onSubmit={submitRule}
            />
            <MutationError error={ruleError} />
          </section>
        </div>
      )}
    </QueryState>
  );
}
