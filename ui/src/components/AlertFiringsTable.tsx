import { ALERT_CONDITION_LABELS, type AlertFiring } from '../api/types';
import { formatDateTime } from '../lib/format';
import { tableCls, tbodyRowCls, tdCls, theadRowCls, thCls } from '../lib/ui';

interface Props {
  firings: AlertFiring[];
  /** Maps alertRuleId -> rule name; falls back to the id when unknown. */
  ruleNames?: Record<string, string>;
}

const HEADERS = ['Fired at', 'Rule', 'Condition', 'Observed', 'Threshold', 'Window (s)'];

/** Append-only history of alert firings, most recent first. */
export function AlertFiringsTable({ firings, ruleNames }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className={tableCls}>
        <thead>
          <tr className={theadRowCls}>
            {HEADERS.map((h) => (
              <th key={h} className={thCls}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {firings.map((f) => (
            <tr key={f.id} className={tbodyRowCls}>
              <td className={`${tdCls} whitespace-nowrap text-white-whisper`}>{formatDateTime(f.firedAt)}</td>
              <td className={`${tdCls} text-white`}>{ruleNames?.[f.alertRuleId] ?? f.alertRuleId}</td>
              <td className={`${tdCls} whitespace-nowrap text-blue-40`}>{ALERT_CONDITION_LABELS[f.conditionType]}</td>
              <td className={`${tdCls} tabular-nums text-red-300`}>{f.observedValue}</td>
              <td className={`${tdCls} tabular-nums`}>{f.threshold}</td>
              <td className={`${tdCls} tabular-nums`}>{f.windowSeconds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
