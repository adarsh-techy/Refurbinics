const TONES = {
  info: 'border border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300',
  warning: 'bg-warning-50 text-warning-700 dark:bg-amber-500/15 dark:text-amber-300',
  good: 'bg-brand-50 text-brand-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  critical: 'bg-critical-50 text-critical-700 dark:bg-red-500/15 dark:text-red-300',
  testing: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-surface-700 dark:text-neutral-300',
};

// battery/status strings from the API (snake_case) mapped to a tone +
// professional display label.
const STATUS_MAP = {
  in_repair: { tone: 'warning', label: 'Pending' },
  in_progress: { tone: 'critical', label: 'In Progress' },
  in_testing: { tone: 'testing', label: 'In Testing' },
  repaired: { tone: 'good', label: 'Completed' },
  returned: { tone: 'info', label: 'Returned' },
};

function Badge({ tone = 'neutral', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

// Convenience wrapper for the battery status enum specifically, since it
// shows up on the Batteries table, the lookup panel, and the Repair form.
export function StatusBadge({ status }) {
  const meta = STATUS_MAP[status] || { tone: 'neutral', label: status };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export default Badge;
