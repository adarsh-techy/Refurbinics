import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useInfiniteList from '../../utils/use-infinite-list';
import DataTable from '../../components/ui/DataTable';
import TableState from '../../components/ui/TableState';
import InfiniteScrollTrigger from '../../components/ui/InfiniteScrollTrigger';
import PageHeader from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/Badge';
import BatteryLookup from './BatteryLookup';
import { socket } from '../../services/socket-client';

const PAGE_SIZE = 15;

// "2026-07-16" -> "16 Jul". Built from the parts directly (not `new
// Date(isoString)`) since that parses as UTC midnight and can roll back a
// day once formatted in a browser timezone behind UTC.
function formatShortDate(isoDateStr) {
  const [y, m, d] = isoDateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'in_repair', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_testing', label: 'In Testing' },
  { value: 'repaired', label: 'Completed' },
  { value: 'returned', label: 'Returned' },
  { value: 'unserviceable', label: 'Unserviceable' },
  { value: 'recycled', label: 'Recycled' },
];

const VALID_STATUS_FILTERS = new Set(STATUS_FILTERS.map((f) => f.value).filter(Boolean));

function BatteriesPage() {
  // Dashboard stat cards (Total Batteries, Pending Repair, Repaired) deep
  // link here with ?status=..., so the list opens already filtered instead
  // of requiring a second click on the filter row.
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [status, setStatus] = useState(VALID_STATUS_FILTERS.has(initialStatus) ? initialStatus : '');
  const [date, setDate] = useState('');

  const { items, loading, hasMore, error, loadMore, refetch } = useInfiniteList('/batteries', PAGE_SIZE, {
    status: status || undefined,
    date: date || undefined,
  });

  // Keeps this list in sync while it's open — a technician starting work,
  // completing testing, or reporting an issue in the mobile app pushes here
  // instead of requiring a manual refresh.
  useEffect(() => {
    socket.on('battery:updated', refetch);
    return () => socket.off('battery:updated', refetch);
  }, [refetch]);

  const columns = [
    {
      key: 'battery_code',
      label: 'Battery ID',
      render: (row) => (
        <Link to={`/batteries/${row.battery_code}`} className="font-medium text-blue-700 hover:underline dark:text-blue-400">
          {row.battery_code}
        </Link>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'created_at',
      label: 'Created',
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
    {
      key: 'last_repaired_at',
      label: 'Last Repaired',
      render: (row) =>
        row.last_repaired_at ? (
          <div>
            <p>{new Date(row.last_repaired_at).toLocaleString()}</p>
            {row.repairs_this_month > 1 && (
              <p className="mt-0.5 whitespace-normal text-xs font-medium text-warning-600">
                ⟳ Repaired {row.repairs_this_month}x this month (
                {row.repairs_this_month_dates.map(formatShortDate).join(', ')})
              </p>
            )}
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'last_repaired_parts',
      label: 'Part(s) Changed',
      render: (row) => row.last_repaired_parts || '—',
    },
    {
      key: 'last_repaired_by',
      label: 'Repaired By',
      render: (row) => row.last_repaired_by || '—',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Global Battery"
        description="Every battery ever taken in, tracked by its unique ID."
        titleClassName="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400"
      />

      <div className="mb-14 flex flex-wrap items-end gap-3 rounded-xl border border-blue-200 p-3 shadow-sm dark:border-blue-800/40">
        <BatteryLookup />

        <div className="flex rounded-md border border-slate-300 p-0.5 dark:border-surface-600 ml-4">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                status === f.value
                  ? 'bg-violet-900 text-white dark:bg-violet-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-surface-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="battery-date-filter" className="text-sm font-medium text-slate-600 dark:text-neutral-300">
            Created on
          </label>
          <input
            id="battery-date-filter"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`rounded-md border border-blue-200 bg-blue-50/60 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-800/40 dark:bg-blue-900/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/30 [&::-webkit-calendar-picker-indicator]:[filter:invert(70%)_sepia(90%)_saturate(600%)_hue-rotate(360deg)_brightness(100%)] ${
              date ? 'text-yellow-500 dark:text-yellow-400' : 'dark:text-neutral-100'
            }`}
          />
          {date && (
            <button
              type="button"
              onClick={() => setDate('')}
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <TableState tone="error">{error}</TableState>}

      {items.length === 0 && loading ? (
        <TableState>Loading…</TableState>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={items}
            emptyMessage="No batteries match these filters."
            showRowNumber
            headerColor="blue"
          />
          <InfiniteScrollTrigger hasMore={hasMore} loading={loading} onVisible={loadMore} />
        </>
      )}
    </div>
  );
}

export default BatteriesPage;
