import { useSelector } from 'react-redux';
import DashboardPage from '../features/dashboard/DashboardPage';
import ClientDashboardPage from '../features/clients/ClientDashboardPage';
import TechnicianHomePage from '../features/batteries/TechnicianHomePage';

// The "/" landing page differs by role: admins/super_admins get the full
// operations dashboard, clients get their own read-only stats, technicians
// get a minimal "scan to begin" prompt (their real entry point is the QR
// code itself, not this page).
function HomeRoute() {
  const user = useSelector((state) => state.auth.user);

  if (user?.role === 'client') return <ClientDashboardPage />;
  if (user?.role === 'technician') return <TechnicianHomePage />;
  return <DashboardPage />;
}

export default HomeRoute;
