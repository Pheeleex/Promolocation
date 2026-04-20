import { hasRegularAdminRole, hasSpecialAdminRole } from "./authAccess";

export const PROMOTER_CODE_LABEL = "Promo Code";
export const REGULAR_ADMIN_TEAM_LABEL = "Nubiaville Team";
export const SPECIAL_ADMIN_TEAM_LABEL = "Promolocation Agency";
export const DASHBOARD_TEAM_LABEL = `${REGULAR_ADMIN_TEAM_LABEL} and ${SPECIAL_ADMIN_TEAM_LABEL}`;

export function getRoleDisplayName(userRole) {
  if (hasSpecialAdminRole(userRole)) {
    return SPECIAL_ADMIN_TEAM_LABEL;
  }

  if (hasRegularAdminRole(userRole)) {
    return REGULAR_ADMIN_TEAM_LABEL;
  }

  return "User";
}

export function getUserRoleDisplayName(user) {
  return getRoleDisplayName(user?.user_role);
}
