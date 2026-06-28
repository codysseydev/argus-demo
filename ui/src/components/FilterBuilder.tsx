import { useEffect, useState } from 'react';
import { type FilterFormState, toLocalInput, validateForm } from '../api/filter';
import { TRANSITION_TYPES } from '../api/types';
import { errorCls, inputCls, labelCls } from '../lib/formStyles';

interface Props {
  value: FilterFormState;
  onApply: (form: FilterFormState) => void;
  applyLabel?: string;
}

const QUICK_PICKS: { label: string; ms: number }[] = [
  { label: '15m', ms: 15 * 60_000 },
  { label: '1h', ms: 60 * 60_000 },
  { label: '24h', ms: 24 * 60 * 60_000 },
  { label: '7d', ms: 7 * 24 * 60 * 60_000 },
];

/** Editable filter form: labeled inputs, time quick-picks, and validated apply. */
export function FilterBuilder({ value, onApply, applyLabel = 'Apply' }: Props) {
  const [form, setForm] = useState<FilterFormState>(value);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-sync the local copy whenever the parent pushes a different value.
  useEffect(() => {
    setForm(value);
  }, [JSON.stringify(value)]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof FilterFormState, v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const applyQuickPick = (ms: number) => {
    const now = new Date();
    const start = new Date(now.getTime() - ms);
    setForm((prev) => ({
      ...prev,
      since: toLocalInput(start.toISOString()),
      until: toLocalInput(now.toISOString()),
    }));
  };

  const apply = () => {
    const next = validateForm(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onApply(form);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <label className={labelCls}>
          Tenant ID
          <input
            className={inputCls}
            type="text"
            value={form.tenantId}
            onChange={(e) => set('tenantId', e.target.value)}
          />
        </label>

        <label className={labelCls}>
          Status
          <select
            className={inputCls}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          >
            <option value="">Any status</option>
            {TRANSITION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          Job class
          <input
            className={inputCls}
            type="text"
            value={form.jobClass}
            onChange={(e) => set('jobClass', e.target.value)}
          />
        </label>

        <label className={labelCls}>
          Queue
          <input
            className={inputCls}
            type="text"
            value={form.queue}
            onChange={(e) => set('queue', e.target.value)}
          />
        </label>

        <label className={labelCls}>
          Min attempts
          <input
            className={inputCls}
            type="number"
            value={form.attemptMin}
            onChange={(e) => set('attemptMin', e.target.value)}
          />
          {errors.attemptMin ? <span className={errorCls}>{errors.attemptMin}</span> : null}
        </label>

        <label className={labelCls}>
          Max attempts
          <input
            className={inputCls}
            type="number"
            value={form.attemptMax}
            onChange={(e) => set('attemptMax', e.target.value)}
          />
          {errors.attemptMax ? <span className={errorCls}>{errors.attemptMax}</span> : null}
        </label>

        <label className={labelCls}>
          Since
          <input
            className={inputCls}
            type="datetime-local"
            value={form.since}
            onChange={(e) => set('since', e.target.value)}
          />
          {errors.since ? <span className={errorCls}>{errors.since}</span> : null}
        </label>

        <label className={labelCls}>
          Until
          <input
            className={inputCls}
            type="datetime-local"
            value={form.until}
            onChange={(e) => set('until', e.target.value)}
          />
          {errors.until ? <span className={errorCls}>{errors.until}</span> : null}
        </label>

        <label className={labelCls}>
          Correlation key
          <input
            className={inputCls}
            type="text"
            value={form.correlationKey}
            onChange={(e) => set('correlationKey', e.target.value)}
          />
          {errors.correlationKey ? (
            <span className={errorCls}>{errors.correlationKey}</span>
          ) : null}
        </label>

        <label className={labelCls}>
          Correlation value
          <input
            className={inputCls}
            type="text"
            value={form.correlationValue}
            onChange={(e) => set('correlationValue', e.target.value)}
          />
          {errors.correlationValue ? (
            <span className={errorCls}>{errors.correlationValue}</span>
          ) : null}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Window:</span>
        {QUICK_PICKS.map((q) => (
          <button
            key={q.label}
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => applyQuickPick(q.ms)}
          >
            {q.label}
          </button>
        ))}
        <button
          type="button"
          className="ml-auto rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          onClick={apply}
        >
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
