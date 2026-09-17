export const ROLES = Object.freeze({
  EMPLOYEE: "Employee",
  MANAGER: "Reporting Manager",
  HR_ADMIN: "HR Admin",
  PLATFORM_ADMIN: "Platform Admin",
});

export const PERMISSIONS = Object.freeze({
  VIEW_SELF: "view:self",
  MANAGE_SELF: "manage:self",
  VIEW_TEAM: "view:team",
  APPROVE_TEAM: "approve:team",
  VIEW_TENANT: "view:tenant",
  MANAGE_TENANT: "manage:tenant",
  VIEW_GLOBAL: "view:global",
  MANAGE_ORGANIZATIONS: "manage:organizations",
  MANAGE_ACCESS: "manage:access",
  VIEW_PLATFORM_AUDIT: "view:platform_audit",
});

const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.EMPLOYEE]: [PERMISSIONS.VIEW_SELF, PERMISSIONS.MANAGE_SELF],
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_SELF,
    PERMISSIONS.MANAGE_SELF,
    PERMISSIONS.VIEW_TEAM,
    PERMISSIONS.APPROVE_TEAM,
  ],
  [ROLES.HR_ADMIN]: [
    PERMISSIONS.VIEW_SELF,
    PERMISSIONS.MANAGE_SELF,
    PERMISSIONS.VIEW_TEAM,
    PERMISSIONS.APPROVE_TEAM,
    PERMISSIONS.VIEW_TENANT,
    PERMISSIONS.MANAGE_TENANT,
  ],
  [ROLES.PLATFORM_ADMIN]: [
    PERMISSIONS.VIEW_GLOBAL,
    PERMISSIONS.MANAGE_ORGANIZATIONS,
    PERMISSIONS.MANAGE_ACCESS,
    PERMISSIONS.VIEW_PLATFORM_AUDIT,
  ],
});

const EMPLOYEE_PAGES = ["Dashboard", "Attendance", "Leave", "Holidays", "Profile"];
const MANAGER_PAGES = [...EMPLOYEE_PAGES, "Approvals", "WhosIn", "TeamCalendar", "Alerts"];
const HR_PAGES = [
  ...EMPLOYEE_PAGES,
  "TeamDashboard",
  "Approvals",
  "WhosIn",
  "TeamCalendar",
  "Alerts",
  "OrganizationOverview",
  "Jobs",
  "Policies",
  "Directory",
  "Overrides",
  "Reports",
];
export const PLATFORM_PAGES = [
  "PlatformOverview",
  "Organizations",
  "Access",
  "PlatformAudit",
  "SystemSettings",
];

export function hasPermission(role, permission) {
  return Boolean(ROLE_PERMISSIONS[role]?.includes(permission));
}

export function allowedPages(role, context = "tenant") {
  if (role === ROLES.PLATFORM_ADMIN && context === "global") return PLATFORM_PAGES;
  if (role === ROLES.HR_ADMIN) return HR_PAGES;
  if (role === ROLES.PLATFORM_ADMIN) return HR_PAGES;
  if (role === ROLES.MANAGER) return MANAGER_PAGES;
  return EMPLOYEE_PAGES;
}

export function canAccessPage(role, page, context = "tenant") {
  return allowedPages(role, context).includes(page);
}

export function activeMembership(session) {
  if (!session?.tenantId) return null;
  return session?.memberships?.find(
    (membership) => membership.tenantId === session.tenantId,
  );
}

export function availableRoles(session) {
  if (session?.role === ROLES.PLATFORM_ADMIN) return [ROLES.PLATFORM_ADMIN];
  return activeMembership(session)?.roles || [];
}

export function isAssignedRole(session, role) {
  if (role === ROLES.PLATFORM_ADMIN) return Boolean(session?.platformAdmin);
  return availableRoles(session).includes(role);
}

export function scopedEmployeeIds(data, employeeId, role) {
  if (hasPermission(role, PERMISSIONS.VIEW_TENANT)) {
    return data.people
      .filter((person) => person.status === "active")
      .map((person) => person.id);
  }
  if (hasPermission(role, PERMISSIONS.VIEW_TEAM)) {
    return data.people
      .filter(
        (person) =>
          person.status === "active" && person.managerId === employeeId,
      )
      .map((person) => person.id);
  }
  return [employeeId];
}

export function canAccessEmployee(data, actorEmployeeId, role, targetEmployeeId) {
  if (actorEmployeeId === targetEmployeeId) return true;
  return scopedEmployeeIds(data, actorEmployeeId, role).includes(targetEmployeeId);
}
