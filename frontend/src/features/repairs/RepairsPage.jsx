import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useInfiniteList from '../../utils/use-infinite-list';
import DataTable from '../../components/ui/DataTable';
import TableState from '../../components/ui/TableState';
import InfiniteScrollTrigger from '../../components/ui/InfiniteScrollTrigger';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import RowActions from '../../components/ui/RowActions';
import apiClient from '../../services/api-client';
import { StatusBadge } from '../../components/ui/Badge';
import RepairEditForm from './RepairEditForm';

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 250;

function RepairsPage() {
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super_admin';

  const [editTarget, setEditTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [date, setDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { items, loading, hasMore, error, loadMore, refetch } = useInfiniteList(
    '/repairs',
    PAGE_SIZE,
    { q: debouncedSearch || undefined, date: date || undefined }
  );

  function handleSaved() {
    refetch();
    setEditTarget(null);
  }

  async function handleConfirmDelete() {
    setDeleteError(null);
    try {
      // A row can bundle several parts logged in one submission — delete
      // every underlying repair so all of that job's stock gets refunded.
      for (const id of deleteTarget.repair_ids) {
        await apiClient.delete(`/repairs/${id}`);
      }
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message);
      setDeleteTarget(null);
    }
  }

  const columns = [
    {
      key: 'battery_code',
      label: 'Battery ID',
      render: (row) => (
        <Link
          to={`/batteries/${row.battery_code}`}
          className="font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          {row.battery_code}
        </Link>
      ),
    },
    { key: 'part_name', label: 'Part Changed' },
    { key: 'staff_name', label: 'Staff' },
    {
      key: 'battery_status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.battery_status} />,
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => `£${Number(row.price).toFixed(2)}`,
    },
    {
      key: 'repaired_at',
      label: 'Date/Time',
      render: (row) => new Date(row.repaired_at).toLocaleString(),
    },
    ...(isSuperAdmin
      ? [
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <RowActions
                onEdit={() => setEditTarget(row)}
                onDelete={() => setDeleteTarget(row)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Repairs"
        description="Parts changed, who changed them, and when."
        titleClassName="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400"
      />

      {editTarget && (
        <Modal
          title="Edit Repair"
          description={
            editTarget.repair_ids.length > 1
              ? 'Adjust the notes for this repair — applies to all parts in this job.'
              : 'Adjust the notes for this repair.'
          }
          onClose={() => setEditTarget(null)}
        >
          <RepairEditForm
            repair={editTarget}
            onSaved={handleSaved}
            onCancel={() => setEditTarget(null)}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Repair"
          message={
            deleteTarget.repair_ids.length > 1
              ? `Delete this repair (${deleteTarget.repair_ids.length} parts: ${deleteTarget.part_name}) on ${deleteTarget.battery_code}? Stock will be refunded for each part.`
              : `Delete this repair on ${deleteTarget.battery_code}? Stock will be refunded.`
          }
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="mb-16 flex flex-wrap items-end gap-3 rounded-xl border border-blue-200 p-3 shadow-sm dark:border-blue-800/40">
        <div className="min-w-[16rem] flex-1 sm:flex-none">
          <label htmlFor="repair-search" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-neutral-200">
            Search battery / staff / part
          </label>
          <input
            id="repair-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="e.g. BAT-12-001, John, or Fuse"
            className="w-full rounded-md border border-blue-200 bg-blue-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-800/40 dark:bg-blue-900/10 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/30 sm:w-72"
          />
        </div>

        <div className="flex items-center gap-2 ml-10">
          <label htmlFor="repair-date-filter" className="text-sm font-medium text-slate-600 dark:text-neutral-300">
            Repair date
          </label>
          <input
            id="repair-date-filter"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-blue-200 bg-blue-50/60 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-800/40 dark:bg-blue-900/10 dark:text-neutral-100 dark:focus:border-blue-400 dark:focus:ring-blue-400/30 [&::-webkit-calendar-picker-indicator]:[filter:invert(70%)_sepia(90%)_saturate(600%)_hue-rotate(360deg)_brightness(100%)]"
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

        {(search || date) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setDate('');
            }}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            Clear all
          </button>
        )}
      </div>

      {deleteError && <p className="mb-4 text-sm text-critical-600 dark:text-red-400">{deleteError}</p>}
      {error && <TableState tone="error">{error}</TableState>}

      {items.length === 0 && loading ? (
        <TableState>Loading…</TableState>
      ) : (
        !error && (
          <>
            <DataTable
              columns={columns}
              rows={items}
              emptyMessage="No repairs match these filters."
              showRowNumber
              headerColor="blue"
            />
            <InfiniteScrollTrigger hasMore={hasMore} loading={loading} onVisible={loadMore} />
          </>
        )
      )}
    </div>
  );
}

export default RepairsPage;
