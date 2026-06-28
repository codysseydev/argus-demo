import type { AlertRule } from '../api/types';
import { formatDateTime } from '../lib/format';
import { StatusBadge } from './StatusBadge';

interface Props {
  rules: AlertRule[];
  onEdit: (rule: AlertRule) => void;
  onDelete: (id: string) => void;
}

const HEADERS = [
  'Name',
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
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
          {HEADERS.map((h, i) => (
            <th key={h || i} className="px-2 py-1.5 font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rules.map((rule) => (
          <tr key={rule.id} className="border-b border-slate-100">
            <td className="px-2 py-1.5 font-medium text-slate-800">{rule.name}</td>
            <td className="px-2 py-1.5 tabular-nums">{rule.threshold}</td>
            <td className="px-2 py-1.5 tabular-nums">{rule.windowSeconds}</td>
            <td className="px-2 py-1.5 tabular-nums">{rule.cooldownSeconds}</td>
            <td className="px-2 py-1.5 text-slate-600">{rule.sinks.join(',')}</td>
            <td className="px-2 py-1.5">{rule.enabled ? 'yes' : 'no'}</td>
            <td className="px-2 py-1.5">
              <StatusBadge status={rule.state} />
            </td>
            <td className="px-2 py-1.5 tabular-nums text-slate-600">{rule.lastResultCount ?? '—'}</td>
            <td className="px-2 py-1.5 whitespace-nowrap text-slate-600">
              {formatDateTime(rule.lastEvaluatedAt)}
            </td>
            <td className="px-2 py-1.5 whitespace-nowrap">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => onEdit(rule)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(rule.id)}
                >
                  Remove
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
