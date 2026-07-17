import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api-client';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import TableState from '../../components/ui/TableState';
import StatCard from '../../components/ui/StatCard';

// The client's own billing history — every repair charge across every
// battery they've sent in, one row per repair visit (batch_id).
function ClientTransactionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('/clients/me/transactions')
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
  }, []);

  const total = data.reduce((sum, row) => sum + Number(row.amount), 0);

  const columns = [
    {
      key: 'repaired_at',
      label: 'Date',
      render: (row) => new Date(row.repaired_at).toLocaleDateString(),
    },
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
    { key: 'part_name', label: 'Part(s) Changed' },
    { key: 'staff_name', label: 'Technician' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => `£${Number(row.amount).toFixed(2)}`,
    },
  ];

  return (
    <div>
      <PageHeader title="Transactions" description="Your billing history across every repair." />

      {!loading && !error && (
        <div className="mb-4 max-w-xs">
          <StatCard label="Total Billed" value={`£${total.toFixed(2)}`} tone="warning" />
        </div>
      )}

      {loading && <TableState>Loading…</TableState>}
      {error && <TableState tone="error">{error}</TableState>}
      {!loading && !error && (
        <DataTable
          columns={columns}
          rows={data}
          showRowNumber
          emptyMessage="No transactions yet."
        />
      )}
    </div>
  );
}

export default ClientTransactionsPage;
