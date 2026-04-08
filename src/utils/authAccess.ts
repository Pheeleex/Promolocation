type AuthLikeUser = {
  user_role?: string | null;
} | null;

export function hasAdminRole(userRole?: string | null) {
  const normalizedRole = userRole?.trim().toLowerCase();

  return normalizedRole === "admin" || normalizedRole === "specialadmin";
}

export function isAdminUser(user: AuthLikeUser) {
  return hasAdminRole(user?.user_role);
}
