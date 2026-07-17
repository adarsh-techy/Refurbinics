import { Text, View } from 'react-native';

const TONES = {
  info: { bg: 'bg-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-300' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300' },
  good: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300' },
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-300' },
};

// icon/subtitle are optional — plain label+value still renders fine for
// existing callers that don't pass them.
export function StatCard({ label, value, tone = 'info', icon, subtitle }) {
  const { bg, border, text } = TONES[tone] || TONES.info;
  return (
    <View className={`flex-1 rounded-2xl border p-4 ${bg} ${border}`}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {label}
        </Text>
        {icon && <Text className="text-base">{icon}</Text>}
      </View>
      <Text className={`text-3xl font-bold ${text}`}>{value}</Text>
      {subtitle && <Text className="mt-1 text-xs text-neutral-500">{subtitle}</Text>}
    </View>
  );
}
