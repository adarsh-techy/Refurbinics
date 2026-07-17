import useFetchList from '../../utils/use-fetch-list';
import StatCard from '../../components/ui/StatCard';
import TableState from '../../components/ui/TableState';
import PageHeader from '../../components/ui/PageHeader';

function formatMoney(value) {
  return `£${Number(value).toFixed(2)}`;
}

function FinancePage() {
  const { data, loading, error } = useFetchList('/finance/summary');

  if (loading) return <TableState>Loading…</TableState>;
  if (error) return <TableState tone="error">{error}</TableState>;

  const { totals, monthly } = data;

  return (
    <div>
      <PageHeader title="Finance" description="Repair revenue, staff salary, and net profit." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Repair Revenue" value={formatMoney(totals.repairRevenue)} tone="good" />
        <StatCard
          label="Staff Salary (Monthly)"
          value={formatMoney(totals.staffSalaryTotal)}
          tone="warning"
        />
        <StatCard
          label="Net Profit"
          value={formatMoney(totals.netProfit)}
          tone={totals.netProfit >= 0 ? 'good' : 'critical'}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900">
        <div className="border-b border-slate-100 p-5 dark:border-surface-700">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-neutral-100">Last 6 Months</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-100 dark:bg-blue-500/10">
              <tr>
                <th className="whitespace-nowrap px-5 py-3.5 text-left text-sm font-bold uppercase tracking-wide text-pink-800 dark:text-blue-300">
                  Month
                </th>
                <th className="whitespace-nowrap px-5 py-3.5 text-left text-sm font-bold uppercase tracking-wide text-pink-800 dark:text-blue-300">
                  Repair Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((row) => (
                <tr key={row.month} className="transition-colors hover:bg-slate-50 dark:hover:bg-surface-800">
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-700 dark:text-neutral-200">{row.month}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-700 dark:text-neutral-200">
                    {formatMoney(row.repairRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FinancePage;
