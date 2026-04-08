type AuthLikeUser = {
  user_role?: string | null;
} | null;

export function hasAdminRole(userRole?: string | null) {
  return userRole?.trim().toLowerCase() === "admin";
}

export function isAdminUser(user: AuthLikeUser) {
  return hasAdminRole(user?.user_role);
}
