// Mirrors backend/src/config/permissions.js. Kept as a small, manually
// synced constant rather than fetched from the API, since it changes rarely.
export const PERMISSIONS = [
  { key: 'truck_intakes', label: 'Truck Intake' },
  { key: 'repairs', label: 'Repairs' },
  { key: 'staff', label: 'Staff' },
  { key: 'parts', label: 'Inventory' },
  { key: 'returns', label: 'Returns' },
  { key: 'audit_logs', label: 'Audit Log' },
  { key: 'clients', label: 'Clients' },
  { key: 'issue_reasons', label: 'Issue Reasons' },
];

// super_admin implicitly has every permission; an admin only has what's in
// user.permissions.
export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  return (user.permissions || []).includes(permission);
}
