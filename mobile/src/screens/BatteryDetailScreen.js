import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import apiClient from '../services/api-client';
import { StatusBadge } from '../components/Badge';
import formatDuration from '../utils/format-duration';

function generateBatchId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Shown in the blocking popup when a scanned/searched battery isn't a fresh
// intake — keyed by the battery's actual status so the message is specific.
const BLOCKED_STATUS_MESSAGES = {
  in_progress: 'This battery is already being worked on by another technician.',
  in_testing: 'This battery is currently in testing.',
  repaired: 'This battery has already been repaired.',
  returned: 'This battery has already been returned to the client.',
  unserviceable: 'This battery has been marked unserviceable.',
};

export default function BatteryDetailScreen() {
  const { code, fromScan } = useRoute().params;
  const navigation = useNavigation();
  const currentUserId = useSelector((state) => state.auth.user?.id);

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

  const [blockedStatus, setBlockedStatus] = useState(null);
  const [showCompletedModal, setShowCompletedModal] = useState(false);

  const [issueReasons, setIssueReasons] = useState([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedReasonId, setSelectedReasonId] = useState(null);
  const [issueNote, setIssueNote] = useState('');

  // Only the very first load of a scanned/searched battery should be
  // blocked for not being a fresh intake — reloads triggered by this
  // technician's own actions (e.g. handleStartWork) must not re-trigger it.
  const isInitialLoad = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/batteries/${encodeURIComponent(code)}`);
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        // The technician who already claimed this battery (started_by_user_id
        // matches their own login) can freely re-scan back into it — only a
        // *different* technician, or any non-fresh-intake status, gets blocked.
        const isOwnInProgress =
          data.battery.status === 'in_progress' && data.battery.started_by_user_id === currentUserId;
        if (fromScan && data.battery.status !== 'in_repair' && !isOwnInProgress) {
          setBlockedStatus(data.battery.status);
          return;
        }
      }
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [code, fromScan, currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (result?.battery?.status !== 'in_progress') return;
    apiClient
      .get('/parts')
      .then(({ data }) => setParts(data))
      .catch(() => setParts([]));
    // Admin-configured list of "can't service" reasons for the Report Issue
    // picker below — activeOnly so a disabled reason never shows up here.
    apiClient
      .get('/issue-reasons', { params: { activeOnly: true } })
      .then(({ data }) => setIssueReasons(data))
      .catch(() => setIssueReasons([]));
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
      setShowCompletedModal(true);
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReportIssue() {
    if (!selectedReasonId) {
      setActionError('Select a reason');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await apiClient.patch(`/batteries/${result.battery.id}/report-issue`, {
        reasonId: selectedReasonId,
        note: issueNote || undefined,
      });
      setShowIssueForm(false);
      setSelectedReasonId(null);
      setIssueNote('');
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
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="mb-4 text-center text-sm text-red-600">{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="rounded-md bg-slate-200 px-4 py-2.5">
          <Text className="text-sm font-medium text-slate-700">Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Null while the not-a-fresh-intake modal is up — the technician never
  // sees the underlying detail content for a battery that's not scannable.
  if (!result) {
    return (
      <Modal
        visible={!!blockedStatus}
        transparent
        animationType="fade"
        onRequestClose={() => navigation.goBack()}
      >
        <View className="flex-1 items-center justify-center bg-slate-950/60 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Text className="text-2xl">⏳</Text>
            </View>
            <Text className="mb-1.5 text-lg font-semibold text-slate-900">Not Available</Text>
            <Text className="mb-5 text-sm text-slate-500">
              {BLOCKED_STATUS_MESSAGES[blockedStatus] || 'This battery is not available to start work on.'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="items-center rounded-lg bg-blue-600 py-3.5"
            >
              <Text className="text-base font-semibold text-white">Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const { battery } = result;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="p-5 pb-10">
      <Text className="text-2xl font-bold text-slate-900">{battery.battery_code}</Text>
      <Text className="mb-4 text-sm text-slate-500">Full intake-to-return history.</Text>

      <View className="mb-5 flex-row items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <StatusBadge status={battery.status} />
        {battery.client_name && (
          <Text className="text-xs text-slate-500">Client: {battery.client_name}</Text>
        )}
      </View>

      {actionError && <Text className="mb-4 text-sm text-red-600">{actionError}</Text>}

      {battery.status === 'in_repair' && (
        <View className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <Text className="mb-1 text-sm font-semibold text-slate-900">Ready to start?</Text>
          <Text className="mb-4 text-sm text-slate-500">
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
        <View className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <View className="mb-4 flex-row items-center justify-between rounded-lg bg-emerald-500/10 px-4 py-3">
            <Text className="text-xs font-medium text-emerald-700">Time on this repair</Text>
            <Text className="text-xl font-bold text-emerald-700">
              {formatDuration(elapsedSeconds)}
            </Text>
          </View>

          {!showIssueForm && (
            <>
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-900">Parts Changed</Text>
                <Text className="text-xs font-medium text-slate-500">
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
                        selected ? 'border-blue-500 bg-blue-500/10' : 'border-slate-200 bg-white'
                      } ${disabled ? 'opacity-40' : ''}`}
                    >
                      <Text className="text-sm font-medium text-slate-900">{p.name}</Text>
                      <Text className="text-xs text-slate-500">{p.quantity} in stock</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Notes (optional)"
                placeholderTextColor="#6b7280"
                className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
              />

              <TouchableOpacity
                onPress={handleComplete}
                disabled={submitting}
                className="mt-4 items-center rounded-lg bg-blue-600 py-3.5 disabled:opacity-50"
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-semibold text-white">Submit for Testing</Text>}
              </TouchableOpacity>
            </>
          )}

          <View className={showIssueForm ? 'pt-0' : 'mt-5 border-t border-slate-200 pt-4'}>
            {!showIssueForm ? (
              <TouchableOpacity
                onPress={() => setShowIssueForm(true)}
                className="items-center rounded-lg border border-red-500/50 py-3.5"
              >
                <Text className="text-sm font-medium text-red-600">
                  Can't service this battery?
                </Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text className="mb-1 text-sm font-semibold text-slate-900">Report an Issue</Text>
                <Text className="mb-3 text-sm text-slate-500">
                  Pick a reason — this marks the battery as unserviceable.
                </Text>

                <View className="gap-2">
                  {issueReasons.map((reason) => {
                    const selected = selectedReasonId === reason.id;
                    return (
                      <TouchableOpacity
                        key={reason.id}
                        onPress={() => setSelectedReasonId(reason.id)}
                        className={`rounded-lg border p-3 ${
                          selected ? 'border-red-500 bg-red-500/10' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <Text className="text-sm font-medium text-slate-900">{reason.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  value={issueNote}
                  onChangeText={setIssueNote}
                  placeholder="Note (optional)"
                  placeholderTextColor="#6b7280"
                  multiline
                  className="mt-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-900"
                />

                <View className="mt-4 flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      setShowIssueForm(false);
                      setSelectedReasonId(null);
                      setIssueNote('');
                    }}
                    className="flex-1 items-center rounded-lg bg-slate-200 py-3.5"
                  >
                    <Text className="text-sm font-medium text-slate-700">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleReportIssue}
                    disabled={submitting}
                    className="flex-1 items-center rounded-lg bg-red-600 py-3.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-sm font-semibold text-white">Report Issue</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {battery.status === 'unserviceable' && (
        <View className="mb-5 rounded-xl border border-red-100 bg-red-50 p-5">
          <Text className="mb-1 text-sm font-semibold text-slate-900">Marked Unserviceable</Text>
          {result.issues?.[0] ? (
            <>
              <Text className="mb-1 text-sm text-red-600">{result.issues[0].reason_label}</Text>
              {result.issues[0].note && (
                <Text className="mb-1 text-sm text-slate-500">{result.issues[0].note}</Text>
              )}
              <Text className="text-xs text-slate-400">
                Reported by {result.issues[0].staff_name} on{' '}
                {new Date(result.issues[0].reported_at).toLocaleString()}
              </Text>
            </>
          ) : (
            <Text className="text-sm text-slate-500">This battery can't be serviced.</Text>
          )}
        </View>
      )}

      {battery.status === 'in_testing' && (
        <View className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-5">
          <View className="mb-4 flex-row items-center justify-between rounded-lg bg-blue-500/10 px-4 py-3">
            <Text className="text-xs font-medium text-blue-700">Time in testing</Text>
            <Text className="text-xl font-bold text-blue-700">
              {formatDuration(testingElapsedSeconds)}
            </Text>
          </View>

          <Text className="mb-1 text-sm font-semibold text-slate-900">Ready to confirm?</Text>
          <Text className="mb-4 text-sm text-slate-500">
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

      <Modal
        visible={showCompletedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletedModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-slate-950/60 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Text className="text-2xl">✅</Text>
            </View>
            <Text className="mb-1.5 text-lg font-semibold text-slate-900">Completed!</Text>
            <Text className="mb-5 text-sm text-slate-500">
              {battery.battery_code} has been tested and marked as repaired.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowCompletedModal(false);
                navigation.goBack();
              }}
              className="items-center rounded-lg bg-blue-600 py-3.5"
            >
              <Text className="text-base font-semibold text-white">Back to Another Work</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
