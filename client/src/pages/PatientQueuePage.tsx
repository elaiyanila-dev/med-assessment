import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, AlertTriangle, RefreshCw, Plus, ArrowUpDown, ChevronDown, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { QueueSummary, QueueSummaryData } from "../components/queue/QueueSummary";
import { PatientQueueList, QueueEntryItem } from "../components/queue/PatientQueueList";
import { QueueSkeleton } from "../components/queue/QueueSkeleton";

interface QueueApiResponse {
  summary?: QueueSummaryData;
  entries: QueueEntryItem[];
}

export type SortOptionKey = "PRIORITY" | "ARRIVAL" | "NAME";

interface SortOption {
  key: SortOptionKey;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { key: "PRIORITY", label: "Priority (High-Low)" },
  { key: "ARRIVAL", label: "Arrival Time" },
  { key: "NAME", label: "Name (A-Z)" }
];

const OPS_QUEUE_ENTRIES: QueueEntryItem[] = [
  {
    id: "ops-q-001",
    patientId: "ops-p-001",
    patientName: "Vikram Singh",
    patientUHID: "ABHA-7890",
    patientAge: 50,
    patientGender: "Male",
    patientMobile: "9876543210",
    token: "Q-101",
    arrivalTime: "2026-09-01T10:05:00+05:30",
    status: "WAITING",
    priority: "EMERGENCY",
    source: "IPD",
    reason: "Chest Pain",
    department: "General Medicine",
    doctorName: "Dr. Sharma"
  },
  {
    id: "ops-q-002",
    patientId: "ops-p-002",
    patientName: "Priya Sharma",
    patientUHID: "ABHA-5678",
    patientAge: 28,
    patientGender: "Female",
    patientMobile: "9876543211",
    token: "Q-102",
    arrivalTime: "2026-09-01T09:30:00+05:30",
    status: "CANCELLED",
    priority: "URGENT",
    source: "IPD",
    reason: "Severe Abdominal Pain",
    department: "Emergency",
    doctorName: "Dr. Sharma"
  },
  {
    id: "ops-q-003",
    patientId: "ops-p-003",
    patientName: "Rahul Verma",
    patientUHID: "ABHA-1234",
    patientAge: 34,
    patientGender: "Male",
    patientMobile: "9876543212",
    token: "Q-103",
    arrivalTime: "2026-09-01T09:15:00+05:30",
    status: "CANCELLED",
    priority: "HIGH",
    source: "IPD",
    reason: "High Fever & Chills",
    department: "General Medicine",
    doctorName: "Dr. Sharma"
  },
  {
    id: "ops-q-004",
    patientId: "ops-p-004",
    patientName: "Amit Patel",
    patientUHID: "ABHA-9012",
    patientAge: 65,
    patientGender: "Male",
    patientMobile: "9876543213",
    token: "Q-104",
    arrivalTime: "2026-09-01T09:45:00+05:30",
    status: "CHECKED_IN",
    priority: "NORMAL",
    source: "CLINIC",
    reason: "Diabetes Follow-up",
    department: "General Medicine",
    doctorName: "Dr. Sharma"
  },
  {
    id: "ops-q-005",
    patientId: "ops-p-005",
    patientName: "Sujata Rao",
    patientUHID: "ABHA-3456",
    patientAge: 62,
    patientGender: "Female",
    patientMobile: "9876543214",
    token: "Q-105",
    arrivalTime: "2026-09-01T10:00:00+05:30",
    status: "CHECKED_IN",
    priority: "NORMAL",
    source: "CLINIC",
    reason: "Joint Pain",
    department: "Orthopedics",
    doctorName: "Dr. Gupta"
  }
];

