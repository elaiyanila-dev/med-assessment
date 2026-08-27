import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, RefreshCw, ShieldAlert, Activity, Stethoscope, FileSpreadsheet, Pill } from "lucide-react";
import { api } from "../services/api";
import { PatientSearchInput, PatientSearchResult } from "../components/history/PatientSearchInput";
import { PatientHistoryHeader } from "../components/history/PatientHistoryHeader";
import { HistoryFilterBar, HistoryFilterType } from "../components/history/HistoryFilterBar";
import { HistoryTimeline, TimelineEventItem } from "../components/history/HistoryTimeline";
import { HistoryEventDetailsModal } from "../components/history/HistoryEventDetailsModal";
import { HistorySkeleton } from "../components/history/HistorySkeleton";

export const PatientHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientIdFromUrl);
  const [historyData, setHistoryData] = useState<any | null>(null);

  const [activeFilter, setActiveFilter] = useState<HistoryFilterType>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<TimelineEventItem | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientHistory = useCallback(async (pid: string, filter: HistoryFilterType) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/history/patient/${pid}`, {
        params: { filter }
      });

      if (response.data?.success && response.data?.data) {
        setHistoryData(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to load patient history");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        "Error loading patient history record."
      );
      setHistoryData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patientIdFromUrl && patientIdFromUrl !== selectedPatientId) {
      setSelectedPatientId(patientIdFromUrl);
    }
  }, [patientIdFromUrl, selectedPatientId]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientHistory(selectedPatientId, activeFilter);
    }
  }, [selectedPatientId, activeFilter, fetchPatientHistory]);

  const handleSelectPatient = (p: PatientSearchResult) => {
    setSelectedPatientId(p.id);
    setSearchParams({ patientId: p.id });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header with Patient Search */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Patient History</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Comprehensive Clinical Record & Activity Timeline
            </p>
          </div>
        </div>

        <PatientSearchInput
          onSelectPatient={handleSelectPatient}
          selectedPatientId={selectedPatientId}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Patient History Error</h3>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          {selectedPatientId && (
            <button
              onClick={() => fetchPatientHistory(selectedPatientId, activeFilter)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Main Workspace Layout */}
      {isLoading ? (
        <HistorySkeleton />
      ) : historyData ? (
        <div className="space-y-6">
          {/* Patient Header */}
          <PatientHistoryHeader
            patient={historyData.patient}
            totalEventsCount={historyData.timeline.length}
          />

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <HistoryFilterBar
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
            />

            <span className="text-xs font-semibold text-slate-500">
              Showing {historyData.timeline.length} clinical timeline event(s)
            </span>
          </div>

          {/* Timeline & Structured Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Column */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-base text-slate-800 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Chronological Event Timeline</span>
              </h3>
              <HistoryTimeline
                events={historyData.timeline}
                onSelectEvent={(ev) => setSelectedEvent(ev)}
              />
            </div>

            {/* Clinical Summaries Sidebar Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Consultation Summary */}
              {historyData.consultations?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                  <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
                    <Stethoscope className="w-4 h-4 text-purple-600" />
                    <span>Past Consultations ({historyData.consultations.length})</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {historyData.consultations.map((c: any) => (
                      <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                        <div className="font-bold text-slate-900 flex justify-between">
                          <span>{c.doctorName}</span>
                          <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                            {c.status}
                          </span>
                        </div>
                        {c.icd10Code && (
                          <div className="text-[11px] font-semibold text-purple-700 mt-1">
                            ICD-10: {c.icd10Code}
                          </div>
                        )}
                        {c.assessment && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{c.assessment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vitals History */}
              {historyData.vitals?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                  <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Recorded Vitals ({historyData.vitals.length})</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {historyData.vitals.map((v: any) => (
                      <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
                        <div className="font-bold text-slate-800">
                          BP: {v.systolicBP || "--"}/{v.diastolicBP || "--"} mmHg | SpO2: {v.spo2 || "--"}%
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Temp: {v.temperature || "--"}°F | Weight: {v.weight || "--"} kg
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lab Orders */}
              {historyData.labOrders?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                  <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    <span>Lab Orders ({historyData.labOrders.length})</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {historyData.labOrders.map((l: any) => (
                      <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                        <div className="font-bold text-slate-800 flex justify-between">
                          <span>Order #{l.id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                            {l.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Tests: {l.items?.map((i: any) => i.testName).join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prescriptions */}
              {historyData.prescriptions?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
                  <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
                    <Pill className="w-4 h-4 text-amber-600" />
                    <span>e-Prescriptions ({historyData.prescriptions.length})</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {historyData.prescriptions.map((p: any) => (
                      <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                        <div className="font-bold text-slate-800 flex justify-between">
                          <span>Rx #{p.id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            {p.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Meds: {p.items?.map((i: any) => i.medicineName).join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State when no patient is selected */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-purple-600 mx-auto" />
          <h3 className="text-lg font-extrabold text-slate-900">Select a Patient</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Use the search box above to search for a patient by Name, UHID, or Mobile to view their complete clinical history and timeline.
          </p>
        </div>
      )}

      {/* Event Details Modal */}
      <HistoryEventDetailsModal
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        patientName={historyData?.patient?.name}
        patientUHID={historyData?.patient?.UHID}
      />
    </div>
  );
};

export default PatientHistoryPage;
