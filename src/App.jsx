import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppDataProvider } from "./context/AppDataContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AddPromoterPage from "./pages/AddPromoterPage";
import BrandsPage from "./pages/BrandsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import IncidentDetailPage from "./pages/IncidentDetailPage";
import IncidentHistoryPage from "./pages/IncidentHistoryPage";
import LoginPage from "./pages/LoginPage";
import PromotionsPage from "./pages/PromotionsPage";
import PromotersPage from "./pages/PromotersPage";
import QrCodesPage from "./pages/QrCodesPage";
import ReportIncidentPage from "./pages/ReportIncidentPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import { getDefaultAuthorizedPath } from "./utils/authAccess";

function HomeRedirect() {
  const { authUser } = useAuth();

  return <Navigate to={getDefaultAuthorizedPath(authUser)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/promoters"
        element={
          <ProtectedRoute disallowSpecialAdmin>
            <PromotersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/promoters/new"
        element={
          <ProtectedRoute disallowSpecialAdmin>
            <AddPromoterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/brands"
        element={
          <ProtectedRoute disallowSpecialAdmin>
            <BrandsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/promotions"
        element={
          <ProtectedRoute disallowSpecialAdmin>
            <PromotionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/promotions/active"
        element={
          <ProtectedRoute disallowSpecialAdmin>
            <PromotionsPage activePromotionOnly />
          </ProtectedRoute>
        }
      />
      <Route
        path="/promotions/:promotionId"
        element={
          <ProtectedRoute disallowSpecialAdmin>
            <PromotionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/qr-codes"
        element={
          <ProtectedRoute disallowSpecialAdmin>
            <QrCodesPage />
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
      <Route
        path="/report_incident"
        element={
          <ProtectedRoute requireSpecialAdmin>
            <ReportIncidentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
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
