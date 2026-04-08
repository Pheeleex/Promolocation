type AuthLikeUser = {
  user_role?: string | null;
} | null;

function normalizeUserRole(userRole?: string | null) {
  return userRole?.trim().toLowerCase();
}

export function hasAdminRole(userRole?: string | null) {
  const normalizedRole = normalizeUserRole(userRole);

  return normalizedRole === "admin" || normalizedRole === "specialadmin";
}

export function hasSpecialAdminRole(userRole?: string | null) {
  return normalizeUserRole(userRole) === "specialadmin";
}

export function isAdminUser(user: AuthLikeUser) {
  return hasAdminRole(user?.user_role);
}

export function isSpecialAdminUser(user: AuthLikeUser) {
  return hasSpecialAdminRole(user?.user_role);
}
