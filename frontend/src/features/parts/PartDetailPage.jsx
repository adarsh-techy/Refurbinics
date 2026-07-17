import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../services/api-client';
import PageHeader from '../../components/ui/PageHeader';
import TableState from '../../components/ui/TableState';
import { StatusBadge } from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';

// A part's detail page — stock/cost at a glance plus every repair that's
// ever used it, so a manager can see how often it's needed and on what.
function PartDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get(`/parts/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <TableState>Loading…</TableState>;
  if (error) {
    return (
      <div>
        <Link to="/parts" className="mb-4 inline-block text-sm text-brand-700 hover:underline dark:text-emerald-400">
          ← Back to Inventory
        </Link>
        <TableState tone="error">{error}</TableState>
      </div>
    );
  }

  const { part, usageHistory } = data;
  const totalQuantityUsed = usageHistory.reduce((sum, h) => sum + Number(h.quantity_used), 0);
  const totalRevenue = usageHistory.reduce(
    (sum, h) => sum + Number(h.price) + Number(h.labor_charge || 0),
    0
  );

  return (
    <div>
      <Link
        to="/parts"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-emerald-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
            clipRule="evenodd"
          />
        </svg>
        Back to Inventory
      </Link>

      <PageHeader title={part.name} description={part.sku ? `SKU: ${part.sku}` : 'No SKU on file'} />

      <div
        className={`mb-6 flex flex-wrap items-center gap-4 rounded-xl border-l-4 border-y border-r border-slate-200 bg-gradient-to-r p-5 shadow-sm dark:border-y-surface-700 dark:border-r-surface-700 ${
          part.in_stock
            ? 'border-brand-500 from-emerald-50 to-white dark:from-emerald-500/15 dark:to-black'
            : 'border-critical-500 from-red-50 to-white dark:from-red-500/15 dark:to-black'
        }`}
      >
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            part.in_stock
              ? 'bg-brand-100 text-brand-700 dark:bg-emerald-500/15 dark:text-emerald-300'
              : 'bg-critical-100 text-critical-700 dark:bg-red-500/15 dark:text-red-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M20 7h-3.17l-1.24-1.86A2 2 0 0 0 13.93 4h-3.86a2 2 0 0 0-1.66.9L7.17 7H4a1 1 0 0 0-1 1v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1Zm-8 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
          </svg>
        </span>
        <div className="flex-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              part.in_stock
                ? 'bg-brand-100 text-brand-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-critical-100 text-critical-700 dark:bg-red-500/15 dark:text-red-300'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${part.in_stock ? 'bg-brand-600 dark:bg-emerald-400' : 'bg-critical-600 dark:bg-red-400'}`} />
            {part.in_stock ? 'In Stock' : 'Out of Stock'}
          </span>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            {part.quantity} unit{part.quantity === 1 ? '' : 's'} remaining
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Times Used" value={usageHistory.length} tone="good" />
        <StatCard label="Total Quantity Used" value={totalQuantityUsed} tone="info" />
        <StatCard label="Repair Cost" value={`£${Number(part.repair_cost).toFixed(2)}`} tone="warning" />
        <StatCard label="Total Revenue" value={`£${totalRevenue.toFixed(2)}`} tone="good" />
      </div>

      <div className="rounded-xl border border-blue-300 bg-white p-5 shadow-sm dark:border-blue-800/40 dark:bg-black">
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-neutral-100">Usage History</h2>

        {usageHistory.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-neutral-400">
            This part hasn't been used in any repair yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-surface-800">
            {usageHistory.map((h) => (
              <li key={h.id} className="flex gap-4 py-5 text-sm first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path
                      fillRule="evenodd"
                      d="M14.279 2.152a.75.75 0 0 1 .07 1.058l-2.487 2.85 1.278 1.279 2.85-2.488a.75.75 0 0 1 1.058.07 4.5 4.5 0 0 1-5.048 6.965l-4.5 4.949a2.121 2.121 0 1 1-3-3l4.949-4.5a4.5 4.5 0 0 1 6.965-5.048 4.462 4.462 0 0 1 .865-1.135ZM4.5 15a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/batteries/${h.battery_code}`}
                        className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                      >
                        {h.battery_code}
                      </Link>
                      <StatusBadge status={h.battery_status} />
                    </div>
                    <span className="text-xs text-slate-400 dark:text-neutral-500">
                      {new Date(h.repaired_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-slate-500 dark:text-neutral-400">
                    <span>
                      By <span className="font-semibold text-brand-700 dark:text-emerald-300">{h.staff_name}</span>
                    </span>
                    <span>
                      Quantity: <span className="font-semibold text-slate-700 dark:text-neutral-200">{h.quantity_used}</span>
                    </span>
                  </div>
                  {h.notes && <p className="text-xs text-slate-400 dark:text-neutral-500">{h.notes}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default PartDetailPage;
