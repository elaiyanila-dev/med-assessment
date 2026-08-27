import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PatientQueuePage } from "./pages/PatientQueuePage";
import { DoctorStationPage } from "./pages/DoctorStationPage";
import { PatientHistoryPage } from "./pages/PatientHistoryPage";
import { IPDWardsPage } from "./pages/IPDWardsPage";
import { LaboratoryPage } from "./pages/LaboratoryPage";
import { PharmacyPage } from "./pages/PharmacyPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { PatientDirectoryPage } from "./pages/PatientDirectoryPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { NotFoundPage } from "./pages/NotFoundPage";

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
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="patient-queue" element={<PatientQueuePage />} />
              <Route path="doctor-station" element={<DoctorStationPage />} />
              <Route path="patient-history" element={<PatientHistoryPage />} />
              <Route path="ipd-wards" element={<IPDWardsPage />} />
              <Route path="laboratory" element={<LaboratoryPage />} />
              <Route path="pharmacy" element={<PharmacyPage />} />
              <Route path="users" element={<UserManagementPage />} />
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
