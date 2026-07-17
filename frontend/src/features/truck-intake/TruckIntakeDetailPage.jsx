import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../services/api-client';
import PageHeader from '../../components/ui/PageHeader';
import TableState from '../../components/ui/TableState';
import { StatusBadge } from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';

function isThisMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// Truck intake detail page: which batteries came off this specific truck,
// and where each one stands now — reached by clicking the truck number on
// the Intake list.
function TruckIntakeDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get(`/truck-intakes/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <TableState>Loading…</TableState>;
  if (error) {
    return (
      <div>
        <Link to="/truck-intakes" className="mb-4 inline-block text-sm text-brand-700 hover:underline dark:text-emerald-400">
          ← Back to Intake
        </Link>
        <TableState tone="error">{error}</TableState>
      </div>
    );
  }

  const { intake, batteries } = data;
  const repairedCount = batteries.filter((b) => b.status !== 'in_repair').length;

  return (
    <div>
      <Link
        to="/truck-intakes"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-emerald-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
            clipRule="evenodd"
          />
        </svg>
        Back to Intake
      </Link>

      <PageHeader
        title={
          <>
            <span className="font-normal text-slate-400 dark:text-neutral-500">Truck</span> {intake.truck_number}
          </>
        }
        description={
          <span className="mt-1 flex flex-col gap-3">
            <span>Driver: <span className="font-medium text-blue-700 dark:text-blue-400">{intake.driver_name}</span></span>
            {intake.client_name && (
              <span>Client: <span className="font-medium text-blue-700 dark:text-blue-400">{intake.client_name}</span></span>
            )}
            <span>Date: <span className="font-medium text-blue-700 dark:text-blue-400">{new Date(intake.intake_at).toLocaleDateString()}</span></span>
            <span>Time: <span className="font-medium text-blue-700 dark:text-blue-400">{new Date(intake.intake_at).toLocaleTimeString()}</span></span>
          </span>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Batteries Delivered" value={intake.battery_count} tone="info" />
        <StatCard label="Repaired or Returned" value={repairedCount} tone="good" />
        <StatCard
          label="Still In Repair"
          value={batteries.length - repairedCount}
          tone="warning"
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-neutral-100">Batteries From This Truck</h2>

        <DataTable
          headerColor="blue"
          showRowNumber
          emptyMessage="No batteries recorded for this intake."
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
            {
              key: 'created_at',
              label: 'Date',
              render: (b) => new Date(b.created_at).toLocaleDateString(),
            },
            {
              key: 'last_repaired_at',
              label: 'Previous Service Date',
              render: (b) =>
                b.last_repaired_at ? (
                  <span className="block whitespace-normal text-xs">
                    <span
                      className={
                        isThisMonth(b.last_repaired_at)
                          ? 'font-semibold text-critical-600 dark:text-red-400'
                          : undefined
                      }
                    >
                      {new Date(b.last_repaired_at).toLocaleDateString()}
                    </span>
                    {b.last_repaired_parts && (
                      <span className="text-slate-400 dark:text-neutral-500"> · {b.last_repaired_parts}</span>
                    )}
                  </span>
                ) : (
                  '—'
                ),
            },
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

export default TruckIntakeDetailPage;
