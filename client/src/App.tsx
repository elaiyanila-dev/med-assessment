import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleGuard } from "./components/auth/RoleGuard";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PatientQueuePage } from "./pages/PatientQueuePage";
import { DoctorStationPage } from "./pages/DoctorStationPage";
import { AdminDoctorStationPage } from "./pages/AdminDoctorStationPage";
import { PatientHistoryPage } from "./pages/PatientHistoryPage";
import { AdminPatientHistoryPage } from "./pages/AdminPatientHistoryPage";
import { IPDWardsPage } from "./pages/IPDWardsPage";
import { LaboratoryPage } from "./pages/LaboratoryPage";
import { PharmacyPage } from "./pages/PharmacyPage";
import { InventoryAssetsPage } from "./pages/InventoryAssetsPage";
import { BillingClaimsPage } from "./pages/BillingClaimsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SystemSettingsPage } from "./pages/SystemSettingsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { PatientDirectoryPage } from "./pages/PatientDirectoryPage";
import { AddPatientPage } from "./pages/AddPatientPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { useAuth } from "./context/AuthContext";

const DoctorStationRoute: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return isAdmin ? <AdminDoctorStationPage /> : <DoctorStationPage />;
};

const PatientHistoryRoute: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return isAdmin ? <AdminPatientHistoryPage /> : <PatientHistoryPage />;
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Application Shell & Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="patients" element={<PatientDirectoryPage />} />
              <Route
                path="patients/new"
                element={
                  <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"]}>
                    <AddPatientPage />
                  </RoleGuard>
                }
              />
              <Route
                path="registration"
                element={
                  <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"]}>
                    <AddPatientPage />
                  </RoleGuard>
                }
              />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="patient-queue" element={<PatientQueuePage />} />
              <Route path="doctor-station" element={<DoctorStationRoute />} />
              <Route path="doctor" element={<DoctorStationRoute />} />
              <Route path="patient-history" element={<PatientHistoryRoute />} />
              <Route path="history" element={<PatientHistoryRoute />} />
              <Route path="ipd-wards" element={<IPDWardsPage />} />
              <Route path="laboratory" element={<LaboratoryPage />} />
              <Route path="pharmacy" element={<PharmacyPage />} />
              <Route
                path="inventory"
                element={
                  <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                    <InventoryAssetsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="billing"
                element={
                  <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN", "RECEPTIONIST"]}>
                    <BillingClaimsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="analytics"
                element={
                  <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                    <AnalyticsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="settings"
                element={
                  <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
                    <SystemSettingsPage />
                  </RoleGuard>
                }
              />
              <Route path="admin" element={<UserManagementPage />} />
              <Route path="users" element={<Navigate to="/admin" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* Catch-all route outside shell */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
