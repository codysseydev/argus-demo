import { useEffect, useMemo, useState } from 'react';
import { buildFilter, filterToForm } from '../api/filter';
import type { Filter } from '../api/types';
import { errorCls, inputCls, labelCls } from '../lib/formStyles';
import { FilterBuilder } from './FilterBuilder';

interface Props {
  initialName: string;
  initialFilter: Filter;
  onSubmit: (value: { name: string; filter: Filter }) => void;
  submitting?: boolean;
  errors?: Record<string, string[]>;
}

/** Name a filter and save it: a required name plus the shared FilterBuilder. */
export function SavedSearchForm({ initialName, initialFilter, onSubmit, submitting, errors }: Props) {
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState('');
  const form = useMemo(() => filterToForm(initialFilter), [initialFilter]);

  // Re-sync the name when the loaded saved search changes (e.g. after a save
  // that normalises it), mirroring FilterBuilder's resync of the filter side.
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  // Server-side 422 messages for the filter come back under filter.* keys; show
  // any non-name messages so a server rejection is never silently dropped.
  const otherErrors = Object.entries(errors ?? {})
    .filter(([key]) => key !== 'name')
    .flatMap(([key, messages]) => messages.map((m) => `${key}: ${m}`));

  const apply = (next: ReturnType<typeof filterToForm>) => {
    if (!name.trim()) {
      setNameError('Name is required.');
      return;
    }
    setNameError('');
    onSubmit({ name: name.trim(), filter: buildFilter(next) });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className={labelCls}>
        Name
        <input
          className={inputCls}
          type="text"
          value={name}
          disabled={submitting}
          onChange={(e) => setName(e.target.value)}
        />
        {nameError ? <span className={errorCls}>{nameError}</span> : null}
        {errors?.name?.map((m) => (
          <span key={m} className={errorCls}>
            {m}
          </span>
        ))}
      </label>

      <FilterBuilder value={form} applyLabel="Save" onApply={apply} />

      {otherErrors.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {otherErrors.map((m) => (
            <li key={m} className={errorCls}>
              {m}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
