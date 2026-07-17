import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import apiClient from '../services/api-client';
import { StatusBadge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import formatDuration from '../utils/format-duration';

function generateBatchId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Groups raw one-row-per-part history into one card per visit (batch_id) —
// every part changed in the same submission is one job, so a 3-part visit
// reads as one card, not three.
function groupHistoryByBatch(history) {
  const byBatch = new Map();
  for (const h of history) {
    const existing = byBatch.get(h.batch_id);
    if (existing) {
      existing.parts.push(h.part_name);
      if (new Date(h.repaired_at) < new Date(existing.repaired_at)) {
        existing.repaired_at = h.repaired_at;
      }
    } else {
      byBatch.set(h.batch_id, {
        id: h.id,
        batch_id: h.batch_id,
        repaired_at: h.repaired_at,
        duration_seconds: h.duration_seconds,
        notes: h.notes,
        parts: [h.part_name],
      });
    }
  }
  return Array.from(byBatch.values()).sort(
    (a, b) => new Date(b.repaired_at) - new Date(a.repaired_at)
  );
}

export default function BatteryDetailScreen() {
  const { code } = useRoute().params;
  const navigation = useNavigation();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [parts, setParts] = useState([]);
  const [selectedPartIds, setSelectedPartIds] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [testingElapsedSeconds, setTestingElapsedSeconds] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/batteries/${encodeURIComponent(code)}`);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (result?.battery?.status !== 'in_progress') return;
    apiClient
      .get('/parts')
      .then(({ data }) => setParts(data))
      .catch(() => setParts([]));
  }, [result?.battery?.status]);

  // Live "time on this repair so far" — ticks every second while work is in
  // progress, right up until Mark Complete is tapped.
  const workStartedAt = result?.battery?.work_started_at;
  useEffect(() => {
    if (result?.battery?.status !== 'in_progress' || !workStartedAt) return;
    const startMs = new Date(workStartedAt).getTime();
    function tick() {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [result?.battery?.status, workStartedAt]);

  // Same live ticker for the testing phase — "In Testing" is reached
  // automatically once repairs are logged; a technician still needs to
  // verify the battery works before marking it Completed.
  const testingStartedAt = result?.battery?.testing_started_at;
  useEffect(() => {
    if (result?.battery?.status !== 'in_testing' || !testingStartedAt) return;
    const startMs = new Date(testingStartedAt).getTime();
    function tick() {
      setTestingElapsedSeconds(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [result?.battery?.status, testingStartedAt]);

  async function handleStartWork() {
    setSubmitting(true);
    setActionError(null);
    try {
      await apiClient.patch(`/batteries/${result.battery.id}/start-work`);
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteTesting() {
    setSubmitting(true);
    setActionError(null);
    try {
      await apiClient.patch(`/batteries/${result.battery.id}/complete-testing`);
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function togglePart(id) {
    setSelectedPartIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleComplete() {
    if (selectedPartIds.length === 0) {
      setActionError('Select at least one part');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const batchId = generateBatchId();
      for (const partId of selectedPartIds) {
        await apiClient.post('/repairs', {
          batteryId: result.battery.id,
          partId,
          notes: notes || undefined,
          batchId,
        });
      }
      setSelectedPartIds([]);
      setNotes('');
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-950">
        <ActivityIndicator color="#60a5fa" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-950 px-6">
        <Text className="mb-4 text-center text-sm text-red-400">{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="rounded-md bg-surface-800 px-4 py-2.5">
          <Text className="text-sm font-medium text-neutral-200">Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { battery, history } = result;
  const visits = groupHistoryByBatch(history);
  const repairVisits = visits.length;
  const totalSpent = history.reduce((sum, h) => sum + Number(h.price || 0) + Number(h.labor_charge || 0), 0);

  return (
    <ScrollView className="flex-1 bg-surface-950" contentContainerClassName="p-5 pb-10">
      <Text className="text-2xl font-bold text-neutral-100">{battery.battery_code}</Text>
      <Text className="mb-4 text-sm text-neutral-400">Full intake-to-return history.</Text>

      <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-blue-800/40 bg-blue-900/10 p-4">
        <StatusBadge status={battery.status} />
        {battery.client_name && (
          <Text className="text-xs text-neutral-400">Client: {battery.client_name}</Text>
        )}
      </View>

      {actionError && <Text className="mb-4 text-sm text-red-400">{actionError}</Text>}

      {battery.status === 'in_repair' && (
        <View className="mb-5 rounded-xl border border-blue-800/40 bg-blue-900/10 p-5">
          <Text className="mb-1 text-sm font-semibold text-neutral-100">Ready to start?</Text>
          <Text className="mb-4 text-sm text-neutral-400">
            This battery hasn't been touched yet. Starting work marks it as in progress.
          </Text>
          <TouchableOpacity
            onPress={handleStartWork}
            disabled={submitting}
            className="items-center rounded-lg bg-blue-600 py-3.5 disabled:opacity-50"
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-semibold text-white">Start Work</Text>}
          </TouchableOpacity>
        </View>
      )}

      {battery.status === 'in_progress' && (
        <View className="mb-5 rounded-xl border border-blue-800/40 bg-blue-900/10 p-5">
          <View className="mb-4 flex-row items-center justify-between rounded-lg bg-emerald-500/10 px-4 py-3">
            <Text className="text-xs font-medium text-emerald-300">Time on this repair</Text>
            <Text className="text-xl font-bold text-emerald-300">
              {formatDuration(elapsedSeconds)}
            </Text>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-neutral-100">Parts Changed</Text>
            <Text className="text-xs font-medium text-neutral-400">
              {selectedPartIds.length} selected
            </Text>
          </View>

          <View className="gap-2">
            {parts.map((p) => {
              const selected = selectedPartIds.includes(p.id);
              const disabled = p.quantity <= 0;
              return (
                <TouchableOpacity
                  key={p.id}
                  disabled={disabled}
                  onPress={() => togglePart(p.id)}
                  className={`flex-row items-center justify-between rounded-lg border p-3 ${
                    selected ? 'border-blue-500 bg-blue-500/10' : 'border-surface-700 bg-surface-800/60'
                  } ${disabled ? 'opacity-40' : ''}`}
                >
                  <Text className="text-sm font-medium text-neutral-100">{p.name}</Text>
                  <Text className="text-xs text-neutral-400">{p.quantity} in stock</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (optional)"
            placeholderTextColor="#6b7280"
            className="mt-4 rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 text-base text-neutral-100"
          />

          <TouchableOpacity
            onPress={handleComplete}
            disabled={submitting}
            className="mt-4 items-center rounded-lg bg-blue-600 py-3.5 disabled:opacity-50"
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-semibold text-white">Submit for Testing</Text>}
          </TouchableOpacity>
        </View>
      )}

      {battery.status === 'in_testing' && (
        <View className="mb-5 rounded-xl border border-blue-800/40 bg-blue-900/10 p-5">
          <View className="mb-4 flex-row items-center justify-between rounded-lg bg-blue-500/10 px-4 py-3">
            <Text className="text-xs font-medium text-blue-300">Time in testing</Text>
            <Text className="text-xl font-bold text-blue-300">
              {formatDuration(testingElapsedSeconds)}
            </Text>
          </View>

          <Text className="mb-1 text-sm font-semibold text-neutral-100">Ready to confirm?</Text>
          <Text className="mb-4 text-sm text-neutral-400">
            Parts have been changed — verify the battery works, then mark it tested.
          </Text>
          <TouchableOpacity
            onPress={handleCompleteTesting}
            disabled={submitting}
            className="items-center rounded-lg bg-blue-600 py-3.5 disabled:opacity-50"
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-semibold text-white">Complete</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View className="mb-5 flex-row gap-3">
        <StatCard label="Repairs Logged" value={repairVisits} tone="good" />
        <StatCard label="Total Cost" value={`£${totalSpent.toFixed(2)}`} tone="warning" />
      </View>

      <Text className="mb-3 text-sm font-semibold text-neutral-100">Recent Repairs</Text>
      {visits.length === 0 ? (
        <Text className="py-6 text-center text-sm text-neutral-500">No repairs logged yet.</Text>
      ) : (
        <View className="gap-2">
          {visits.map((v) => (
            <View key={v.batch_id} className="rounded-lg border border-surface-700 bg-surface-900 p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-neutral-100">{v.parts.join(', ')}</Text>
                <Text className="text-xs text-neutral-500">
                  {new Date(v.repaired_at).toLocaleDateString()}
                </Text>
              </View>
              {v.notes && <Text className="mt-1 text-xs text-neutral-400">{v.notes}</Text>}
              {typeof v.duration_seconds === 'number' && (
                <Text className="mt-1 text-xs text-neutral-500">
                  Took {formatDuration(v.duration_seconds)}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
