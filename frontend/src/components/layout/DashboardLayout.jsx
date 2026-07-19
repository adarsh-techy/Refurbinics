import { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PortalHeader from './PortalHeader';
import LowStockAlert from './LowStockAlert';

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
  // LowStockAlert.
  if (user?.role === 'client') {
    return (
      <div className="dark flex min-h-screen bg-surface-950">
        <Sidebar />
        <main className="flex-1 bg-surface-950 p-6">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    );
  }

  return (
    <div className="dark flex min-h-screen bg-surface-950">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1 bg-surface-950 p-6">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <LowStockAlert />
    </div>
  );
}

export default DashboardLayout;
