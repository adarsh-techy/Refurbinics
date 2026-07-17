import { useState } from 'react';
import apiClient from '../../services/api-client';
import useFetchList from '../../utils/use-fetch-list';

const inputClasses =
  'w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 text-base text-neutral-100 placeholder:text-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30';

// A technician's scan-and-repair flow for one battery: start work (flips
// in_repair -> in_progress), pick which part(s) were changed (same
// one-row-per-part + shared batchId pattern as RepairForm.jsx, minus the
// battery lookup and staff picker — both are already known here: this
// battery, and the technician's own linked staff record, resolved
// server-side in repair.controller.js) — which auto-advances the battery to
// in_testing — then confirm it tested working to mark it repaired.
function TechnicianRepairPanel({ battery, onUpdated }) {
  const { data: parts } = useFetchList('/parts');
  const [partIds, setPartIds] = useState(['']);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function updatePartRow(index, value) {
    setPartIds((prev) => prev.map((id, i) => (i === index ? value : id)));
  }

  function addPartRow() {
    setPartIds((prev) => [...prev, '']);
  }

  function removePartRow(index) {
    setPartIds((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleStartWork() {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.patch(`/batteries/${battery.id}/start-work`);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteTesting() {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.patch(`/batteries/${battery.id}/complete-testing`);
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(e) {
    e.preventDefault();
    const chosenPartIds = partIds.filter(Boolean);
    if (chosenPartIds.length === 0) {
      setError('Select at least one part');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const batchId = crypto.randomUUID();
      for (const partId of chosenPartIds) {
        await apiClient.post('/repairs', {
          batteryId: battery.id,
          partId: Number(partId),
          notes: notes || undefined,
          batchId,
        });
      }
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setSubmitting(false);
    }
  }

  if (battery.status === 'in_repair') {
    return (
      <div className="mb-6 rounded-xl border border-surface-700 bg-surface-900 p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-neutral-100">Ready to start?</h2>
        <p className="mb-4 text-sm text-neutral-400">
          This battery hasn't been touched yet. Starting work marks it as in progress.
        </p>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleStartWork}
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? 'Starting…' : 'Start Work'}
        </button>
      </div>
    );
  }

  if (battery.status === 'in_testing') {
    return (
      <div className="mb-6 rounded-xl border border-surface-700 bg-surface-900 p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-neutral-100">Ready to confirm?</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Parts have been changed — verify the battery works, then mark it tested.
        </p>
        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleCompleteTesting}
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? 'Completing…' : 'Complete'}
        </button>
      </div>
    );
  }

  if (battery.status !== 'in_progress') {
    return null;
  }

  const selectedParts = partIds.map((id) => parts.find((p) => String(p.id) === id)).filter(Boolean);

  return (
    <form
      onSubmit={handleComplete}
      className="mb-6 rounded-xl border border-surface-700 bg-surface-900 p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-100">Parts Changed</h2>
        <span className="rounded-full bg-surface-700 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
          {selectedParts.length} part{selectedParts.length === 1 ? '' : 's'} selected
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {partIds.map((partId, index) => (
          <div
            key={index}
            className="flex items-center gap-3 rounded-lg border border-surface-700 bg-surface-800/60 p-3"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
              {index + 1}
            </span>
            <select
              value={partId}
              onChange={(e) => updatePartRow(index, e.target.value)}
              className={`${inputClasses} flex-1`}
              required
            >
              <option value="" disabled>
                Select part
              </option>
              {parts.map((p) => (
                <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                  {p.name} ({p.quantity} in stock)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removePartRow(index)}
              disabled={partIds.length === 1}
              aria-label="Remove part"
              className="shrink-0 rounded-md p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.36-9.36a.75.75 0 0 0-1.06-1.06L10 9.94 7.7 7.64a.75.75 0 0 0-1.06 1.06L8.94 11l-2.3 2.3a.75.75 0 1 0 1.06 1.06L10 12.06l2.3 2.3a.75.75 0 0 0 1.06-1.06L11.06 11l2.3-2.3Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {partIds[partIds.length - 1] && (
        <button
          type="button"
          onClick={addPartRow}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-surface-600 py-3 text-sm font-medium text-neutral-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          Add Another Part
        </button>
      )}

      <div className="mt-4">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className={inputClasses}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-lg bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit for Testing'}
      </button>
    </form>
  );
}

export default TechnicianRepairPanel;
