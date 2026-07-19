import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../services/api-client';
import { StatusBadge } from '../components/Badge';
import formatDuration from '../utils/format-duration';

// Combines repairs and reported issues into one newest-first timeline —
// each entry tagged with its `kind` so renderItem can style them
// differently while sharing a single sorted, scrollable list.
function buildTimeline(repairs, issues) {
  const repairEntries = repairs.map((r) => ({ ...r, kind: 'repair', sortDate: r.repaired_at }));
  const issueEntries = issues.map((i) => ({ ...i, kind: 'issue', sortDate: i.reported_at }));
  return [...repairEntries, ...issueEntries].sort(
    (a, b) => new Date(b.sortDate) - new Date(a.sortDate)
  );
}

// Every repair the logged-in technician has ever logged, plus every
// "can't service" issue they've reported, newest first.
export default function HistoryScreen() {
  const navigation = useNavigation();
  const [timeline, setTimeline] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setError(null);
    return apiClient
      .get('/staff/me')
      .then(({ data }) => setTimeline(buildTimeline(data.repairs, data.issues || [])))
      .catch((err) => setError(err.response?.data?.message || err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (timeline === null && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 px-5 pt-8">
      <Text className="text-2xl font-bold text-slate-900">My Repair History</Text>
      <Text className="mb-4 text-sm text-slate-500">Every repair and reported issue you've logged.</Text>

      {error && <Text className="mb-4 text-sm text-red-600">{error}</Text>}

      <FlatList
        data={timeline || []}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerClassName="gap-2 pb-10"
        ListEmptyComponent={
          <Text className="py-10 text-center text-sm text-slate-400">Nothing logged yet.</Text>
        }
        renderItem={({ item }) =>
          item.kind === 'issue' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('BatteryDetail', { code: item.battery_code })}
              className="rounded-lg border border-red-100 bg-red-50 p-3.5"
            >
              <View className="mb-1 flex-row flex-wrap items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="font-medium text-red-700">{item.battery_code}</Text>
                  <StatusBadge status={item.battery_status} />
                </View>
                <Text className="text-xs text-slate-400">
                  {new Date(item.reported_at).toLocaleString()}
                </Text>
              </View>
              <Text className="text-sm text-red-600">Reported: {item.reason_label}</Text>
              {item.note && <Text className="mt-0.5 text-xs text-slate-400">{item.note}</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('BatteryDetail', { code: item.battery_code })}
              className="rounded-lg border border-blue-100 bg-blue-50 p-3.5"
            >
              <View className="mb-1 flex-row flex-wrap items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="font-medium text-blue-700">{item.battery_code}</Text>
                  <StatusBadge status={item.battery_status} />
                </View>
                <Text className="text-xs text-slate-400">
                  {new Date(item.repaired_at).toLocaleString()}
                </Text>
              </View>
              <Text className="text-sm text-slate-500">
                {item.part_name?.includes(',') ? 'Parts changed:' : 'Part changed:'} {item.part_name}
              </Text>
              {typeof item.duration_seconds === 'number' && (
                <Text className="mt-0.5 text-xs text-slate-400">
                  Took {formatDuration(item.duration_seconds)}
                </Text>
              )}
              {item.notes && <Text className="mt-0.5 text-xs text-slate-400">{item.notes}</Text>}
            </TouchableOpacity>
          )
        }
      />
    </View>
  );
}
