import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../services/api-client';
import { StatusBadge } from '../components/Badge';
import formatDuration from '../utils/format-duration';

// Every repair the logged-in technician has ever logged, newest first.
export default function HistoryScreen() {
  const navigation = useNavigation();
  const [repairs, setRepairs] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setError(null);
    return apiClient
      .get('/staff/me')
      .then(({ data }) => setRepairs(data.repairs))
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

  if (repairs === null && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-950">
        <ActivityIndicator color="#60a5fa" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-950 px-5 pt-8">
      <Text className="text-2xl font-bold text-neutral-100">My Repair History</Text>
      <Text className="mb-4 text-sm text-neutral-400">Every repair you've logged.</Text>

      {error && <Text className="mb-4 text-sm text-red-400">{error}</Text>}

      <FlatList
        data={repairs || []}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerClassName="gap-2 pb-10"
        ListEmptyComponent={
          <Text className="py-10 text-center text-sm text-neutral-500">No repairs logged yet.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('BatteryDetail', { code: item.battery_code })}
            className="rounded-lg border border-blue-800/40 bg-blue-900/10 p-3.5"
          >
            <View className="mb-1 flex-row flex-wrap items-center justify-between gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="font-medium text-blue-300">{item.battery_code}</Text>
                <StatusBadge status={item.battery_status} />
              </View>
              <Text className="text-xs text-neutral-500">
                {new Date(item.repaired_at).toLocaleString()}
              </Text>
            </View>
            <Text className="text-sm text-neutral-400">
              {item.part_name?.includes(',') ? 'Parts changed:' : 'Part changed:'} {item.part_name}
            </Text>
            {typeof item.duration_seconds === 'number' && (
              <Text className="mt-0.5 text-xs text-neutral-500">
                Took {formatDuration(item.duration_seconds)}
              </Text>
            )}
            {item.notes && <Text className="mt-0.5 text-xs text-neutral-500">{item.notes}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
