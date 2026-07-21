import { Suspense, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PortalHeader from './PortalHeader';
import LowStockAlert from './LowStockAlert';
import UnserviceableBatteriesAlert from './UnserviceableBatteriesAlert';
import { useTheme } from '../../context/ThemeContext';
import { connectSocket, disconnectSocket } from '../../services/socket-client';
import refurbnicsLogo from '../../assets/Refurbnics.png';

// Shown in the page content area while a route's chunk downloads (see
// AppRoutes' lazy() imports) — the sidebar/navbar shell stays mounted around
// it instead of the whole screen blanking out.
function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500 dark:text-neutral-400">
      Loading…
    </div>
  );
}

function DashboardLayout() {
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const { theme } = useTheme();
  // Sidebar is hidden entirely below the md breakpoint (no room for a 288px
  // rail) — this drives its mobile drawer instead, opened from a hamburger
  // button in Navbar (admin/super_admin) or the small top bar below (client).
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Powers the real-time push behind NotificationBell/RepeatIntakeAlert/
  // LowStockAlert — connects for the lifetime of an authenticated session
  // and disconnects on logout (token becomes null) or unmount.
  useEffect(() => {
    if (!token) return undefined;
    connectSocket();
    return () => disconnectSocket();
  }, [token]);

  // Technicians work mostly from a phone scanning batteries, so they get the
  // mobile-first header + slide-out drawer instead of a desktop sidebar —
  // styled to match the companion mobile app: a dark header bar (wrapped in
  // its own `dark` scope so PortalHeader's existing dark: styles apply)
  // over a light content area, instead of the black/green admin theme.
  if (user?.role === 'technician') {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-50">
        <div className="dark">
          <PortalHeader />
        </div>
        <main className="flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    );
  }

  // Clients get the same desktop sidebar as admin/staff (via CLIENT_NAV_GROUPS
  // in Sidebar), just without the admin-only Navbar (clock/notifications) or
  // LowStockAlert. Below md, the sidebar is hidden, so a small top bar
  // stands in with just a logo + hamburger to reach the same nav via drawer.
  if (user?.role === 'client') {
    return (
      <div className="dark flex min-h-screen bg-surface-950">
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-surface-950 px-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
              className="rounded-md p-2 text-neutral-300 hover:bg-white/5 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>
            <img src={refurbnicsLogo} alt="Refurbinics" className="-my-6 h-16 w-auto" />
          </header>
          <main className="min-w-0 flex-1 bg-surface-950 p-4 sm:p-6">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} flex min-h-screen bg-white dark:bg-surface-950`}>
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-w-0 flex-1 bg-white p-4 dark:bg-surface-950 sm:p-6">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <LowStockAlert />
      <UnserviceableBatteriesAlert />
    </div>
  );
}

export default DashboardLayout;
