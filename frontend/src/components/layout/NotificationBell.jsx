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
          <span className="absolute right-0.5 top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-critical-600 px-1 text-xs font-semibold text-white">
            {outOfStock.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-md border border-slate-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-900">
          <div className="border-b border-slate-100 px-4 py-2.5 dark:border-surface-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-neutral-100">Out of Stock</p>
          </div>

          {outOfStock.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-neutral-400">
              Everything is in stock.
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {outOfStock.map((part) => (
                <li key={part.id}>
                  <button
                    type="button"
                    onClick={goToInventory}
                    className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-slate-700 hover:bg-critical-50 dark:text-neutral-200 dark:hover:bg-red-500/10"
                  >
                    <span className="font-medium">{part.name}</span>
                    <span className="text-xs text-critical-600 dark:text-red-400">0 in stock</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-slate-100 px-4 py-2 dark:border-surface-700">
            <button
              type="button"
              onClick={goToInventory}
              className="text-sm font-medium text-brand-700 hover:underline dark:text-emerald-400"
            >
              View Inventory →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
