import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AddPromoterPage from "./pages/AddPromoterPage";
import IncidentDetailPage from "./pages/IncidentDetailPage";
import IncidentHistoryPage from "./pages/IncidentHistoryPage";
import LoginPage from "./pages/LoginPage";
import PromotersPage from "./pages/PromotersPage";
import { isAdminUser } from "./utils/authAccess";

function HomeRedirect() {
  const { authUser } = useAuth();

  return <Navigate to={isAdminUser(authUser) ? "/promoters" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/promoters"
        element={
          <ProtectedRoute>
            <PromotersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/promoters/new"
        element={
          <ProtectedRoute>
            <AddPromoterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <IncidentHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents/:incidentId"
        element={
          <ProtectedRoute>
            <IncidentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppRoutes />
      </AppDataProvider>
    </AuthProvider>
  );
}
