import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdminUser, isSpecialAdminUser } from "../utils/authAccess";

export default function ProtectedRoute({
  children,
  requireSpecialAdmin = false,
  disallowSpecialAdmin = false,
}) {
  const { authUser } = useAuth();
  const location = useLocation();

  if (!authUser || !isAdminUser(authUser)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireSpecialAdmin && !isSpecialAdminUser(authUser)) {
    return <Navigate to="/promoters" replace />;
  }

  if (disallowSpecialAdmin && isSpecialAdminUser(authUser)) {
    return <Navigate to="/incidents" replace />;
  }

  return children;
}
