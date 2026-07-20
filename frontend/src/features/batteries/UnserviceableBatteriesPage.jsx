import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useInfiniteList from '../../utils/use-infinite-list';
import DataTable from '../../components/ui/DataTable';
import TableState from '../../components/ui/TableState';
import InfiniteScrollTrigger from '../../components/ui/InfiniteScrollTrigger';
import PageHeader from '../../components/ui/PageHeader';
import { socket } from '../../services/socket-client';

const PAGE_SIZE = 15;

function UnserviceableBatteriesPage() {
  const [date, setDate] = useState('');

  const { items, loading, hasMore, error, loadMore, refetch } = useInfiniteList('/batteries', PAGE_SIZE, {
    status: 'unserviceable',
    date: date || undefined,
  });

  // Keeps the list in sync while this page is open — the same push that
  // drives the 100-battery popup alert (see UnserviceableBatteriesAlert).
  useEffect(() => {
    socket.on('batteries:unserviceable-count', refetch);
    return () => socket.off('batteries:unserviceable-count', refetch);
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
    { key: 'client_name', label: 'Client', render: (row) => row.client_name || '—' },
    { key: 'issue_reason', label: 'Reason', render: (row) => row.issue_reason || '—' },
    { key: 'issue_note', label: 'Note', render: (row) => row.issue_note || '—' },
    {
      key: 'issue_reported_at',
      label: 'Reported',
      render: (row) => (row.issue_reported_at ? new Date(row.issue_reported_at).toLocaleString() : '—'),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Unserviceable Batteries"
        description="Batteries a technician reported as unable to be serviced — terminal, not returned to the active queue."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <label htmlFor="unserviceable-date-filter" className="text-sm font-medium text-slate-600 dark:text-neutral-300">
          Created on
        </label>
        <input
          id="unserviceable-date-filter"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-surface-600 dark:bg-surface-900 dark:text-neutral-100"
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

      {error && <TableState tone="error">{error}</TableState>}

      {items.length === 0 && loading ? (
        <TableState>Loading…</TableState>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={items}
            emptyMessage="No unserviceable batteries."
            showRowNumber
            headerColor="blue"
          />
          <InfiniteScrollTrigger hasMore={hasMore} loading={loading} onVisible={loadMore} />
        </>
      )}
    </div>
  );
}

export default UnserviceableBatteriesPage;
