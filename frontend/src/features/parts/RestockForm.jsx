import { useState } from 'react';
import apiClient from '../../services/api-client';

const inputClasses =
  'w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-surface-600 dark:bg-surface-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/30';
const labelClasses = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-neutral-200';

// Tops up a part's quantity — kept separate from the full edit form
// (PartForm) so restocking an out-of-stock part is a quick "add N units"
// action instead of re-typing the part's name/SKU/cost. Logged server-side
// (part_stock_adjustments) so Part Detail can show a restock history and
// monthly restocked-vs-used breakdown.
function RestockForm({ part, onSaved, onCancel }) {
  const [quantityAdded, setQuantityAdded] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.patch(`/parts/${part.id}/restock`, {
        quantityAdded: Number(quantityAdded),
        note: note.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-sm text-slate-500 dark:text-neutral-400">
        {part.name} currently has <span className="font-semibold text-slate-700 dark:text-neutral-200">{part.quantity}</span>{' '}
        unit{part.quantity === 1 ? '' : 's'} in stock.
      </p>

      <div>
        <label className={labelClasses}>Quantity to Add</label>
        <input
          type="number"
          min="1"
          value={quantityAdded}
          onChange={(e) => setQuantityAdded(e.target.value)}
          placeholder="e.g. 20"
          className={inputClasses}
          autoFocus
          required
        />
      </div>

      <div>
        <label className={labelClasses}>Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Delivery from supplier"
          className={inputClasses}
        />
      </div>

      {error && <p className="text-sm text-critical-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-surface-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-surface-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !quantityAdded}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {submitting ? 'Saving…' : 'Add Stock'}
        </button>
      </div>
    </form>
  );
}

export default RestockForm;
