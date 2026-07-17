import { Text, View } from 'react-native';

const TONES = {
  info: { bg: 'bg-sky-500/15', text: 'text-sky-300' },
  warning: { bg: 'bg-amber-500/15', text: 'text-amber-300' },
  good: { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  critical: { bg: 'bg-red-500/15', text: 'text-red-300' },
  testing: { bg: 'bg-blue-500/15', text: 'text-blue-300' },
  neutral: { bg: 'bg-surface-700', text: 'text-neutral-300' },
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

export function Badge({ tone = 'neutral', children }) {
  const { bg, text } = TONES[tone] || TONES.neutral;
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{children}</Text>
    </View>
  );
}

// Convenience wrapper for the battery status enum specifically.
export function StatusBadge({ status }) {
  const meta = STATUS_MAP[status] || { tone: 'neutral', label: status };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
