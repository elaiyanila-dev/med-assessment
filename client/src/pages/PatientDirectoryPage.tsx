import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { PatientDirectorySkeleton } from "../components/patients/PatientDirectorySkeleton";
import { PatientSummaryCards } from "../components/patients/PatientSummaryCards";
import { PatientFilterBar } from "../components/patients/PatientFilterBar";
import { PatientTable } from "../components/patients/PatientTable";
import { PatientProfileDrawer } from "../components/patients/PatientProfileDrawer";
import { EditPatientModal } from "../components/patients/EditPatientModal";
import { ManageAllergiesModal } from "../components/patients/ManageAllergiesModal";
import { ManageConditionsModal } from "../components/patients/ManageConditionsModal";
import { NewPatientModal } from "../components/patients/NewPatientModal";
import { Users, RefreshCw, AlertCircle } from "lucide-react";

export const PatientDirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState("ALL");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Data States
  const [metrics, setMetrics] = useState({
    totalRegistered: 0,
    opdCount: 0,
    ipdCount: 0,
    emergencyCount: 0
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1
  });
  const [patients, setPatients] = useState<any[]>([]);

  // Modal & Drawer States
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [addAllergyPatientId, setAddAllergyPatientId] = useState<string | null>(null);
  const [addConditionPatientId, setAddConditionPatientId] = useState<string | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  const fetchDirectory = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append("search", searchQuery);
      if (registrationTypeFilter !== "ALL") queryParams.append("registrationType", registrationTypeFilter);
      if (bloodGroupFilter !== "ALL") queryParams.append("bloodGroup", bloodGroupFilter);
      if (priorityFilter !== "ALL") queryParams.append("priority", priorityFilter);
      queryParams.append("page", currentPage.toString());
      queryParams.append("limit", "20");

      const res = await axios.get(`/api/patients?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setMetrics(res.data.data.metrics);
        setPagination(res.data.data.pagination);
        setPatients(res.data.data.patients);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load master patient directory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, registrationTypeFilter, bloodGroupFilter, priorityFilter, currentPage]);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Fetch Full Profile for Drawer
  const handleViewProfile = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setProfileData(res.data.data);
        setSelectedProfileId(id);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to fetch patient profile details");
    }
  };

  // Remove Allergy
  const handleRemoveAllergy = async (allergyId: string) => {
    if (!selectedProfileId) return;
    if (!window.confirm("Are you sure you want to remove this allergy safety alert?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`/api/patients/${selectedProfileId}/allergies/${allergyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        handleViewProfile(selectedProfileId);
        fetchDirectory();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to remove allergy alert");
    }
  };

  // Update Condition Status
  const handleUpdateConditionStatus = async (conditionId: string, currentStatus: string) => {
    if (!selectedProfileId) return;
    const newStatus = currentStatus === "ACTIVE" ? "RESOLVED" : "ACTIVE";

    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `/api/patients/${selectedProfileId}/conditions/${conditionId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        handleViewProfile(selectedProfileId);
        fetchDirectory();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to update condition status");
    }
  };

  // Soft Delete
  const handleSoftDelete = async (id: string) => {
    const reason = window.prompt("Reason for soft deleting patient profile (optional):");
    if (reason === null) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`/api/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason }
      });

      if (res.data?.success) {
        fetchDirectory();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to soft delete patient profile");
    }
  };

  if (loading) {
    return <PatientDirectorySkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Master Patient Index (MPI)</h1>
            <p className="text-xs text-slate-400">Centralized patient directory, demography records, and clinical safety alerts desk</p>
          </div>
        </div>

        <button
          onClick={() => fetchDirectory(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-purple-400" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Directory"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <PatientSummaryCards metrics={metrics} />

      {/* Filter Bar */}
      <PatientFilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        registrationTypeFilter={registrationTypeFilter}
        onRegistrationTypeChange={(t) => {
          setRegistrationTypeFilter(t);
          setCurrentPage(1);
        }}
        bloodGroupFilter={bloodGroupFilter}
        onBloodGroupChange={(bg) => {
          setBloodGroupFilter(bg);
          setCurrentPage(1);
        }}
        priorityFilter={priorityFilter}
        onPriorityChange={(p) => {
          setPriorityFilter(p);
          setCurrentPage(1);
        }}
        userRole={user?.role || "DOCTOR"}
        onOpenRegisterModal={() => setShowNewPatientModal(true)}
      />

      {/* Patients Table */}
      <PatientTable
        patients={patients}
        userRole={user?.role || "DOCTOR"}
        pagination={pagination}
        onPageChange={setCurrentPage}
        onViewProfile={handleViewProfile}
        onEditDemographics={(p) => setEditingPatient(p)}
        onSoftDelete={handleSoftDelete}
      />

      {/* Profile Drawer */}
      {selectedProfileId && profileData && (
        <PatientProfileDrawer
          patient={profileData}
          userRole={user?.role || "DOCTOR"}
          onClose={() => {
            setSelectedProfileId(null);
            setProfileData(null);
          }}
          onOpenAddAllergy={() => setAddAllergyPatientId(profileData.id)}
          onRemoveAllergy={handleRemoveAllergy}
          onOpenAddCondition={() => setAddConditionPatientId(profileData.id)}
          onUpdateConditionStatus={handleUpdateConditionStatus}
        />
      )}

      {/* Modals */}
      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSuccess={() => {
            fetchDirectory();
            if (selectedProfileId === editingPatient.id) {
              handleViewProfile(editingPatient.id);
            }
          }}
        />
      )}

      {addAllergyPatientId && (
        <ManageAllergiesModal
          patientId={addAllergyPatientId}
          patientName={profileData?.name}
          onClose={() => setAddAllergyPatientId(null)}
          onSuccess={() => {
            fetchDirectory();
            if (selectedProfileId) handleViewProfile(selectedProfileId);
          }}
        />
      )}

      {addConditionPatientId && (
        <ManageConditionsModal
          patientId={addConditionPatientId}
          patientName={profileData?.name}
          onClose={() => setAddConditionPatientId(null)}
          onSuccess={() => {
            fetchDirectory();
            if (selectedProfileId) handleViewProfile(selectedProfileId);
          }}
        />
      )}

      {showNewPatientModal && (
        <NewPatientModal
          onClose={() => setShowNewPatientModal(false)}
          onSuccess={() => fetchDirectory()}
        />
      )}
    </div>
  );
};
