// The manageable modules a super_admin can grant to an admin account.
// Keys match the route/module name; battery lookup, the dashboard, and user
// management aren't in this list — batteries/dashboard stay open to any
// authenticated user, and user management is always super_admin-only.
const PERMISSIONS = [
  'truck_intakes',
  'repairs',
  'staff',
  'parts',
  'returns',
  'recycle',
  'audit_logs',
  'clients',
  'issue_reasons',
];

module.exports = { PERMISSIONS };
