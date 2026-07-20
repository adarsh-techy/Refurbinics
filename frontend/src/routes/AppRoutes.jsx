import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import HomeRoute from './HomeRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import SetPasswordPage from '../features/auth/SetPasswordPage';
import NotFoundPage from '../pages/NotFoundPage';

// Every other route is loaded on demand — each feature page (and whatever
// heavy libraries it alone pulls in, e.g. jspdf on the battery detail page)
// ships in its own chunk instead of bloating the one bundle every user
// downloads just to reach the login screen. DashboardLayout wraps its
// <Outlet /> in a Suspense boundary, so the sidebar/navbar shell stays
// mounted while a page chunk loads.
const TruckIntakePage = lazy(() => import('../features/truck-intake/TruckIntakePage'));
const TruckIntakeDetailPage = lazy(() => import('../features/truck-intake/TruckIntakeDetailPage'));
const BatteriesPage = lazy(() => import('../features/batteries/BatteriesPage'));
const UnserviceableBatteriesPage = lazy(() => import('../features/batteries/UnserviceableBatteriesPage'));
const BatteryDetailPage = lazy(() => import('../features/batteries/BatteryDetailPage'));
const GenerateQrPage = lazy(() => import('../features/batteries/GenerateQrPage'));
const RepairsPage = lazy(() => import('../features/repairs/RepairsPage'));
const StaffPage = lazy(() => import('../features/staff/StaffPage'));
const StaffDetailPage = lazy(() => import('../features/staff/StaffDetailPage'));
const PartsPage = lazy(() => import('../features/parts/PartsPage'));
const PartDetailPage = lazy(() => import('../features/parts/PartDetailPage'));
const ClientsPage = lazy(() => import('../features/clients/ClientsPage'));
const IssueReasonsPage = lazy(() => import('../features/issue-reasons/IssueReasonsPage'));
const ClientDetailPage = lazy(() => import('../features/clients/ClientDetailPage'));
const ClientBatteriesPage = lazy(() => import('../features/clients/ClientBatteriesPage'));
const ClientTransactionsPage = lazy(() => import('../features/clients/ClientTransactionsPage'));
const ClientProfilePage = lazy(() => import('../features/clients/ClientProfilePage'));
const TechnicianDashboardPage = lazy(() => import('../features/batteries/TechnicianDashboardPage'));
const TechnicianHistoryPage = lazy(() => import('../features/batteries/TechnicianHistoryPage'));
const ReturnsPage = lazy(() => import('../features/returns/ReturnsPage'));
const ReturnDetailPage = lazy(() => import('../features/returns/ReturnDetailPage'));
const AuditLogPage = lazy(() => import('../features/audit-log/AuditLogPage'));
const FinancePage = lazy(() => import('../features/finance/FinancePage'));
const UsersPage = lazy(() => import('../features/users/UsersPage'));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* TEMPORARY: remove this route once real admin management is in use. */}
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/set-password" element={<SetPasswordPage />} />

        <Route element={<DashboardLayout />}>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/batteries/:code" element={<BatteryDetailPage />} />

          <Route element={<ProtectedRoute roles={['super_admin', 'admin']} />}>
            <Route path="/batteries" element={<BatteriesPage />} />
            <Route path="/batteries/unserviceable" element={<UnserviceableBatteriesPage />} />
            <Route path="/batteries-qr-code" element={<GenerateQrPage />} />
          </Route>

          <Route element={<ProtectedRoute permission="truck_intakes" />}>
            <Route path="/truck-intakes" element={<TruckIntakePage />} />
            <Route path="/truck-intakes/:id" element={<TruckIntakeDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="repairs" />}>
            <Route path="/repairs" element={<RepairsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="staff" />}>
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/staff/:id" element={<StaffDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="parts" />}>
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/parts/:id" element={<PartDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="clients" />}>
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="issue_reasons" />}>
            <Route path="/issue-reasons" element={<IssueReasonsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['client']} />}>
            <Route path="/my/transactions" element={<ClientTransactionsPage />} />
            <Route path="/my/batteries/:bucket" element={<ClientBatteriesPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['client', 'technician']} />}>
            <Route path="/my/profile" element={<ClientProfilePage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['technician']} />}>
            <Route path="/my/dashboard" element={<TechnicianDashboardPage />} />
            <Route path="/my/history" element={<TechnicianHistoryPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="returns" />}>
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/returns/:id" element={<ReturnDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="audit_logs" />}>
            <Route path="/audit-logs" element={<AuditLogPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['super_admin']} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/finance" element={<FinancePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
