import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api-client';
import { hasPermission } from '../../utils/permissions';

const POLL_MS = 60000;

// Repeat-arrow icon with a badge count of batteries that have come in on
// more than one truck intake this calendar month. Opening it lists each
// battery with every intake time this month, so staff can spot one bouncing
// back unusually fast; clicking jumps to that battery's own history.
function RepeatIntakeAlert() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const canViewIntakes = hasPermission(user, 'truck_intakes');
  const [repeats, setRepeats] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  async function loadRepeats() {
    try {
      const { data } = await apiClient.get('/batteries/repeat-intakes-this-month');
      setRepeats(data);
    } catch {
      // Silent — a failed background refresh shouldn't disrupt the navbar.
    }
  }

  useEffect(() => {
    if (!canViewIntakes) return undefined;
    loadRepeats();
    const interval = setInterval(loadRepeats, POLL_MS);
    return () => clearInterval(interval);
  }, [canViewIntakes]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goToBattery(code) {
    setOpen(false);
    navigate(`/batteries/${code}`);
  }

  function handleToggle() {
    if (!open) loadRepeats();
    setOpen((prev) => !prev);
  }

  if (!canViewIntakes) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Repeat intakes this month"
        className="relative rounded-md p-2.5 text-neutral-300 hover:bg-neutral-900 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7">
          <path
            fillRule="evenodd"
            d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
            clipRule="evenodd"
          />
        </svg>
        {repeats.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-warning-600 px-1 text-xs font-semibold text-white">
            {repeats.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-900">
          <div className="border-b border-slate-100 px-4 py-2.5 dark:border-surface-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-neutral-100">Repeat Intakes This Month</p>
          </div>

          {repeats.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-neutral-400">
              No battery has come in more than once this month.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {repeats.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => goToBattery(b.battery_code)}
                    className="flex w-full flex-col items-start gap-1 px-4 py-2.5 text-left hover:bg-warning-50 dark:hover:bg-amber-500/10"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800 dark:text-neutral-100">
                        {b.battery_code}
                      </span>
                      <span className="shrink-0 rounded-full bg-warning-100 px-2 py-0.5 text-xs font-semibold text-warning-700 dark:bg-amber-500/15 dark:text-amber-300">
                        {b.intake_count}x
                      </span>
                    </div>
                    {b.client_name && (
                      <span className="text-xs text-slate-400 dark:text-neutral-500">{b.client_name}</span>
                    )}
                    <ul className="mt-0.5 flex flex-col gap-0.5">
                      {b.intake_times.map((t) => (
                        <li key={t} className="text-xs text-slate-500 dark:text-neutral-400">
                          {new Date(t).toLocaleString([], {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </li>
                      ))}
                    </ul>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default RepeatIntakeAlert;
