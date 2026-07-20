import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import QRCode from 'qrcode';
import apiClient from '../../services/api-client';
import PageHeader from '../../components/ui/PageHeader';
import useInfiniteList from '../../utils/use-infinite-list';
import DataTable from '../../components/ui/DataTable';
import TableState from '../../components/ui/TableState';
import InfiniteScrollTrigger from '../../components/ui/InfiniteScrollTrigger';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import AlertModal from '../../components/ui/AlertModal';
import RowActions from '../../components/ui/RowActions';
import useFetchList from '../../utils/use-fetch-list';
import { downloadQrSheet, previewQrSheet, DEFAULT_COLUMNS, ROWS, SHEET_SIZE } from '../../utils/generate-qr-sheet';

const inputClasses =
  'w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-blue-800/40 dark:bg-blue-900/10 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/30';
const formInputClasses =
  'w-full rounded-md border border-blue-200 bg-blue-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-800/40 dark:bg-blue-900/10 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/30';
const labelClasses = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-neutral-200';

const DEBOUNCE_MS = 250;
const LIST_PAGE_SIZE = 15;

// Registers a battery for a client and generates its QR code in one step.
// Battery Number is the manufacturer's own serial (kept for reference only);
// Battery ID is the app's real identifier, auto-built from the client +
// a per-client sequence (e.g. "UBE-0001") once a client is picked. The QR
// encodes a link straight to /batteries/:batteryId, so scanning it (or
// looking the ID up directly) opens the battery's full digital passport.
function GenerateQrPage() {
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super_admin';

  const [serialNumber, setSerialNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const { data: clients } = useFetchList('/clients');
  const [suggestedNumber, setSuggestedNumber] = useState(1);
  const numberDebounceRef = useRef(null);

  const [listSearchInput, setListSearchInput] = useState('');
  const [listSearch, setListSearch] = useState('');
  const listDebounceRef = useRef(null);
  const [viewingQr, setViewingQr] = useState(null);
  const [listClientFilter, setListClientFilter] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rowError, setRowError] = useState(null);

  const [sheetStart, setSheetStart] = useState('1');
  const [sheetCount, setSheetCount] = useState(String(SHEET_SIZE));
  const [sheetColumns, setSheetColumns] = useState(String(DEFAULT_COLUMNS));
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState(null);

  const {
    items: generatedBatteries,
    loading: listLoading,
    hasMore: listHasMore,
    error: listError,
    loadMore: loadMoreGenerated,
    refetch: refetchGenerated,
  } = useInfiniteList('/batteries', LIST_PAGE_SIZE, {
    qrGenerated: true,
    search: listSearch || undefined,
    clientName: listClientFilter || undefined,
    includeBlocked: showBlocked || undefined,
  });

  // Auto-suggests the next battery number for the typed client (e.g. Uber's
  // 6th battery -> 6), so the computed Battery ID below fills itself in.
  useEffect(() => {
    clearTimeout(numberDebounceRef.current);

    if (!clientName.trim()) {
      setSuggestedNumber(1);
      return;
    }

    numberDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await apiClient.get('/batteries/count-by-client', {
          params: { clientName: clientName.trim() },
        });
        setSuggestedNumber(data.count + 1);
      } catch {
        setSuggestedNumber(1);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(numberDebounceRef.current);
  }, [clientName]);

  // e.g. "Uber" + 6 -> "UBE-0006" — the code the battery gets renamed to
  // (and the QR encodes) once a client is set.
  const clientPrefix = clientName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  const computedBatteryId = clientPrefix ? `${clientPrefix}-${String(suggestedNumber).padStart(4, '0')}` : '';

  // Search by battery ID or client name, debounced same as the typeahead
  // above so it doesn't fire a request on every keystroke.
  useEffect(() => {
    clearTimeout(listDebounceRef.current);
    listDebounceRef.current = setTimeout(() => {
      setListSearch(listSearchInput.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(listDebounceRef.current);
  }, [listSearchInput]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('Select a client first — the Battery ID is generated from it.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setQrResult(null);
    try {
      const { data: created } = await apiClient.post('/batteries/generate', {
        clientName: clientName.trim(),
        serialNumber: serialNumber.trim() || undefined,
        batteryCode: computedBatteryId,
      });

      const detailUrl = `${window.location.origin}/batteries/${encodeURIComponent(created.battery_code)}`;
      const dataUrl = await QRCode.toDataURL(detailUrl, { width: 320, margin: 1 });

      setQrResult({
        dataUrl,
        detailUrl,
        batteryCode: created.battery_code,
        clientName: clientName.trim(),
      });
      setSerialNumber('');
      setClientName('');
      refetchGenerated();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDownload() {
    const link = document.createElement('a');
    link.href = qrResult.dataUrl;
    link.download = `qr-${qrResult.batteryCode}.png`;
    link.click();
  }

  // Regenerates the same QR (deterministic from the battery code — nothing
  // is stored server-side beyond the qr_generated_at flag) so already-listed
  // batteries can still be viewed/re-downloaded.
  async function buildRowQr(row) {
    const detailUrl = `${window.location.origin}/batteries/${encodeURIComponent(row.battery_code)}`;
    const dataUrl = await QRCode.toDataURL(detailUrl, { width: 320, margin: 1 });
    return { dataUrl, detailUrl, batteryCode: row.battery_code, clientName: row.client_name };
  }

  async function handleDownloadRow(row) {
    const { dataUrl, batteryCode } = await buildRowQr(row);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qr-${batteryCode}.png`;
    link.click();
  }

  async function handleViewRow(row) {
    setViewingQr(await buildRowQr(row));
  }

  // The list endpoint caps a single request at 100 rows, so a count above
  // that (multiple sheets in one download) needs several page-sized fetches
  // stitched together rather than one call.
  async function fetchBatteriesRange(startPosition, count) {
    const batteries = [];
    let offset = startPosition - 1;
    while (batteries.length < count) {
      const { data } = await apiClient.get('/batteries', {
        params: { qrGenerated: true, limit: Math.min(100, count - batteries.length), offset },
      });
      const page = data.data || [];
      batteries.push(...page);
      offset += page.length;
      if (!data.hasMore || page.length === 0) break;
    }
    return batteries;
  }

  // Pulls however many already-generated batteries the admin asked for
  // (oldest-first, same order as the list below), starting from the
  // position they typed, and lays them out 5-across x 9-down as a
  // print-ready PDF — spilling onto extra A4 pages past 45. `action` is
  // either the preview (opens in a new tab, native PDF viewer) or the save
  // (downloads straight to disk) — same batch, same layout either way.
  async function runSheetAction(action) {
    const startPosition = Math.max(Number(sheetStart) || 1, 1);
    const count = Math.max(Number(sheetCount) || SHEET_SIZE, 1);
    const columns = Math.max(Number(sheetColumns) || DEFAULT_COLUMNS, 1);
    setSheetError(null);
    setSheetLoading(true);
    try {
      const batteries = await fetchBatteriesRange(startPosition, count);
      if (batteries.length === 0) {
        setSheetError(`No generated QR codes found starting from position ${startPosition}.`);
        return;
      }
      await action(batteries, columns);
    } catch (err) {
      setSheetError(err.response?.data?.message || err.message);
    } finally {
      setSheetLoading(false);
    }
  }

  function handlePreviewSheet(e) {
    e.preventDefault();
    runSheetAction(previewQrSheet);
  }

  function handleDownloadSheet(e) {
    e.preventDefault();
    runSheetAction(downloadQrSheet);
  }

  async function handleToggleBlock(row) {
    setRowError(null);
    try {
      await apiClient.patch(`/batteries/${row.id}/block`, { blocked: !row.is_blocked });
      refetchGenerated();
    } catch (err) {
      setRowError(err.response?.data?.message || err.message);
    }
  }

  async function handleConfirmDelete() {
    setRowError(null);
    try {
      await apiClient.delete(`/batteries/${deleteTarget.id}`);
      setDeleteTarget(null);
      refetchGenerated();
    } catch (err) {
      setRowError(err.response?.data?.message || err.message);
      setDeleteTarget(null);
    }
  }

  const qrColumns = [
    {
      key: 'battery_code',
      label: 'Battery ID',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={`/batteries/${row.battery_code}`} className="font-medium text-blue-700 hover:underline dark:text-blue-400">
            {row.battery_code}
          </Link>
          {row.is_blocked && (
            <span className="rounded-full bg-critical-100 px-2 py-0.5 text-[11px] font-semibold text-critical-700 dark:bg-red-500/15 dark:text-red-300">
              Blocked
            </span>
          )}
        </div>
      ),
    },
    { key: 'client_name', label: 'Client', render: (row) => row.client_name || '—' },
    {
      key: 'qr_generated_at',
      label: 'Generated',
      render: (row) => new Date(row.qr_generated_at).toLocaleString(),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="-mr-2 flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleViewRow(row)}
              aria-label={`View QR code for ${row.battery_code}`}
              className="text-slate-400 hover:text-brand-700 dark:text-neutral-500 dark:hover:text-emerald-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                <path
                  fillRule="evenodd"
                  d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadRow(row)}
              className="text-sm font-medium text-brand-700 hover:underline dark:text-emerald-400"
            >
              Download
            </button>
          </div>
          {isSuperAdmin && (
            <RowActions
              onToggleBlock={() => handleToggleBlock(row)}
              isBlocked={row.is_blocked}
              onDelete={() => setDeleteTarget(row)}
            />
          )}
        </div>
      ),
    },
  ];

  function handleReset() {
    setSerialNumber('');
    setClientName('');
    setQrResult(null);
    setError(null);
  }

  return (
    <div>
      <PageHeader
        title="Generate QR Code"
        description="Create a QR code for a battery — scanning it opens its full history."
        titleClassName="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-xl border border-blue-200 p-5 shadow-sm dark:border-blue-800/40"
        >
          <div>
            <label className={labelClasses}>Battery Number</label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. SN-88213 — the number printed on the battery"
              autoComplete="off"
              className={formInputClasses}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-neutral-400">
              Enter the battery's manufacturer serial number (the number physically printed
              on the battery).
            </p>
          </div>

          <div>
            <label className={labelClasses}>Client</label>
            <select
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-md border border-blue-200 bg-black px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-blue-800/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
              required
            >
              <option value="">Select a client</option>
              {(clients || []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <p className="mt-1.5 text-xs text-slate-500 dark:text-neutral-400">
              Select the client/company that owns the battery.
            </p>
          </div>

          <div>
            <label className={labelClasses}>Battery ID</label>
            <input
              type="text"
              value={computedBatteryId}
              readOnly
              placeholder="Select a client to auto-generate"
              className={`${formInputClasses} cursor-not-allowed font-mono opacity-75`}
            />
            <p className="mt-1.5 text-xs text-slate-500 dark:text-neutral-400">
              Automatically generated after you select a client. This is the unique internal ID used
              by the app — you can't edit it.
            </p>
          </div>

          {error && <p className="text-sm text-critical-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-blue-900/30"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-violet-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-violet-800 disabled:opacity-50"
            >
              {submitting ? 'Generating…' : 'Generate QR Code'}
            </button>
          </div>
        </form>

        <div className="flex flex-col items-center justify-center rounded-xl border border-blue-200 p-5 shadow-sm dark:border-blue-800/40">
          {qrResult ? (
            <>
              <img
                src={qrResult.dataUrl}
                alt={`QR code for battery ${qrResult.batteryCode}`}
                className="h-64 w-64 rounded-lg border border-slate-100 dark:border-surface-700"
              />
              <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-neutral-100">{qrResult.batteryCode}</p>
              {qrResult.clientName && (
                <p className="text-sm text-slate-500 dark:text-neutral-400">Client: {qrResult.clientName}</p>
              )}
              <p className="mt-1 max-w-xs truncate text-center text-xs text-slate-400 dark:text-neutral-500">
                {qrResult.detailUrl}
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Download PNG
              </button>
            </>
          ) : (
            <p className="text-center text-sm text-slate-400 dark:text-neutral-500">
              Select a client and generate its QR code to preview it here.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
            Generated QR Codes
          </h2>
          <div className="flex flex-nowrap items-center gap-6 pr-4">
            <input
              type="text"
              value={listSearchInput}
              onChange={(e) => setListSearchInput(e.target.value)}
              placeholder="Search by Battery ID or Client Name"
              className={`${inputClasses} max-w-sm`}
            />
            <select
              value={listClientFilter}
              onChange={(e) => setListClientFilter(e.target.value)}
              className="w-full max-w-[10rem] shrink-0 rounded-md border border-slate-300 bg-black px-3.5 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-blue-800/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/30"
            >
              <option value="">All Clients</option>
              {(clients || []).map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {isSuperAdmin && (
              <label className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm text-slate-600 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={showBlocked}
                  onChange={(e) => setShowBlocked(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500/30 dark:border-surface-600"
                />
                Show blocked
              </label>
            )}
          </div>
        </div>

        <form
          onSubmit={handleDownloadSheet}
          className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-blue-200 p-4 dark:border-blue-800/40"
        >
          <div>
            <label className={labelClasses}>Print QR Sheet — start from #</label>
            <input
              type="number"
              min="1"
              value={sheetStart}
              onChange={(e) => setSheetStart(e.target.value)}
              className={`${inputClasses} max-w-[8rem]`}
            />
          </div>
          <div>
            <label className={labelClasses}>How many</label>
            <input
              type="number"
              min="1"
              value={sheetCount}
              onChange={(e) => setSheetCount(e.target.value)}
              className={`${inputClasses} max-w-[8rem]`}
            />
          </div>
          <div>
            <label className={labelClasses}>Per row</label>
            <input
              type="number"
              min="1"
              value={sheetColumns}
              onChange={(e) => setSheetColumns(e.target.value)}
              className={`${inputClasses} max-w-[8rem]`}
            />
          </div>
          <p className="mb-2.5 text-xs text-slate-500 dark:text-neutral-400">
            One A4 sheet = {(Math.max(Number(sheetColumns) || DEFAULT_COLUMNS, 1)) * ROWS} QR codes (
            {Math.max(Number(sheetColumns) || DEFAULT_COLUMNS, 1)} across x {ROWS} down), oldest-generated
            first, each labeled with its Battery Number. Asking for more spills onto extra sheets in the same PDF.
          </p>
          <div className="ml-auto flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handlePreviewSheet}
              disabled={sheetLoading}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-surface-600 dark:bg-surface-800 dark:text-neutral-200 dark:hover:bg-surface-700"
            >
              {sheetLoading ? 'Building sheet…' : 'View Sheet'}
            </button>
            <button
              type="submit"
              disabled={sheetLoading}
              className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {sheetLoading ? 'Building sheet…' : 'Download Sheet (PDF)'}
            </button>
          </div>
          {sheetError && <p className="w-full text-sm text-critical-600 dark:text-red-400">{sheetError}</p>}
        </form>

        {rowError && (
          <AlertModal title="Action Failed" message={rowError} onClose={() => setRowError(null)} />
        )}

        {listError && <TableState tone="error">{listError}</TableState>}

        {generatedBatteries.length === 0 && listLoading ? (
          <TableState>Loading…</TableState>
        ) : (
          <>
            <DataTable
              columns={qrColumns}
              rows={generatedBatteries}
              emptyMessage="No QR codes generated yet."
              showRowNumber
              headerColor="blue"
            />
            <InfiniteScrollTrigger
              hasMore={listHasMore}
              loading={listLoading}
              onVisible={loadMoreGenerated}
            />
          </>
        )}
      </div>

      {viewingQr && (
        <Modal title={viewingQr.batteryCode} onClose={() => setViewingQr(null)}>
          <div className="flex flex-col items-center">
            <img
              src={viewingQr.dataUrl}
              alt={`QR code for battery ${viewingQr.batteryCode}`}
              className="h-64 w-64 rounded-lg border border-slate-100 dark:border-surface-700"
            />
            {viewingQr.clientName && (
              <p className="mt-4 text-sm text-slate-500 dark:text-neutral-400">Client: {viewingQr.clientName}</p>
            )}
            <p className="mt-1 max-w-xs truncate text-center text-xs text-slate-400 dark:text-neutral-500">
              {viewingQr.detailUrl}
            </p>
            <button
              type="button"
              onClick={() => {
                const link = document.createElement('a');
                link.href = viewingQr.dataUrl;
                link.download = `qr-${viewingQr.batteryCode}.png`;
                link.click();
              }}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Download PNG
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Battery"
          message={`Delete battery "${deleteTarget.battery_code}"? This can't be undone.`}
          requireTyping={false}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default GenerateQrPage;
