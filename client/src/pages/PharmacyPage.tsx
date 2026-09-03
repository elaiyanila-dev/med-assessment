import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Bed,
  Package,
  RotateCcw,
  Search,
  UserRound
} from "lucide-react";
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

  if (user?.role === "DOCTOR") {
    return (
      <DoctorPharmacyPortal
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        prescriptions={filteredPrescriptions}
        selectedPrescription={selectedPrescription}
        onSelectPatient={handleSelectPatient}
        onCloseWorkspace={handleCloseWorkspace}
        onRefresh={fetchPharmacyData}
        loading={loading}
        error={error}
        pharmacyData={pharmacyData}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      <div className="mx-auto w-full max-w-[1368px] space-y-6 px-4 py-6 pb-12 sm:px-6 lg:px-7">
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
    </div>
  );
};

const doctorQueueFallback: PrescriptionQueueItem[] = [
  {
    id: "doctor-opd-1",
    patientId: "PAT-9988",
    patientName: "Sunita Devi",
    patientUHID: "ABHA-9988",
    doctorName: "Dr. Verma",
    status: "WAITING",
    prescribedAt: "2026-08-24T10:15:00.000Z",
    items: [
      {
        id: "rx-1",
        medicineName: "Paracetamol 500mg",
        dosage: "500mg",
        frequency: "BD",
        prescribedQuantity: 2
      },
      {
        id: "rx-2",
        medicineName: "ORS Sachet",
        dosage: "1 sachet",
        frequency: "TDS",
        prescribedQuantity: 1
      }
    ]
  }
];

