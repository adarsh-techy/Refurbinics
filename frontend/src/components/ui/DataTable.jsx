// Generic table for rendering an array of flat objects.
// columns: [{ key: 'name', label: 'Name' }]
// showRowNumber: prepends a "#" column numbering rows 1, 2, 3…
// bordered: set false to drop the outer border and all row/column dividers
// (e.g. for a feed-style list like the Audit Log).
// headerColor: 'green' (default) or 'blue' — tints the thead background/divider.
const HEADER_COLORS = {
  green: {
    thead: 'bg-green-100 dark:bg-green-500/10',
    divide: 'divide-green-200 dark:divide-green-500/20',
    body: 'bg-white dark:bg-surface-900',
    headText: 'text-pink-800 dark:text-blue-300',
    hover: 'hover:bg-slate-50 dark:hover:bg-surface-800',
    outerBorder: 'border-slate-200 dark:border-surface-700',
    tableDivide: 'divide-slate-200 dark:divide-surface-700',
    tbodyDivide: 'divide-slate-100 dark:divide-surface-800',
    tbodyRowDivide: 'divide-slate-200 dark:divide-surface-800',
  },
  blue: {
    thead: 'bg-green-100 dark:bg-green-500/10',
    divide: 'divide-blue-200 dark:divide-blue-500/20',
    body: 'bg-blue-50 dark:bg-blue-500/5',
    headText: 'text-green-800 dark:text-green-300',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
    outerBorder: 'border-blue-200 dark:border-blue-800/40',
    tableDivide: 'divide-blue-200 dark:divide-blue-500/20',
    tbodyDivide: 'divide-blue-100 dark:divide-blue-500/10',
    tbodyRowDivide: 'divide-blue-200 dark:divide-blue-500/20',
  },
};

function DataTable({
  columns,
  rows,
  emptyMessage = 'No records yet.',
  showRowNumber = false,
  bordered = true,
  headerColor = 'green',
}) {
  const header = HEADER_COLORS[headerColor] || HEADER_COLORS.green;

  if (!rows?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center dark:border-surface-700 dark:bg-surface-900">
        <p className="text-sm text-slate-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-xl shadow-sm ${header.body} ${
        bordered ? `border ${header.outerBorder}` : ''
      }`}
    >
      <table className={`min-w-full text-sm ${bordered ? `divide-y ${header.tableDivide}` : ''}`}>
        <thead className={header.thead}>
          <tr className={bordered ? `divide-x ${header.divide}` : ''}>
            {showRowNumber && (
              <th className={`w-12 whitespace-nowrap px-5 py-3.5 text-left text-sm font-bold uppercase tracking-wide ${header.headText}`}>
                #
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-5 py-3.5 text-left text-sm font-bold uppercase tracking-wide ${header.headText}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bordered ? `divide-y ${header.tbodyDivide}` : ''}>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? i}
              className={`transition-colors ${header.hover} ${header.body} ${
                bordered ? `divide-x ${header.tbodyRowDivide}` : ''
              }`}
            >
              {showRowNumber && (
                <td className="whitespace-nowrap px-5 py-3.5 text-slate-500 dark:text-neutral-400">{i + 1}</td>
              )}
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-5 py-3.5 text-slate-700 dark:text-neutral-200">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
