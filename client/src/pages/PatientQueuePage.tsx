import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "../services/api";
import { QueueSummary, QueueSummaryData } from "../components/queue/QueueSummary";
import { PatientQueueList, QueueEntryItem } from "../components/queue/PatientQueueList";
import { QueueSkeleton } from "../components/queue/QueueSkeleton";

interface QueueApiResponse {
  summary: QueueSummaryData;
  entries: QueueEntryItem[];
}

export const PatientQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [queueData, setQueueData] = useState<QueueApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const fetchQueueData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (selectedStatus !== "ALL") {
        params.status = selectedStatus;
      }

      const response = await api.get("/queue", { params });
      if (response.data?.success && response.data?.data) {
        setQueueData(response.data.data);
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
  }, [searchTerm, selectedStatus]);

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

  if (isLoading && !queueData) {
    return <QueueSkeleton />;
  }

  if (error && !queueData) {
    return (
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
    );
  }

  const statusTabs = [
    { key: "ALL", label: "All Active" },
    { key: "WAITING", label: "Waiting" },
    { key: "CHECKED_IN", label: "Checked In" },
    { key: "IN_CONSULTATION", label: "In Consultation" },
    { key: "ON_HOLD", label: "On Hold" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient Queue</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Live Doctor OPD Queue & Patient Workflow
            </p>
          </div>
        </div>
      </div>

      {/* Queue Summary Cards */}
      {queueData?.summary && <QueueSummary summary={queueData.summary} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, UHID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Queue List Table */}
      {queueData && (
        <PatientQueueList
          entries={queueData.entries}
          onStartConsultation={handleStartConsultation}
          onToggleHold={handleToggleHold}
          onGoToStation={handleGoToStation}
          isUpdatingId={isUpdatingId}
        />
      )}
    </div>
  );
};

export default PatientQueuePage;