const DoctorPharmacyPortal: React.FC<{
  activeTab: PharmacyTabType;
  onTabChange: (tab: PharmacyTabType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  prescriptions: PrescriptionQueueItem[];
  selectedPrescription: PrescriptionQueueItem | null;
  onSelectPatient: (prescription: PrescriptionQueueItem) => void;
  onCloseWorkspace: () => void;
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
  pharmacyData: any;
}> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  prescriptions,
  selectedPrescription,
  onSelectPatient,
  onCloseWorkspace,
  onRefresh,
  loading,
  error,
  pharmacyData
}) => {
  const queueItems = prescriptions.length ? prescriptions.slice(0, 1) : doctorQueueFallback;
  const pendingIpdIndents = Array.isArray(pharmacyData?.ipdIndents)
    ? pharmacyData.ipdIndents.filter((indent: any) => (indent.status || "").toUpperCase() !== "FULFILLED")
    : [];
  const pendingReturns = Array.isArray(pharmacyData?.returns)
    ? pharmacyData.returns.filter((item: any) => {
        const status = (item.status || "").toUpperCase();
        return status === "PENDING" || status === "PENDING_VERIFICATION";
      })
    : [];
  const statIpdIndents = pendingIpdIndents.filter((indent: any) => indent.priority === "STAT").length;
  const tabItems: Array<{ id: PharmacyTabType; label: string; badge?: number; badgeTone?: "red" }> = [
    { id: "opd", label: "OPD Queue", badge: queueItems.length },
    { id: "ipd", label: "IPD Indents", badge: pendingIpdIndents.length },
    { id: "inventory", label: "Inventory Master" },
    { id: "returns", label: "Returns & Verification", badge: pendingReturns.length, badgeTone: "red" },
    { id: "analytics", label: "Analytics" }
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-5 py-6 pb-8 lg:px-7">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DoctorMetricCard
            title="Daily OPD Scripts"
            value={String(queueItems.length)}
            note={`Pending: ${queueItems.length}`}
            noteAccent="text-orange-500"
            icon={UserRound}
            iconClass="bg-blue-50 text-blue-600"
          />
          <DoctorMetricCard
            title="Ward Indents (IPD)"
            value={String(pendingIpdIndents.length)}
            note={`STAT Orders: ${statIpdIndents}`}
            noteAccent="text-rose-500"
            icon={Bed}
            iconClass="bg-purple-50 text-purple-600"
          />
          <DoctorMetricCard
            title="Stock Alerts"
            value="3"
            valueClass="text-red-600"
            note="Expiring: 10"
            noteAccent="text-orange-600"
            icon={AlertTriangle}
            iconClass="bg-rose-50 text-red-600"
          />
          <DoctorMetricCard
            title="Pending Returns"
            value={String(pendingReturns.length)}
            note="Action Required"
            icon={RotateCcw}
            iconClass="bg-emerald-50 text-emerald-600"
          />
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/70">
          <div className="border-b border-slate-200 px-7 py-4">
            <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
              {tabItems.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-5 text-sm font-black transition ${
                      isActive
                        ? "bg-white text-sky-700 shadow-md shadow-slate-300/60"
                        : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                    }`}
                  >
                    <span>{tab.label}{tab.badge && tab.badgeTone !== "red" ? ` (${tab.badge})` : ""}</span>
                    {tab.badge && tab.badgeTone === "red" && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {loading && !pharmacyData ? (
            <PharmacySkeleton />
          ) : activeTab === "opd" ? (
            <div className="grid min-h-[596px] grid-cols-1 lg:grid-cols-[426px_minmax(0,1fr)]">
              <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
                <div className="border-b border-slate-200 px-4 py-3">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchQuery}
                      onChange={(event) => onSearchChange(event.target.value)}
                      placeholder="Scan or Search Queue..."
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>
                </div>

                <div className="space-y-3 px-4 py-3">
                  {queueItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectPatient(item)}
                      className={`w-full rounded-xl border bg-white p-4 text-left transition hover:border-slate-300 ${
                        selectedPrescription?.id === item.id ? "border-sky-300 ring-2 ring-sky-100" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-slate-950">
                            {item.patientName}
                          </h3>
                          <p className="mt-2 text-sm font-medium text-slate-500">
                            {item.patientUHID} <span className="text-slate-300">•</span> {item.doctorName}
                          </p>
                        </div>
                        <span className="rounded-md bg-orange-50 px-2.5 py-1 text-[11px] font-black uppercase text-orange-600">
                          Waiting
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
                        <span>8/24/2026</span>
                        <span>{item.items.length} Items</span>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              <main className="bg-white p-6">
                {selectedPrescription ? (
                  <PatientDispenseWorkspace
                    prescriptionId={selectedPrescription.id}
                    userRole="DOCTOR"
                    onClose={onCloseWorkspace}
                    onSuccess={onRefresh}
                  />
                ) : (
                  <div className="flex min-h-[560px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-center">
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                      <Package className="h-16 w-16" />
                    </div>
                    <h2 className="mt-7 text-2xl font-black text-slate-700">Ready for Next Patient</h2>
                    <p className="mt-3 max-w-md text-base font-medium leading-7 text-slate-400">
                      Select a prescription from the queue to start the dispensing workflow.
                    </p>
                  </div>
                )}
              </main>
            </div>
          ) : activeTab === "ipd" ? (
            <div className="p-6">
              <IPDIndentsTab indents={pharmacyData?.ipdIndents} onSuccess={onRefresh} />
            </div>
          ) : activeTab === "inventory" ? (
            <div className="p-6">
              <InventoryMasterTab medicines={pharmacyData?.medicines} onSuccess={onRefresh} />
            </div>
          ) : activeTab === "returns" ? (
            <div className="p-6">
              <ReturnsTab returns={pharmacyData?.returns} onSuccess={onRefresh} />
            </div>
          ) : (
            <div className="p-6">
              <PharmacyAnalyticsTab
                metrics={pharmacyData?.metrics}
                medicines={pharmacyData?.medicines}
                prescriptions={pharmacyData?.prescriptions}
                returns={pharmacyData?.returns}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const DoctorMetricCard: React.FC<{
  title: string;
  value: string;
  note: string;
  icon: React.ElementType;
  iconClass: string;
  valueClass?: string;
  noteAccent?: string;
}> = ({
  title,
  value,
  note,
  icon: Icon,
  iconClass,
  valueClass = "text-slate-950",
  noteAccent = "text-slate-400"
}) => (
  <article className="flex min-h-[116px] items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-md shadow-slate-200/80">
    <div>
      <p className="text-sm font-black uppercase tracking-wide text-slate-400">{title}</p>
      <p className={`mt-1 text-3xl font-black leading-none ${valueClass}`}>{value}</p>
      <p className="mt-3 text-xs font-medium text-slate-400">
        {note.includes(":") ? (
          <>
            {note.split(":")[0]}: <span className={noteAccent}>{note.split(":")[1].trim()}</span>
          </>
        ) : (
          note
        )}
      </p>
    </div>
    <span className={`flex h-13 w-13 items-center justify-center rounded-lg ${iconClass}`}>
      <Icon className="h-6 w-6" />
    </span>
  </article>
);

export default PharmacyPage;
