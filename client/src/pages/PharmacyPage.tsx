import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Pill, RefreshCw, AlertTriangle } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { PharmacySkeleton } from "../components/pharmacy/PharmacySkeleton";
import { PharmacySummaryCards } from "../components/pharmacy/PharmacySummaryCards";
import { PharmacyFilterBar } from "../components/pharmacy/PharmacyFilterBar";
import { PrescriptionQueueTable } from "../components/pharmacy/PrescriptionQueueTable";
import { DispensePrescriptionModal } from "../components/pharmacy/DispensePrescriptionModal";

interface PharmacyMetrics {
  totalRequisitions: number;
  pendingDispense: number;
  dispensedToday: number;
  lowStockAlerts: number;
}

interface PrescriptionRow {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number;
  patientGender?: string;
  doctorName: string;
  status: string;
  prescribedAt: string;
  items: Array<{
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    prescribedQuantity: number;
    rackLocation?: string;
  }>;
}

export const PharmacyPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PharmacyMetrics>({
    totalRequisitions: 0,
    pendingDispense: 0,
    dispensedToday: 0,
    lowStockAlerts: 0
  });
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);

  // URL state synchronization
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "ALL";
  const selectedPrescriptionId = searchParams.get("prescriptionId") || null;

  const fetchPharmacyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/pharmacy", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchQuery || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined
        }
      });

      if (res.data?.success) {
        setMetrics(res.data.data.metrics);
        setPrescriptions(res.data.data.prescriptions);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load pharmacy dashboard data");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchPharmacyData();
  }, [fetchPharmacyData]);

  const handleSearchChange = (q: string) => {
    setSearchParams((prev) => {
      if (q) prev.set("search", q);
      else prev.delete("search");
      return prev;
    });
  };

  const handleStatusFilterChange = (status: string) => {
    setSearchParams((prev) => {
      if (status && status !== "ALL") prev.set("status", status);
      else prev.delete("status");
      return prev;
    });
  };

  const handleSelectPrescription = (id: string) => {
    setSearchParams((prev) => {
      prev.set("prescriptionId", id);
      return prev;
    });
  };

  const handleCloseModal = () => {
    setSearchParams((prev) => {
      prev.delete("prescriptionId");
      return prev;
    });
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Pill className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Pharmacist Workspace
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Phase 8
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Prescription fulfillment, medication inventory management, and partial/complete dispensing
            </p>
          </div>
        </div>

        <button
          onClick={fetchPharmacyData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-700 border border-slate-700/60 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Workspace
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Workspace Content */}
      {loading ? (
        <PharmacySkeleton />
      ) : (
        <>
          {/* Summary Metric Cards */}
          <PharmacySummaryCards metrics={metrics} />

          {/* Search & Filter Bar */}
          <PharmacyFilterBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
          />

          {/* Prescription Queue Table */}
          <PrescriptionQueueTable
            prescriptions={prescriptions}
            userRole={user?.role || "GUEST"}
            onSelectPrescription={handleSelectPrescription}
          />
        </>
      )}

      {/* Dispense Modal */}
      {selectedPrescriptionId && (
        <DispensePrescriptionModal
          prescriptionId={selectedPrescriptionId}
          userRole={user?.role || "GUEST"}
          onClose={handleCloseModal}
          onSuccess={fetchPharmacyData}
        />
      )}
    </div>
  );
};