export const PatientQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [queueData, setQueueData] = useState<QueueApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSort, setSelectedSort] = useState<SortOptionKey>("PRIORITY");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState<boolean>(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const fetchQueueData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/queue");
      if (response.data?.success && response.data?.data) {
        const rawData = response.data.data;
        const entries = Array.isArray(rawData.entries)
          ? rawData.entries
          : Array.isArray(rawData.queue)
          ? rawData.queue
          : [];

        setQueueData({
          summary: rawData.summary,
          entries
        });
      } else {
        throw new Error(response.data?.error?.message || "Failed to load patient queue");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        "Unable to fetch patient queue. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Status Mutation Handler: Start Consultation
  const handleStartConsultation = async (entry: QueueEntryItem) => {
    if (entry.id.startsWith("ops-q-")) {
      navigate(`/doctor-station?patientId=${entry.patientId}&queueId=${entry.id}`);
      return;
    }

    setIsUpdatingId(entry.id);
    try {
      if (entry.status !== "IN_CONSULTATION") {
        await api.patch(`/queue/${entry.id}/status`, {
          status: "IN_CONSULTATION"
        });
      }
      await fetchQueueData();
      navigate(`/doctor-station?patientId=${entry.patientId}&queueId=${entry.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to update queue status";
      alert(msg);
      fetchQueueData();
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Status Mutation Handler: Toggle On Hold
  const handleToggleHold = async (entry: QueueEntryItem) => {
    if (entry.id.startsWith("ops-q-")) {
      return;
    }

    setIsUpdatingId(entry.id);
    const targetStatus = entry.status === "ON_HOLD" ? "WAITING" : "ON_HOLD";
    try {
      await api.patch(`/queue/${entry.id}/status`, {
        status: targetStatus
      });
      await fetchQueueData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to toggle hold status";
      alert(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Navigation Handler: Go to Station
  const handleGoToStation = (entry: QueueEntryItem) => {
    navigate(`/doctor-station?patientId=${entry.patientId}&queueId=${entry.id}`);
  };

  // Add Patient Handler
  const handleAddPatient = () => {
    navigate("/registration");
  };

  if (isLoading && !queueData) {
    return <QueueSkeleton />;
  }

  if (error && !queueData) {
    return (
      <div className="px-6 md:px-9 py-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Patient Queue Loading Failed</h3>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchQueueData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const fetchedEntries = queueData?.entries || [];
  const canUseOpsPreview = ["ADMIN", "SUPER_ADMIN", "RECEPTIONIST"].includes(user?.role || "");
  const allEntries = fetchedEntries.length > 0 || !canUseOpsPreview ? fetchedEntries : OPS_QUEUE_ENTRIES;

  // Calculate dynamic counts from unified single-source patient dataset
  const totalCount = allEntries.length;
  const waitingCount = allEntries.filter(
    (e) => e.status === "WAITING" || e.status === "CHECKED_IN"
  ).length;
  const inConsultationCount = allEntries.filter(
    (e) => e.status === "IN_CONSULTATION" || (e.status as string) === "IN_PROGRESS"
  ).length;

  const queueTabs = [
    { key: "ALL", label: `All Queue (${totalCount})` },
    { key: "WAITING", label: `WAITING (${waitingCount})` },
    { key: "IN_CONSULTATION", label: `IN CONSULTATION (${inConsultationCount})` }
  ];

  // 1. FILTER BY SELECTED TAB
  let tabFilteredEntries = allEntries;
  if (selectedStatus === "WAITING") {
    tabFilteredEntries = allEntries.filter(
      (e) => e.status === "WAITING" || e.status === "CHECKED_IN"
    );
  } else if (selectedStatus === "IN_CONSULTATION") {
    tabFilteredEntries = allEntries.filter(
      (e) => e.status === "IN_CONSULTATION" || (e.status as string) === "IN_PROGRESS"
    );
  }

  // 2. FILTER BY SEARCH TERM
  let searchFilteredEntries = tabFilteredEntries;
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase().trim();
    searchFilteredEntries = tabFilteredEntries.filter(
      (e) =>
        (e.patientName || "").toLowerCase().includes(q) ||
        (e.patientUHID || "").toLowerCase().includes(q) ||
        (e.token ? String(e.token) : "").toLowerCase().includes(q) ||
        (e.priority || "").toLowerCase().includes(q) ||
        (e.reason || "").toLowerCase().includes(q)
    );
  }

  // 3. STABLE SORTING PIPELINE
  const processedEntries = searchFilteredEntries.slice().sort((a, b) => {
    if (selectedSort === "PRIORITY") {
      const priorityScore: Record<string, number> = {
        EMERGENCY: 4,
        URGENT: 3,
        HIGH: 3,
        MEDIUM: 2,
        NORMAL: 2,
        LOW: 1
      };
      const scoreA = priorityScore[a.priority?.toUpperCase()] || 2;
      const scoreB = priorityScore[b.priority?.toUpperCase()] || 2;

      // Primary sort: Priority descending
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // Secondary sort: Arrival time ascending
      const timeA = new Date(a.arrivalTime || 0).getTime();
      const timeB = new Date(b.arrivalTime || 0).getTime();
      return timeA - timeB;
    }

    if (selectedSort === "ARRIVAL") {
      const timeA = new Date(a.arrivalTime || 0).getTime();
      const timeB = new Date(b.arrivalTime || 0).getTime();

      // Primary sort: Arrival time ascending (earliest first)
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // Secondary sort: Name A-Z
      return (a.patientName || "").localeCompare(b.patientName || "");
    }

    if (selectedSort === "NAME") {
      // Primary sort: Name A-Z (case insensitive)
      const nameComp = (a.patientName || "").localeCompare(b.patientName || "");
      if (nameComp !== 0) {
        return nameComp;
      }

      // Secondary sort: Arrival time ascending
      const timeA = new Date(a.arrivalTime || 0).getTime();
      const timeB = new Date(b.arrivalTime || 0).getTime();
      return timeA - timeB;
    }

    return 0;
  });

  // Calculate dynamic summary statistics
  const summaryData: QueueSummaryData = {
    total: totalCount,
    waiting: waitingCount,
    checkedIn: allEntries.filter((e) => e.status === "CHECKED_IN").length,
    inConsultation: inConsultationCount,
    onHold: allEntries.filter((e) => e.status === "ON_HOLD").length,
    completed: allEntries.filter((e) => e.status === "COMPLETED" || e.status === "CANCELLED").length,
    highPriority: allEntries.filter(
      (e) =>
        (e.status === "WAITING" || e.status === "CHECKED_IN") &&
        ["HIGH", "URGENT", "EMERGENCY"].includes(e.priority?.toUpperCase())
    ).length
  };

  const selectedSortOption =
    SORT_OPTIONS.find((opt) => opt.key === selectedSort) || SORT_OPTIONS[0];

  return (
    <div className="min-h-full bg-slate-50 px-5 py-6 md:px-8">
      <div className="mx-auto max-w-[1580px] space-y-6">
      {/* 4 Summary Cards */}
      <QueueSummary summary={summaryData} />

      {/* Patient Queue Main Card */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* Card Header with Controls */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 xl:flex-row xl:items-center xl:justify-between">
          {/* Left Title & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="shrink-0 text-xl font-black tracking-tight text-slate-950">
              Patient Queue
            </h1>

            {/* Tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto rounded-lg border border-slate-200/60 bg-slate-100/80 p-1">
              {queueTabs.map((tab) => {
                const isActive = selectedStatus === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedStatus(tab.key)}
                    className={`whitespace-nowrap rounded-md px-4 py-2 text-xs font-black transition-all ${
                      isActive
                        ? "border border-slate-200 bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Controls: Sort, Search, Add Patient */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort Control Custom Dropdown */}
            <div className="relative font-sans">
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-black text-slate-700 transition-colors hover:bg-slate-100"
                title="Select Sorting Method"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>SORT BY: {selectedSortOption.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    isSortDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Popover Dropdown Menu */}
              {isSortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsSortDropdownOpen(false)}
                  />
                  <div className="absolute right-0 z-30 mt-1.5 w-52 space-y-0.5 rounded-lg border border-slate-200 bg-white py-1.5 shadow-lg">
                    {SORT_OPTIONS.map((option) => {
                      const isSelected = selectedSort === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            setSelectedSort(option.key);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-purple-50 text-purple-700 font-extrabold"
                              : "text-slate-700 font-bold hover:bg-slate-50"
                          }`}
                        >
                          <span>{option.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or UHID..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Add Patient Button */}
            <button
              type="button"
              onClick={handleAddPatient}
              className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-black text-white transition-all hover:bg-sky-700"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>

        {/* Patient Queue Table */}
        <PatientQueueList
          entries={processedEntries}
          onStartConsultation={handleStartConsultation}
          onToggleHold={handleToggleHold}
          onGoToStation={handleGoToStation}
          isUpdatingId={isUpdatingId}
        />
      </div>
      </div>
    </div>
  );
};

export default PatientQueuePage;
