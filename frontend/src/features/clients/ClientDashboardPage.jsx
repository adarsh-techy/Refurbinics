import { useEffect, useState } from 'react';
import apiClient from '../../services/api-client';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import TableState from '../../components/ui/TableState';

// A client's own read-only dashboard: how many of their batteries are at
// each stage, and what they currently owe. Scoped server-side to whichever
// `clients` row is linked to the logged-in account (GET /clients/me/dashboard).
function ClientDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('/clients/me/dashboard')
      .then(({ data }) => {
        if (!cancelled) setData(data);
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

  if (loading) return <TableState>Loading…</TableState>;
  if (error) return <TableState tone="error">{error}</TableState>;

  const { client, stats } = data;

  return (
    <div>
      <PageHeader title={`Welcome, ${client.name}`} description="Your batteries at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Batteries" value={stats.battery_count} tone="info" />
        <StatCard label="Pending" value={stats.in_repair_count} tone="warning" />
        <StatCard label="In Progress" value={stats.in_progress_count} tone="warning" />
        <StatCard label="In Testing" value={stats.in_testing_count} tone="info" />
        <StatCard label="Completed" value={stats.repaired_count} tone="good" />
        <StatCard label="Returned" value={stats.returned_count} tone="info" />
        <StatCard label="Repair Visits" value={stats.repair_visit_count} tone="info" />
        <StatCard
          label="Balance Owed"
          value={`£${Number(stats.balance).toFixed(2)}`}
          tone="warning"
        />
      </div>
    </div>
  );
}

export default ClientDashboardPage;
