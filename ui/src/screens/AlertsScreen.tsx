import { Link } from 'react-router-dom';
import { ALERT_CONDITION_LABELS, type AlertRule } from '../api/types';
import { AlertFiringsTable } from '../components/AlertFiringsTable';
import { StatusBadge } from '../components/StatusBadge';
import { QueryState } from '../components/query/QueryState';
import { card, pageHeading, sectionHeading, tableCls, tbodyRowCls, tdCls, theadRowCls, thCls } from '../lib/ui';
import { useAllAlertRules, useRecentFirings } from '../hooks/useAlertRules';

const RULE_HEADERS = ['Name', 'Condition', 'State', 'Saved search'];

/** Read-only overview of every alert rule, each linking to its saved search. */
function RulesOverview({ rules }: { rules: AlertRule[] }) {
  return (
    <div className="overflow-x-auto">
      <table className={tableCls}>
        <thead>
          <tr className={theadRowCls}>
            {RULE_HEADERS.map((h) => (
              <th key={h} className={thCls}>
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
                {ALERT_CONDITION_LABELS[rule.conditionType]} {rule.comparison === 'lt' ? '<' : '>'} {rule.threshold}
              </td>
              <td className={tdCls}>
                <StatusBadge status={rule.state} />
              </td>
              <td className={tdCls}>
                <Link
                  to={`/saved-searches/${rule.savedSearchId}`}
                  className="text-blue-periwinkle hover:underline"
                >
                  edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Global alerting view: every rule plus the recent firing history across all rules. */
export function AlertsScreen() {
  const rulesQuery = useAllAlertRules();
  const firingsQuery = useRecentFirings();

  const ruleNames: Record<string, string> = {};
  for (const rule of rulesQuery.data ?? []) ruleNames[rule.id] = rule.name;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h1 className={pageHeading}>Alerts</h1>
        <QueryState query={rulesQuery} isEmpty={(r) => r.length === 0} emptyMessage="No alert rules defined yet.">
          {(rules) => (
            <div className={card}>
              <RulesOverview rules={rules} />
            </div>
          )}
        </QueryState>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionHeading}>Recent firings</h2>
        <QueryState
          query={firingsQuery}
          isEmpty={(f) => f.length === 0}
          emptyMessage="No alerts have fired yet."
        >
          {(firings) => (
            <div className={card}>
              <AlertFiringsTable firings={firings} ruleNames={ruleNames} />
            </div>
          )}
        </QueryState>
      </section>
    </div>
  );
}
