import { useMemo, useState } from 'react';
import type { AlertRule, AlertRuleInput } from '../api/types';
import { errorCls, inputCls, labelCls } from '../lib/formStyles';

interface Props {
  initial?: AlertRule | null;
  onSubmit: (input: AlertRuleInput) => void;
  submitting?: boolean;
  errors?: Record<string, string[]>;
}

function parseSinks(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

/** Define a threshold/window alert over a saved search, with comma-separated sinks. */
export function AlertRuleForm({ initial, onSubmit, submitting, errors }: Props) {
  const seed = useMemo(
    () => ({
      name: initial?.name ?? '',
      threshold: initial ? String(initial.threshold) : '',
      windowSeconds: initial ? String(initial.windowSeconds) : '',
      cooldownSeconds: initial ? String(initial.cooldownSeconds) : '',
      sinks: initial ? initial.sinks.join(', ') : '',
      enabled: initial ? initial.enabled : true,
    }),
    [initial],
  );

  const [name, setName] = useState(seed.name);
  const [threshold, setThreshold] = useState(seed.threshold);
  const [windowSeconds, setWindowSeconds] = useState(seed.windowSeconds);
  const [cooldownSeconds, setCooldownSeconds] = useState(seed.cooldownSeconds);
  const [sinks, setSinks] = useState(seed.sinks);
  const [enabled, setEnabled] = useState(seed.enabled);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    const t = Number(threshold);
    const w = Number(windowSeconds);
    const cd = Number(cooldownSeconds);
    if (!name.trim()) next.name = 'Name is required.';
    if (threshold === '' || Number.isNaN(t) || t < 0) next.threshold = 'Threshold must be ≥ 0.';
    if (windowSeconds === '' || Number.isNaN(w) || w < 1) next.windowSeconds = 'Window must be ≥ 1 second.';
    if (cooldownSeconds === '' || Number.isNaN(cd) || cd < 0) next.cooldownSeconds = 'Cooldown must be ≥ 0.';
    setLocalErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      name: name.trim(),
      threshold: t,
      windowSeconds: w,
      cooldownSeconds: cd,
      sinks: parseSinks(sinks),
      enabled,
    });
  };

  const fieldError = (key: string) => localErrors[key] ?? errors?.[key]?.[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className={labelCls}>
          Rule name
          <input className={inputCls} type="text" value={name} onChange={(e) => setName(e.target.value)} />
          {fieldError('name') ? <span className={errorCls}>{fieldError('name')}</span> : null}
        </label>

        <label className={labelCls}>
          Threshold
          <input
            className={inputCls}
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          {fieldError('threshold') ? <span className={errorCls}>{fieldError('threshold')}</span> : null}
        </label>

        <label className={labelCls}>
          Window (seconds)
          <input
            className={inputCls}
            type="number"
            value={windowSeconds}
            onChange={(e) => setWindowSeconds(e.target.value)}
          />
          {fieldError('windowSeconds') ? (
            <span className={errorCls}>{fieldError('windowSeconds')}</span>
          ) : null}
        </label>

        <label className={labelCls}>
          Cooldown (seconds)
          <input
            className={inputCls}
            type="number"
            value={cooldownSeconds}
            onChange={(e) => setCooldownSeconds(e.target.value)}
          />
          {fieldError('cooldownSeconds') ? (
            <span className={errorCls}>{fieldError('cooldownSeconds')}</span>
          ) : null}
        </label>

        <label className={labelCls}>
          Sinks
          <input
            className={inputCls}
            type="text"
            placeholder="slack, webhook"
            value={sinks}
            onChange={(e) => setSinks(e.target.value)}
          />
          {fieldError('sinks') ? <span className={errorCls}>{fieldError('sinks')}</span> : null}
        </label>

        <label className="flex items-center gap-2 self-end text-xs font-medium text-slate-600">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>

      <div>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={submitting}
          onClick={submit}
        >
          {initial ? 'Update rule' : 'Add rule'}
        </button>
      </div>
    </div>
  );
}
