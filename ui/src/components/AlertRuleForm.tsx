import { useMemo, useState } from 'react';
import {
  ALERT_CONDITION_LABELS,
  ALERT_CONDITION_TYPES,
  type AlertComparison,
  type AlertConditionType,
  type AlertRule,
  type AlertRuleInput,
} from '../api/types';
import { errorCls, inputCls, labelCls } from '../lib/formStyles';
import { btnPrimary } from '../lib/ui';

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

/** Define a condition/threshold alert over a saved search, with comma-separated sinks. */
export function AlertRuleForm({ initial, onSubmit, submitting, errors }: Props) {
  const seed = useMemo(
    () => ({
      name: initial?.name ?? '',
      threshold: initial ? String(initial.threshold) : '',
      conditionType: (initial?.conditionType ?? 'count') as AlertConditionType,
      comparison: (initial?.comparison ?? 'gt') as AlertComparison,
      stuckSeconds: initial?.stuckSeconds != null ? String(initial.stuckSeconds) : '',
      windowSeconds: initial ? String(initial.windowSeconds) : '',
      cooldownSeconds: initial ? String(initial.cooldownSeconds) : '',
      sinks: initial ? initial.sinks.join(', ') : '',
      enabled: initial ? initial.enabled : true,
    }),
    [initial],
  );

  const [name, setName] = useState(seed.name);
  const [threshold, setThreshold] = useState(seed.threshold);
  const [conditionType, setConditionType] = useState<AlertConditionType>(seed.conditionType);
  const [comparison, setComparison] = useState<AlertComparison>(seed.comparison);
  const [stuckSeconds, setStuckSeconds] = useState(seed.stuckSeconds);
  const [windowSeconds, setWindowSeconds] = useState(seed.windowSeconds);
  const [cooldownSeconds, setCooldownSeconds] = useState(seed.cooldownSeconds);
  const [sinks, setSinks] = useState(seed.sinks);
  const [enabled, setEnabled] = useState(seed.enabled);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const isStuck = conditionType === 'stuck_count';

  const submit = () => {
    const next: Record<string, string> = {};
    const t = Number(threshold);
    const w = Number(windowSeconds);
    const cd = Number(cooldownSeconds);
    const stuck = Number(stuckSeconds);
    if (!name.trim()) next.name = 'Name is required.';
    if (threshold === '' || Number.isNaN(t) || t < 0) next.threshold = 'Threshold must be ≥ 0.';
    if (windowSeconds === '' || Number.isNaN(w) || w < 1) next.windowSeconds = 'Window must be ≥ 1 second.';
    if (cooldownSeconds === '' || Number.isNaN(cd) || cd < 0) next.cooldownSeconds = 'Cooldown must be ≥ 0.';
    if (isStuck && (stuckSeconds === '' || Number.isNaN(stuck) || stuck < 1))
      next.stuckSeconds = 'Stuck age must be ≥ 1 second.';
    setLocalErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      name: name.trim(),
      threshold: t,
      conditionType,
      comparison,
      stuckSeconds: isStuck ? stuck : null,
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
          Condition
          <select
            className={inputCls}
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value as AlertConditionType)}
          >
            {ALERT_CONDITION_TYPES.map((c) => (
              <option key={c} value={c}>
                {ALERT_CONDITION_LABELS[c]}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          Comparison
          <select
            className={inputCls}
            value={comparison}
            onChange={(e) => setComparison(e.target.value as AlertComparison)}
          >
            <option value="gt">greater than</option>
            <option value="lt">less than</option>
          </select>
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

        {isStuck ? (
          <label className={labelCls}>
            Stuck after (seconds)
            <input
              className={inputCls}
              type="number"
              value={stuckSeconds}
              onChange={(e) => setStuckSeconds(e.target.value)}
            />
            {fieldError('stuckSeconds') ? <span className={errorCls}>{fieldError('stuckSeconds')}</span> : null}
          </label>
        ) : null}

        <label className={labelCls}>
          Window (seconds)
          <input
            className={inputCls}
            type="number"
            value={windowSeconds}
            onChange={(e) => setWindowSeconds(e.target.value)}
          />
          {fieldError('windowSeconds') ? <span className={errorCls}>{fieldError('windowSeconds')}</span> : null}
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

        <label className="flex items-center gap-2 self-end text-xs font-medium text-blue-40">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
      </div>

      <div>
        <button type="button" className={btnPrimary} disabled={submitting} onClick={submit}>
          {initial ? 'Update rule' : 'Add rule'}
        </button>
      </div>
    </div>
  );
}
