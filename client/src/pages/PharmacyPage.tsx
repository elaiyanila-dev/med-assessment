import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { PharmacySkeleton } from "../components/pharmacy/PharmacySkeleton";
import { PharmacySummaryCards } from "../components/pharmacy/PharmacySummaryCards";
import { PharmacyTabBar, PharmacyTabType } from "../components/pharmacy/PharmacyTabBar";
import { OpdQueuePanel, PrescriptionQueueItem } from "../components/pharmacy/OpdQueuePanel";
import { PharmacyEmptyState } from "../components/pharmacy/PharmacyEmptyState";
import { PatientDispenseWorkspace } from "../components/pharmacy/PatientDispenseWorkspace";
import { IPDIndentsTab } from "../components/pharmacy/IPDIndentsTab";
import { InventoryMasterTab } from "../components/pharmacy/InventoryMasterTab";
import { ReturnsTab } from "../components/pharmacy/ReturnsTab";
import { PharmacyAnalyticsTab } from "../components/pharmacy/PharmacyAnalyticsTab";

export const PharmacyPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<PharmacyTabType>("opd");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pharmacyData, setPharmacyData] = useState<any>(null);

  // Selected queue patient for the right-side dispensing workspace
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionQueueItem | null>(null);

  // URL search parameter
  const searchQuery = searchParams.get("search") || "";

  const fetchPharmacyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/pharmacy");

      if (res.data?.success && res.data?.data) {
        setPharmacyData(res.data.data);
      } else {
        throw new Error("Failed to load pharmacy data");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Error connecting to Pharmacy service");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleSelectPatient = (p: PrescriptionQueueItem) => {
    setSelectedPrescription(p);
  };

  const handleCloseWorkspace = () => {
    setSelectedPrescription(null);
  };

  // Filter raw prescriptions by search query
  const allPrescriptions: PrescriptionQueueItem[] = Array.isArray(pharmacyData?.prescriptions)
    ? pharmacyData.prescriptions
    : Array.isArray(pharmacyData?.pharmacyOrders)
    ? pharmacyData.pharmacyOrders
    : [];

  const filteredPrescriptions = allPrescriptions.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (p.patientName || "").toLowerCase().includes(q);
    const uhidMatch = (p.patientUHID || "").toLowerCase().includes(q);
    const idMatch = (p.id || "").toLowerCase().includes(q);
    const docMatch = (p.doctorName || "").toLowerCase().includes(q);
    const medMatch = (p.items || []).some((i) => (i.medicineName || "").toLowerCase().includes(q));
    return nameMatch || uhidMatch || idMatch || docMatch || medMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 md:px-6 py-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !pharmacyData ? (
        <PharmacySkeleton />
      ) : (
        <div className="space-y-6">
          {/* 1. TOP FOUR KPI CARDS (DAILY OPD SCRIPTS, WARD INDENTS, STOCK ALERTS, PENDING RETURNS) */}
          <PharmacySummaryCards metrics={pharmacyData?.metrics} />

          {/* 2. PHARMACY TAB BAR (OPD Queue, IPD Indents, Inventory Master, Returns & Verification, Analytics) */}
          <PharmacyTabBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            opdCount={allPrescriptions.length}
            ipdCount={(pharmacyData?.ipdIndents || []).length}
            returnsCount={(pharmacyData?.returns || []).length}
          />

          {/* 3. MAIN WORKSPACE VIEW PER SELECTED TAB */}
          {activeTab === "opd" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT PANEL: OPD QUEUE LIST & SEARCH */}
              <div className="lg:col-span-5 xl:col-span-4">
                <OpdQueuePanel
                  prescriptions={filteredPrescriptions}
                  selectedId={selectedPrescription?.id || null}
                  onSelectPatient={handleSelectPatient}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                />
              </div>

              {/* RIGHT PANEL: WORKSPACE (EMPTY STATE OR ACTIVE DISPENSING) */}
              <div className="lg:col-span-7 xl:col-span-8">
                {selectedPrescription ? (
                  <PatientDispenseWorkspace
                    prescriptionId={selectedPrescription.id}
                    userRole={user?.role || "DOCTOR"}
                    onClose={handleCloseWorkspace}
                    onSuccess={() => {
                      fetchPharmacyData();
                    }}
                  />
                ) : (
                  <PharmacyEmptyState />
                )}
              </div>
            </div>
          )}

          {/* IPD INDENTS TAB */}
          {activeTab === "ipd" && (
            <IPDIndentsTab
              indents={pharmacyData?.ipdIndents}
              onSuccess={fetchPharmacyData}
            />
          )}

          {/* INVENTORY MASTER TAB */}
          {activeTab === "inventory" && (
            <InventoryMasterTab
              medicines={pharmacyData?.medicines}
              onSuccess={fetchPharmacyData}
            />
          )}

          {/* RETURNS & VERIFICATION TAB */}
          {activeTab === "returns" && (
            <ReturnsTab
              returns={pharmacyData?.returns}
              onSuccess={fetchPharmacyData}
            />
          )}

          {/* ANALYTICS TAB */}
          {activeTab === "analytics" && (
            <PharmacyAnalyticsTab
              metrics={pharmacyData?.metrics}
              medicines={pharmacyData?.medicines}
              prescriptions={pharmacyData?.prescriptions}
              returns={pharmacyData?.returns}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PharmacyPage;
