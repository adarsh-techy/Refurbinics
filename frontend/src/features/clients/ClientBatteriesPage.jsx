import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../services/api-client';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import TableState from '../../components/ui/TableState';
import { StatusBadge } from '../../components/ui/Badge';

// Shared by the client dashboard's 3 status lists — only the bucket (and the
// copy around it) differs; the data shape and table are identical.
const BUCKET_META = {
  packed: {
    title: 'Battery Packed to Repair',
    description: 'Batteries you’ve sent in, waiting to be picked up for repair.',
    empty: 'No batteries currently waiting to be picked up.',
  },
  pending: {
    title: 'Pending',
    description: 'Batteries currently being worked on, or finished but not yet sent back.',
    empty: 'Nothing pending right now.',
  },
  received: {
    title: 'Battery Received',
    description: 'Batteries returned back to you after repair.',
    empty: 'No batteries have been returned to you yet.',
  },
};

function ClientBatteriesPage() {
  const { bucket } = useParams();
  const meta = BUCKET_META[bucket];

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get('/clients/me/batteries', { params: { bucket } })
      .then(({ data: result }) => {
        if (!cancelled) setData(result.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, meta]);

  if (!meta) {
    return <TableState tone="error">Unknown battery list.</TableState>;
  }

  const columns = [
    {
      key: 'battery_code',
      label: 'Battery ID',
      render: (row) => (
        <Link
          to={`/batteries/${encodeURIComponent(row.battery_code)}`}
          className="font-medium text-brand-700 hover:underline dark:text-emerald-400"
        >
          {row.battery_code}
        </Link>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'truck_number', label: 'Truck' },
    {
      key: 'intake_at',
      label: 'Sent In',
      render: (row) => new Date(row.intake_at).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader title={meta.title} description={meta.description} />

      {loading && <TableState>Loading…</TableState>}
      {error && <TableState tone="error">{error}</TableState>}
      {!loading && !error && (
        <DataTable columns={columns} rows={data} showRowNumber emptyMessage={meta.empty} />
      )}
    </div>
  );
}

export default ClientBatteriesPage;
