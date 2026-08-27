import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { AppointmentsSkeleton } from "../components/appointments/AppointmentsSkeleton";
import { AppointmentsSummaryCards } from "../components/appointments/AppointmentsSummaryCards";
import { AppointmentsFilterBar } from "../components/appointments/AppointmentsFilterBar";
import { AppointmentsTable } from "../components/appointments/AppointmentsTable";
import { NewAppointmentModal } from "../components/appointments/NewAppointmentModal";
import { CheckInQueueModal } from "../components/appointments/CheckInQueueModal";
import { RescheduleAppointmentModal } from "../components/appointments/RescheduleAppointmentModal";
import { Calendar, RefreshCw, AlertCircle } from "lucide-react";

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Data state
  const [metrics, setMetrics] = useState({
    totalAppointmentsToday: 0,
    pendingCheckIns: 0,
    checkedInCount: 0,
    noShowCount: 0
  });
  const [appointments, setAppointments] = useState<any[]>([]);

  // Modal states
  const [bookingModalMode, setBookingModalMode] = useState<"BOOK" | "REGISTER_AND_BOOK" | null>(null);
  const [checkInAppointment, setCheckInAppointment] = useState<any | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<any | null>(null);

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append("search", searchQuery);
      if (statusFilter) queryParams.append("status", statusFilter);

      const res = await axios.get(`/api/appointments?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setMetrics(res.data.data.metrics);
        setAppointments(res.data.data.appointments);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load appointments workspace");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Action handlers
  const handleNoShow = async (id: string) => {
    if (!window.confirm("Are you sure you want to mark this appointment as NO-SHOW?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/appointments/${id}/no-show`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to mark appointment as No-Show");
    }
  };

  const handleCancel = async (id: string) => {
    const reason = window.prompt("Reason for cancelling appointment (optional):");
    if (reason === null) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/appointments/${id}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to cancel appointment");
    }
  };

  if (loading) {
    return <AppointmentsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Appointments & Scheduling</h1>
            <p className="text-xs text-slate-400">Front-desk registration, doctor appointment booking, and queue check-in desk</p>
          </div>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Schedule"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <AppointmentsSummaryCards metrics={metrics} />

      {/* Filter Bar */}
      <AppointmentsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        userRole={user?.role || "DOCTOR"}
        onOpenNewAppointmentModal={() => setBookingModalMode("BOOK")}
        onOpenRegisterModal={() => setBookingModalMode("REGISTER_AND_BOOK")}
      />

      {/* Appointments Schedule Table */}
      <AppointmentsTable
        appointments={appointments}
        userRole={user?.role || "DOCTOR"}
        onCheckIn={(id) => {
          const target = appointments.find((a) => a.id === id);
          if (target) setCheckInAppointment(target);
        }}
        onReschedule={(id) => {
          const target = appointments.find((a) => a.id === id);
          if (target) setRescheduleAppointment(target);
        }}
        onNoShow={handleNoShow}
        onCancel={handleCancel}
      />

      {/* Modals */}
      {bookingModalMode && (
        <NewAppointmentModal
          mode={bookingModalMode}
          onClose={() => setBookingModalMode(null)}
          onSuccess={() => fetchDashboardData()}
        />
      )}

      {checkInAppointment && (
        <CheckInQueueModal
          appointment={checkInAppointment}
          onClose={() => setCheckInAppointment(null)}
          onSuccess={() => fetchDashboardData()}
        />
      )}

      {rescheduleAppointment && (
        <RescheduleAppointmentModal
          appointment={rescheduleAppointment}
          onClose={() => setRescheduleAppointment(null)}
          onSuccess={() => fetchDashboardData()}
        />
      )}
    </div>
  );
};
