import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdminUser } from "../utils/authAccess";

export default function ProtectedRoute({ children }) {
  const { authUser } = useAuth();
  const location = useLocation();

  if (!authUser || !isAdminUser(authUser)) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
