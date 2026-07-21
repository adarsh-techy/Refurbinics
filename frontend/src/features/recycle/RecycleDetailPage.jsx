import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../services/api-client';
import PageHeader from '../../components/ui/PageHeader';
import TableState from '../../components/ui/TableState';
import { StatusBadge } from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';

// Recycle detail page: which batteries shipped out on this recycle run, and
// why each one was declared unserviceable — reached by clicking the vehicle
// number on the Recycle list.
function RecycleDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get(`/recycle/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <TableState>Loading…</TableState>;
  if (error) {
    return (
      <div>
        <Link to="/recycle" className="mb-4 inline-block text-sm text-brand-700 hover:underline dark:text-emerald-400">
          ← Back to Recycle
        </Link>
        <TableState tone="error">{error}</TableState>
      </div>
    );
  }

  const { batch, batteries } = data;

  return (
    <div>
      <Link
        to="/recycle"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-emerald-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
            clipRule="evenodd"
          />
        </svg>
        Back to Recycle
      </Link>

      <PageHeader
        title={
          <>
            <span className="font-normal text-slate-400 dark:text-neutral-500">Vehicle</span> {batch.vehicle_number}
          </>
        }
        description={
          <span className="mt-1 flex flex-col gap-3">
            <span>
              Driver: <span className="font-medium text-blue-700 dark:text-blue-400">{batch.driver_name}</span>
            </span>
            <span>
              Date:{' '}
              <span className="font-medium text-blue-700 dark:text-blue-400">
                {new Date(batch.recycled_at).toLocaleDateString()}
              </span>
            </span>
            <span>
              Time:{' '}
              <span className="font-medium text-blue-700 dark:text-blue-400">
                {new Date(batch.recycled_at).toLocaleTimeString()}
              </span>
            </span>
          </span>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Batteries Recycled" value={batch.battery_count} tone="info" />
        <StatCard label="Confirmed Recycled" value={batteries.filter((b) => b.status === 'recycled').length} tone="good" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-neutral-100">Batteries In This Shipment</h2>

        <DataTable
          headerColor="blue"
          showRowNumber
          emptyMessage="No batteries recorded for this shipment."
          columns={[
            {
              key: 'battery_code',
              label: 'Battery ID',
              render: (b) => (
                <Link
                  to={`/batteries/${b.battery_code}`}
                  className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  {b.battery_code}
                </Link>
              ),
            },
            { key: 'client_name', label: 'Client', render: (b) => b.client_name || '—' },
            { key: 'issue_reason', label: 'Reason', render: (b) => b.issue_reason || '—' },
            {
              key: 'status',
              label: 'Status',
              render: (b) => <StatusBadge status={b.status} />,
            },
          ]}
          rows={batteries}
        />
      </div>
    </div>
  );
}

export default RecycleDetailPage;
