import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api-client';
import PageHeader from '../../components/ui/PageHeader';
import TableState from '../../components/ui/TableState';
import { StatusBadge } from '../../components/ui/Badge';

// Every repair the logged-in technician has ever logged, newest first.
// Scoped server-side to whichever `staff` row is linked to their account
// (GET /staff/me) — same data StaffDetailPage shows an admin, just without
// the admin-only bits.
function TechnicianHistoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .get('/staff/me')
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

  const { repairs } = data;

  return (
    <div>
      <PageHeader title="My Repair History" description="Every repair you've logged." />

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-800/40 dark:bg-blue-900/20">
        {repairs.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500 dark:text-neutral-400">
            No repairs logged yet.
          </p>
        ) : (
          <ul className="divide-y divide-blue-100 dark:divide-blue-800/40">
            {repairs.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/batteries/${r.battery_code}`}
                      className="font-medium text-blue-700 hover:underline dark:text-blue-300"
                    >
                      {r.battery_code}
                    </Link>
                    <StatusBadge status={r.battery_status} />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-neutral-500">
                    {new Date(r.repaired_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-0.5 text-slate-500 dark:text-neutral-400">Part changed: {r.part_name}</p>
                {r.notes && <p className="mt-0.5 text-xs text-slate-400 dark:text-neutral-500">{r.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TechnicianHistoryPage;
