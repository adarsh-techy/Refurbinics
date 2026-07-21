import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import apiClient from '../../services/api-client';
import { socket } from '../../services/socket-client';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import AlertModal from '../../components/ui/AlertModal';
import TableState from '../../components/ui/TableState';
import { StatusBadge } from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import BatteryStatusForm from './BatteryStatusForm';
import TechnicianRepairPanel from './TechnicianRepairPanel';

const STATUS_ACCENT = {
  in_repair: 'border-warning-500',
  in_progress: 'border-critical-500',
  in_testing: 'border-blue-500',
  repaired: 'border-brand-500',
  returned: 'border-info-500',
};

const STATUS_ICON_BG = {
  in_repair: 'bg-warning-100 text-warning-700 dark:bg-amber-500/15 dark:text-amber-300',
  in_progress: 'bg-critical-100 text-critical-700 dark:bg-red-500/15 dark:text-red-300',
  in_testing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  repaired: 'bg-brand-100 text-brand-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  returned: 'bg-info-100 text-info-700 dark:bg-sky-500/15 dark:text-sky-300',
};

// Tints the status banner itself so the battery's state reads at a glance
// instead of only showing up in the thin left border + small icon. Dark
// mode fades to pure black (not surface-900) to match the rest of the app's
// black-based theme (sidebar, navbar, modals).
const STATUS_BANNER_BG = {
  in_repair: 'from-amber-50 to-white dark:from-amber-500/15 dark:to-black',
  in_progress: 'from-red-50 to-white dark:from-red-500/15 dark:to-black',
  in_testing: 'from-blue-50 to-white dark:from-blue-500/15 dark:to-black',
  repaired: 'from-emerald-50 to-white dark:from-emerald-500/15 dark:to-black',
  returned: 'from-sky-50 to-white dark:from-sky-500/15 dark:to-black',
};

const EVENT_META = {
  intake: {
    label: 'Intake',
    dot: 'bg-slate-100 text-slate-600 dark:bg-surface-700 dark:text-neutral-300',
    icon: (
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h7A1.5 1.5 0 0 1 13 6.5V8h1.379a1.5 1.5 0 0 1 1.06.44l2.122 2.12A1.5 1.5 0 0 1 18 11.622V13.5a1.5 1.5 0 0 1-1.5 1.5H16a2 2 0 1 1-4 0H8a2 2 0 1 1-4 0h-.5A1.5 1.5 0 0 1 2 13.5v-6A1.5 1.5 0 0 1 3.5 6H3v.5ZM14 9.5v3h2.5v-1.878L14.379 9.5H14ZM6 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
    ),
  },
  repair: {
    label: 'Repair',
    dot: 'bg-brand-100 text-brand-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    icon: (
      <path
        fillRule="evenodd"
        d="M14.279 2.152a.75.75 0 0 1 .07 1.058l-2.487 2.85 1.278 1.279 2.85-2.488a.75.75 0 0 1 1.058.07 4.5 4.5 0 0 1-5.048 6.965l-4.5 4.949a2.121 2.121 0 1 1-3-3l4.949-4.5a4.5 4.5 0 0 1 6.965-5.048 4.462 4.462 0 0 1 .865-1.135ZM4.5 15a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"
        clipRule="evenodd"
      />
    ),
  },
  return: {
    label: 'Returned',
    dot: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    icon: (
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
        clipRule="evenodd"
      />
    ),
  },
};

