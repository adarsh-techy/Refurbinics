import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { hasPermission } from '../../utils/permissions';
import { logout } from '../../features/auth/auth-slice';
import refurbnicsLogo from '../../assets/Refurbnics.png';

// Client accounts get their own small, fixed nav instead of the operations
// nav below — no permission gating needed since every client sees the
// same 6 links.
const CLIENT_NAV_GROUPS = [
  {
    links: [
      { to: '/', label: 'Dashboard', end: true },
      { to: '/my/transactions', label: 'Transactions' },
      { to: '/my/profile', label: 'Profile' },
      { to: '/my/batteries/packed', label: 'Battery Packed to Repair' },
      { to: '/my/batteries/pending', label: 'Pending' },
      { to: '/my/batteries/received', label: 'Battery Received' },
    ],
  },
];

// Grouped so related pages sit together and adding a new page later means
// dropping one line into the right group — no restructuring needed.
// permission: undefined means "always visible to any authenticated user".
const NAV_GROUPS = [
  {
    links: [{ to: '/', label: 'Dashboard', end: true }],
  },
  {
    heading: 'Battery Management',
    links: [
      { to: '/truck-intakes', label: 'Intake', permission: 'truck_intakes' },
      { to: '/batteries', label: 'All Batteries' },
      { to: '/batteries-qr-code', label: 'Generate QR Code' },
      { to: '/repairs', label: 'Repairs', permission: 'repairs' },
      { to: '/returns', label: 'Returns', permission: 'returns' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { to: '/staff', label: 'Staff', permission: 'staff' },
      { to: '/parts', label: 'Inventory', permission: 'parts' },
      { to: '/clients', label: 'Clients', permission: 'clients' },
    ],
  },
  {
    heading: 'System',
    links: [
      { to: '/audit-logs', label: 'Audit Log', permission: 'audit_logs' },
      { to: '/finance', label: 'Finance', superAdminOnly: true },
      { to: '/users', label: 'Admin Users', superAdminOnly: true },
    ],
  },
];

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Sidebar() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  function isVisible(link) {
    if (link.superAdminOnly) return user?.role === 'super_admin';
    if (link.permission) return hasPermission(user, link.permission);
    return true;
  }

  const groups = user?.role === 'client' ? CLIENT_NAV_GROUPS : NAV_GROUPS;
  const visibleGroups = groups.map((group) => ({
    ...group,
    links: group.links.filter(isVisible),
  })).filter((group) => group.links.length > 0);

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r-[0.5px] border-emerald-950 bg-black md:flex">
      <div className="h-20 overflow-hidden px-6 pt-6">
        <img src={refurbnicsLogo} alt="Refurbinics" className="-mt-14 block h-40 w-auto" />
      </div>

      <div className="mx-5 border-t border-white/10" />

      <nav className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
        {visibleGroups.map((group, i) => (
          <div key={group.heading || `group-${i}`}>
            {group.heading && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-900">
                {group.heading}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `relative rounded-lg px-3 py-2.5 text-sm font-medium leading-none transition-colors ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-emerald-400'
                        : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-2.5">
        <div className="mb-2 flex items-center gap-2 px-1">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
            {initials(user?.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white">{user?.name}</p>
            <p className="truncate text-[11px] capitalize text-neutral-500">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="w-full rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
