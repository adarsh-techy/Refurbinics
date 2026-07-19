import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api-client';
import { hasPermission } from '../../utils/permissions';

const POLL_MS = 60000;

// Bell icon with a badge count of out-of-stock parts. Opening it lists each
// one; clicking an item (or "View Inventory") jumps to the Inventory page.
// Only shown to users who can actually reach that page.
function NotificationBell() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const canViewInventory = hasPermission(user, 'parts');
  const [outOfStock, setOutOfStock] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  async function loadOutOfStock() {
    try {
      const { data } = await apiClient.get('/parts');
      setOutOfStock(data.filter((p) => !p.in_stock));
    } catch {
      // Silent — a failed background refresh shouldn't disrupt the navbar.
    }
  }

  useEffect(() => {
    if (!canViewInventory) return undefined;
    loadOutOfStock();
    const interval = setInterval(loadOutOfStock, POLL_MS);
    return () => clearInterval(interval);
  }, [canViewInventory]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goToInventory() {
    setOpen(false);
    navigate('/parts');
  }

  function handleToggle() {
    if (!open) loadOutOfStock();
    setOpen((prev) => !prev);
  }

  if (!canViewInventory) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative rounded-md p-2.5 text-neutral-300 hover:bg-neutral-900 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7">
          <path d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076c1.65.351 3.32.618 5.008.799a3 3 0 1 0 5.468 0 41.7 41.7 0 0 0 5.008-.799.75.75 0 0 0 .515-1.076A11.45 11.45 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 1.5 1.5 0 0 1-3.9 0Z" />
        </svg>
        {outOfStock.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-[1.25rem] animate-pulse items-center justify-center rounded-full bg-critical-600 px-1 text-xs font-semibold text-white ring-2 ring-black">
            {outOfStock.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-900">
          <div className="flex items-center gap-2.5 border-b border-slate-100 bg-gradient-to-r from-critical-50 to-white px-4 py-3 dark:border-surface-700 dark:from-red-500/10 dark:to-surface-900">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-critical-100 text-critical-700 dark:bg-red-500/15 dark:text-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-neutral-100">Out of Stock</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {outOfStock.length === 0
                  ? 'Everything is in stock'
                  : `${outOfStock.length} part${outOfStock.length === 1 ? '' : 's'} need restocking`}
              </p>
            </div>
          </div>

          {outOfStock.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-surface-800 dark:text-neutral-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <p className="text-sm text-slate-500 dark:text-neutral-400">Everything is in stock.</p>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto p-2">
              {outOfStock.map((part) => (
                <li key={part.id}>
                  <button
                    type="button"
                    onClick={goToInventory}
                    className="group flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-critical-200 hover:bg-critical-50 dark:hover:border-red-500/20 dark:hover:bg-red-500/10"
                  >
                    <span className="truncate text-sm font-semibold text-slate-800 group-hover:text-critical-800 dark:text-neutral-100 dark:group-hover:text-red-200">
                      {part.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-critical-100 px-2 py-0.5 text-xs font-bold text-critical-700 dark:bg-red-500/15 dark:text-red-300">
                      0 left
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-slate-100 px-4 py-2.5 dark:border-surface-700">
            <button
              type="button"
              onClick={goToInventory}
              className="flex w-full items-center justify-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-emerald-400"
            >
              View Inventory
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H3a.75.75 0 0 1 0-1.5h12.69l-2.97-2.97a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
