import { ALERT_CONDITION_LABELS, type AlertRule } from '../api/types';
import { formatDateTime } from '../lib/format';
import { btnDanger, btnGhost, tableCls, tbodyRowCls, tdCls, theadRowCls, thCls } from '../lib/ui';
import { StatusBadge } from './StatusBadge';

interface Props {
  rules: AlertRule[];
  onEdit: (rule: AlertRule) => void;
  onDelete: (id: string) => void;
}

const HEADERS = [
  'Name',
  'Condition',
  'Threshold',
  'Window (s)',
  'Cooldown (s)',
  'Sinks',
  'Enabled',
  'State',
  'Last count',
  'Last evaluated',
  '',
];

/** Dense table of a saved search's alert rules with edit/remove actions. */
export function AlertRuleList({ rules, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className={tableCls}>
        <thead>
          <tr className={theadRowCls}>
            {HEADERS.map((h, i) => (
              <th key={h || i} className={thCls}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id} className={tbodyRowCls}>
              <td className={`${tdCls} font-medium text-white`}>{rule.name}</td>
              <td className={`${tdCls} whitespace-nowrap text-blue-40`}>
                {ALERT_CONDITION_LABELS[rule.conditionType]} {rule.comparison === 'lt' ? '<' : '>'}
              </td>
              <td className={`${tdCls} tabular-nums`}>{rule.threshold}</td>
              <td className={`${tdCls} tabular-nums`}>{rule.windowSeconds}</td>
              <td className={`${tdCls} tabular-nums`}>{rule.cooldownSeconds}</td>
              <td className={`${tdCls} text-blue-40`}>{rule.sinks.join(',')}</td>
              <td className={tdCls}>{rule.enabled ? 'yes' : 'no'}</td>
              <td className={tdCls}>
                <StatusBadge status={rule.state} />
              </td>
              <td className={`${tdCls} tabular-nums text-blue-40`}>{rule.lastResultCount ?? '—'}</td>
              <td className={`${tdCls} whitespace-nowrap text-blue-40`}>{formatDateTime(rule.lastEvaluatedAt)}</td>
              <td className={`${tdCls} whitespace-nowrap`}>
                <div className="flex gap-2">
                  <button type="button" className={btnGhost} onClick={() => onEdit(rule)}>
                    Edit
                  </button>
                  <button type="button" className={btnDanger} onClick={() => onDelete(rule.id)}>
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
