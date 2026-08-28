import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, AlertTriangle, RefreshCw, Plus, ArrowUpDown, ChevronDown, Check } from "lucide-react";
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

export const PatientQueuePage: React.FC = () => {
  const navigate = useNavigate();

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
    navigate("/patients/new");
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

  const allEntries = queueData?.entries || [];

  // Calculate dynamic counts from unified single-source patient dataset
  const totalCount = allEntries.length;
  const waitingCount = allEntries.filter(
    (e) => e.status === "WAITING" || e.status === "CHECKED_IN"
  ).length;
  const inConsultationCount = allEntries.filter(
    (e) => (e.status as string) === "IN_CONSULTATION" || (e.status as string) === "IN_PROGRESS"
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
      (e) => (e.status as string) === "IN_CONSULTATION" || (e.status as string) === "IN_PROGRESS"
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
    completed: allEntries.filter((e) => e.status === "COMPLETED").length,
    highPriority: allEntries.filter(
      (e) =>
        (e.status === "WAITING" || e.status === "CHECKED_IN") &&
        ["HIGH", "URGENT", "EMERGENCY"].includes(e.priority?.toUpperCase())
    ).length
  };

  const selectedSortOption =
    SORT_OPTIONS.find((opt) => opt.key === selectedSort) || SORT_OPTIONS[0];

  return (
    <div className="px-6 md:px-9 py-8 max-w-7xl mx-auto space-y-8">
      {/* 4 Summary Cards */}
      <QueueSummary summary={summaryData} />

      {/* Patient Queue Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Card Header with Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Left Title & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight shrink-0">
              Patient Queue
            </h1>

            {/* Tabs */}
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto">
              {queueTabs.map((tab) => {
                const isActive = selectedStatus === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedStatus(tab.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-white text-[#0f172a] border border-slate-200 shadow-2xs"
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
                className="px-3.5 py-2 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-2 transition-colors cursor-pointer shadow-2xs"
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
                  <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl border border-slate-200 shadow-lg py-1.5 z-30 space-y-0.5">
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
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or UHID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>

            {/* Add Patient Button */}
            <button
              onClick={handleAddPatient}
              className="px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer shrink-0"
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
  );
};

export default PatientQueuePage;