// Flattens every truck intake this battery's ever been part of, every
// repair, and every return into one chronological (oldest-first) list of
// events. A battery that's come back on a different truck for a second (or
// third...) repair round shows one "Intake" event per truck, not just its
// original one.
function buildEvents(visits, history, returns) {
  const events = [];

  visits.forEach((v) => {
    events.push({
      key: `intake-${v.visit_id}`,
      type: 'intake',
      date: v.intake_at,
      primary: `Truck ${v.truck_number} · Driver ${v.driver_name}`,
    });
  });

  history.forEach((h) => {
    events.push({
      key: `repair-${h.id}`,
      type: 'repair',
      date: h.repaired_at,
      primary: `${h.part_name} · by ${h.staff_name}`,
      price: Number(h.price) + Number(h.labor_charge || 0),
      notes: h.notes,
    });
  });

  returns.forEach((r) => {
    events.push({
      key: `return-${r.id}`,
      type: 'return',
      date: r.returned_at,
      primary: `Truck ${r.truck_number} · Driver ${r.driver_name}`,
    });
  });

  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Standard 5-step process indicator (Intake → Started → Tested → Repaired →
// Returned) shown above each cycle's detailed timeline, mirroring the
// battery's real status machine (in_repair -> in_progress -> in_testing ->
// repaired -> returned) so the cycle's overall progress reads at a glance
// before drilling into individual events.
const PROCESS_STEPS = ['Intake', 'Started', 'Tested', 'Repaired', 'Returned'];
const STATUS_STEP_INDEX = { in_repair: 0, in_progress: 1, in_testing: 2, repaired: 3, returned: 4 };

function ProcessStepper({ isOngoing, batteryStatus }) {
  // A closed cycle (has a Returned event) passed through every stage.
  // An ongoing cycle's progress is read straight off the battery's live
  // status: everything up to and including that status is done, the next
  // step is the current/pending action, everything after is untouched.
  const threshold = isOngoing ? STATUS_STEP_INDEX[batteryStatus] ?? 0 : PROCESS_STEPS.length - 1;

  const stepState = PROCESS_STEPS.map((_, i) => {
    if (i <= threshold) return 2; // done
    if (i === threshold + 1) return 1; // current / next action
    return 0; // pending
  });

  return (
    <div className="flex items-center">
      {PROCESS_STEPS.map((label, i) => {
        const state = stepState[i];
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  state === 2
                    ? 'bg-brand-600 text-white dark:bg-emerald-500'
                    : state === 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-surface-700 dark:text-neutral-400'
                }`}
              >
                {state === 2 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  state === 0
                    ? 'text-slate-400 dark:text-neutral-500'
                    : 'text-slate-700 dark:text-neutral-200'
                }`}
              >
                {label}
              </span>
            </div>
            {i < PROCESS_STEPS.length - 1 && (
              <span
                className={`mx-2 mb-5 h-0.5 flex-1 rounded ${
                  state === 2 ? 'bg-brand-600 dark:bg-emerald-500' : 'bg-slate-200 dark:bg-surface-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Groups the flat event list into cycles: the first cycle is Intake +
// repair(s) + Returned; each cycle after that is another repair(s) +
// Returned round-trip. A "Returned" event always closes its cycle — the
// next event (if any) starts a new one. A battery currently back at the
// shop ends in a trailing cycle with no Returned event yet.
function buildCycles(events) {
  const cycles = [];
  let current = [];

  for (const event of events) {
    current.push(event);
    if (event.type === 'return') {
      cycles.push(current);
      current = [];
    }
  }
  if (current.length > 0) cycles.push(current);

  return cycles;
}

// Spec requirement: looking up a battery by its unique ID shows its full
// history — which truck/driver brought it in, every part changed and by
// whom, and which truck/driver took it back out — grouped one cycle
// (intake/repair/return round-trip) at a time, in order.
function BatteryDetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === 'super_admin';
  const isTechnician = user?.role === 'technician';

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/batteries/${encodeURIComponent(code)}`);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  // Reloads while this page is open if the same battery changes elsewhere —
  // e.g. a technician starting work, completing testing, or reporting an
  // issue in the mobile app — instead of requiring a manual refresh.
  useEffect(() => {
    function handleUpdated(battery) {
      if (battery?.battery_code === code) load();
    }
    socket.on('battery:updated', handleUpdated);
    return () => socket.off('battery:updated', handleUpdated);
  }, [code, load]);

  // Deterministic from the battery code (same as Generate QR Code's
  // regenerate-on-view) — nothing needs to be stored, so it can always be
  // rebuilt here rather than only being visible from the Generate QR page.
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(`${window.location.origin}/batteries/${encodeURIComponent(code)}`, {
      width: 320,
      margin: 1,
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  function handleDownloadQr() {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${code}.png`;
    link.click();
  }

  function handleSaved() {
    setShowEdit(false);
    load();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete battery "${code}"?`)) return;
    setDeleteError(null);
    try {
      await apiClient.delete(`/batteries/${result.battery.id}`);
      navigate('/batteries');
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message);
    }
  }

  if (loading) return <TableState>Loading…</TableState>;
  if (error) {
    return (
      <div>
        <Link
          to="/batteries"
          className="mb-4 inline-block text-sm text-brand-700 hover:underline dark:text-emerald-400"
        >
          ← Back to Global Battery
        </Link>
        <TableState tone="error">{error}</TableState>
      </div>
    );
  }

  const { battery, history, returns, visits, recycleBatch } = result;
  const cycles = buildCycles(buildEvents(visits || [], history, returns));
  const totalSpent = history.reduce(
    (sum, h) => sum + Number(h.price) + Number(h.labor_charge || 0),
    0
  );
  // A repair "visit" is every part changed at the same time (same batch_id),
  // not one count per part — changing 3 parts in one visit is 1 repair, not 3.
  const repairVisits = new Set(history.map((h) => h.batch_id)).size;
  const now = new Date();
  const repairVisitsThisMonth = new Set(
    history
      .filter((h) => {
        const d = new Date(h.repaired_at);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .map((h) => h.batch_id)
  ).size;

  return (
    <div>
      <Link
        to="/batteries"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-emerald-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
            clipRule="evenodd"
          />
        </svg>
        Back to Global Battery
      </Link>

      <PageHeader title={battery.battery_code} description="Full intake-to-return history.">
        {isSuperAdmin && (
          <>
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        )}
      </PageHeader>

      {showEdit && (
        <Modal
          title="Edit Battery"
          description="Correct this battery's status."
          onClose={() => setShowEdit(false)}
        >
          <BatteryStatusForm battery={battery} onSaved={handleSaved} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}

      {deleteError && (
        <AlertModal title="Cannot Delete Battery" message={deleteError} onClose={() => setDeleteError(null)} />
      )}

      {showQrModal && (
        <Modal title={battery.battery_code} onClose={() => setShowQrModal(false)}>
          <div className="flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for battery ${battery.battery_code}`}
                className="h-64 w-64 rounded-lg border border-slate-100 dark:border-surface-700"
              />
            ) : (
              <div className="flex h-64 w-64 items-center justify-center text-sm text-slate-400 dark:text-neutral-500">
                Generating…
              </div>
            )}
            {!isTechnician && battery.client_name && (
              <p className="mt-4 text-sm text-slate-500 dark:text-neutral-400">Client: {battery.client_name}</p>
            )}
            {battery.serial_number && (
              <p className="text-sm text-slate-500 dark:text-neutral-400">Battery Number: {battery.serial_number}</p>
            )}
            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              Download PNG
            </button>
          </div>
        </Modal>
      )}

      <div
        className={`mb-6 flex flex-wrap items-center gap-4 rounded-xl border-l-4 border-y border-r border-slate-200 bg-gradient-to-r p-5 shadow-sm dark:border-y-surface-700 dark:border-r-surface-700 ${STATUS_ACCENT[battery.status] || 'border-slate-300'} ${STATUS_BANNER_BG[battery.status] || 'from-white to-slate-50 dark:from-surface-900 dark:to-black'}`}
      >
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${STATUS_ICON_BG[battery.status] || 'bg-slate-100 text-slate-500'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M7 2a1 1 0 0 0-1 1v1H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H8V3a1 1 0 0 0-1-1Zm10 10h-2v3h-2v-3h-2v-2h2V7h2v3h2v2Z" />
          </svg>
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={battery.status} />
            {!isTechnician && battery.client_name && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-surface-700 dark:text-neutral-300">
                Client: {battery.client_name}
              </span>
            )}
            {battery.serial_number && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-surface-700 dark:text-neutral-300">
                Battery Number: {battery.serial_number}
              </span>
            )}
            {battery.status === 'in_progress' && battery.started_by_name && (
              <span className="flex items-center gap-1 rounded-full bg-critical-100 px-2.5 py-0.5 text-xs font-medium text-critical-700 dark:bg-red-500/15 dark:text-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                </svg>
                Being worked on by {battery.started_by_name}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Tracked since{' '}
            {battery.created_at ? new Date(battery.created_at).toLocaleDateString() : '—'}
          </p>
          {repairVisitsThisMonth > 1 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-critical-600 dark:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
              Serviced {repairVisitsThisMonth} times this month — worth a closer look.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          title="View / download QR code"
          className="shrink-0 rounded-lg border border-slate-200 bg-white p-1 shadow-sm transition-transform hover:scale-105 dark:border-surface-700 dark:bg-black"
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for battery ${battery.battery_code}`}
              className="h-16 w-16 rounded-md"
            />
          ) : (
            <div className="h-16 w-16 animate-pulse rounded-md bg-slate-100 dark:bg-surface-800" />
          )}
        </button>
      </div>

      {(battery.status === 'unserviceable' || battery.status === 'recycled') && result.issues?.[0] && (
        <div className="mb-6 rounded-xl border border-critical-200 bg-critical-50 p-5 dark:border-red-500/30 dark:bg-red-500/10">
          <h2 className="mb-1 text-sm font-semibold text-critical-700 dark:text-red-300">
            {result.issues[0].reason_label}
          </h2>
          {result.issues[0].note && (
            <p className="mb-1 text-sm text-slate-600 dark:text-neutral-300">{result.issues[0].note}</p>
          )}
          <p className="text-xs text-slate-500 dark:text-neutral-500">
            Reported by {result.issues[0].staff_name} on{' '}
            {new Date(result.issues[0].reported_at).toLocaleString()}
          </p>
        </div>
      )}

      {battery.status === 'recycled' && recycleBatch && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-surface-700 dark:bg-surface-900">
          <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-neutral-200">Sent for Recycling</h2>
          <p className="text-sm text-slate-600 dark:text-neutral-300">
            Vehicle <span className="font-medium">{recycleBatch.vehicle_number}</span> · Driver{' '}
            <span className="font-medium">{recycleBatch.driver_name}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-neutral-500">
            {new Date(recycleBatch.recycled_at).toLocaleString()} ·{' '}
            <Link to={`/recycle/${recycleBatch.id}`} className="text-blue-700 hover:underline dark:text-blue-400">
              View shipment
            </Link>
          </p>
        </div>
      )}

      {isTechnician && <TechnicianRepairPanel battery={battery} onUpdated={load} />}

      <div className={`mb-6 grid grid-cols-1 gap-4 ${isTechnician ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        <StatCard label="Repairs Logged" value={repairVisits} tone="good" />
        <StatCard label="Return Shipments" value={returns.length} tone="info" />
        {!isTechnician && (
          <StatCard label="Total Repair Cost" value={`£${totalSpent.toFixed(2)}`} tone="warning" />
        )}
      </div>

      {cycles.length === 0 ? (
        <TableState>No history recorded for this battery yet.</TableState>
      ) : (
        <div className="flex flex-col gap-6">
          {cycles.map((cycle, i) => {
            const isOngoing = i === cycles.length - 1 && !cycle.some((e) => e.type === 'return');
            // Repaired-but-not-yet-shipped-back reads as green ("ready to
            // return") instead of the amber "still with the shop" state;
            // a cycle that's actually closed (returned) reads as blue,
            // distinct from the "repaired" green so the two don't look the
            // same at a glance.
            const cardTone = !isOngoing ? 'blue' : battery.status === 'repaired' ? 'green' : 'amber';
            const cardLabel = cardTone === 'amber' ? 'With the Shop' : cardTone === 'green' ? 'Ready to Return' : 'Completed';
            const TONE_CLASSES = {
              amber: {
                border: 'border-warning-500',
                bg: 'bg-warning-100 dark:bg-amber-500/15',
                text: 'text-warning-700 dark:text-amber-300',
              },
              green: {
                border: 'border-brand-500',
                bg: 'bg-green-100 dark:bg-emerald-500/15',
                text: 'text-green-800 dark:text-emerald-300',
              },
              blue: {
                border: 'border-info-500',
                bg: 'bg-info-100 dark:bg-sky-500/15',
                text: 'text-info-700 dark:text-sky-300',
              },
            };
            const tone = TONE_CLASSES[cardTone];
            return (
              <div
                key={cycle[0].key}
                className={`overflow-hidden rounded-xl border-l-4 border-y border-r border-slate-200 bg-white shadow-sm dark:border-y-surface-700 dark:border-r-surface-700 dark:bg-black ${tone.border}`}
              >
                <div className={`flex items-center justify-between px-5 py-3 ${tone.bg}`}>
                  <h2 className={`text-xs font-bold uppercase tracking-wider ${tone.text}`}>
                    Cycle {i + 1}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold dark:bg-surface-800/70 ${tone.text}`}
                  >
                    {cardTone === 'amber' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .2.08.39.22.53l3.5 3.5a.75.75 0 1 0 1.06-1.06l-3.28-3.28V5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {cardLabel}
                  </span>
                </div>
                <div className="border-b border-slate-100 px-6 py-5 dark:border-surface-800">
                  <ProcessStepper isOngoing={isOngoing} batteryStatus={battery.status} />
                </div>
                <div className="p-5">
                <ol>
                  {cycle.map((event, idx) => {
                    const meta = EVENT_META[event.type];
                    const isLast = idx === cycle.length - 1;
                    return (
                      <li key={event.key} className="relative flex gap-4">
                        {!isLast && (
                          <span className="absolute left-4 top-9 bottom-0 w-px -translate-x-1/2 bg-slate-200 dark:bg-surface-700" />
                        )}
                        <span
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.dot}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            {meta.icon}
                          </svg>
                        </span>
                        <div className={`min-w-0 flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
                          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-slate-800 dark:text-neutral-100">
                              {meta.label}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-neutral-500">
                              {new Date(event.date).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-neutral-300">{event.primary}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {!isTechnician && event.price !== undefined && (
                              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                £{Number(event.price).toFixed(2)}
                              </span>
                            )}
                            {event.notes && (
                              <span className="text-xs text-slate-400 dark:text-neutral-500">{event.notes}</span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BatteryDetailPage;
