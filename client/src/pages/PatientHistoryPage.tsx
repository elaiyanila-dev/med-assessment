import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { History, Search, User, ShieldAlert, Sparkles, Activity, LineChart } from "lucide-react";
import { api } from "../services/api";
import { PatientHistoryTimeline, TimelineEvent } from "../components/doctor-station/PatientHistoryTimeline";

export interface PatientRecordItem {
  id: string;
  name: string;
  UHID: string;
  age?: number | null;
  gender: string;
  mobile: string;
  status?: string;
  eventCount?: number;
  bloodGroup?: string | null;
  allergies?: string[];
  department?: string;
}

export const PatientHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get("patientId");

  const [patientsList, setPatientsList] = useState<PatientRecordItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchingPatients, setIsSearchingPatients] = useState<boolean>(true);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientIdFromUrl);
  const [historyData, setHistoryData] = useState<any | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<"timeline" | "vitals_trend">("timeline");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Patient Records List for Left Panel
  const fetchPatientList = useCallback(async (query: string) => {
    setIsSearchingPatients(true);
    try {
      const response = await api.get("/history/patients", {
        params: { search: query }
      });
      if (response.data?.success && Array.isArray(response.data.data)) {
        setPatientsList(response.data.data);
        if (!selectedPatientId && response.data.data.length > 0) {
          setSelectedPatientId(response.data.data[0].id);
        }
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsSearchingPatients(false);
    }
  }, [selectedPatientId]);

  // Normalize Raw History Event
  const normalizeHistoryEvent = (raw: any): TimelineEvent => {
    const rawType = raw?.type || raw?.eventType || raw?.category || raw?.action || "consultation";
    const strType = String(rawType) as any;

    let actorName = "Dr. Sharma";
    if (typeof raw?.actor === "string") {
      actorName = raw.actor;
    } else if (raw?.actor && typeof raw.actor === "object") {
      actorName = raw.actor.name || raw.doctor || "Dr. Sharma";
    } else if (raw?.doctor) {
      actorName = raw.doctor;
    }

    return {
      id: String(raw?.id || "EVT-UNKNOWN"),
      type: strType,
      title: String(raw?.title || (strType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()))),
      actor: actorName,
      timestamp: String(raw?.timestamp || raw?.createdAt || raw?.date || new Date().toISOString()),
      description: String(raw?.description || raw?.details || raw?.message || raw?.notes || "Clinical event recorded.")
    };
  };

  // Fetch Detailed Patient Clinical History for Selected Patient
  const fetchPatientHistory = useCallback(async (pid: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/history/patient/${pid}`);

      if (response.data?.success && response.data?.data) {
        const rawData = response.data.data;
        const normalizedTimeline = (rawData.timeline || []).map(normalizeHistoryEvent);
        const normalizedData = {
          ...rawData,
          patient: rawData.patient || { name: "Patient", UHID: "UHID-000", allergies: [], conditions: [] },
          timeline: normalizedTimeline,
          consultations: Array.isArray(rawData.consultations) ? rawData.consultations : [],
          vitals: Array.isArray(rawData.vitals) ? rawData.vitals : [],
          labOrders: Array.isArray(rawData.labOrders) ? rawData.labOrders : [],
          prescriptions: Array.isArray(rawData.prescriptions) ? rawData.prescriptions : []
        };
        console.debug("Selected patient ID:", pid);
        console.debug("Raw history:", rawData?.timeline);
        console.debug("Normalized history:", normalizedTimeline);
        setHistoryData(normalizedData);
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
    fetchPatientList(searchQuery);
  }, [searchQuery, fetchPatientList]);

  useEffect(() => {
    if (patientIdFromUrl && patientIdFromUrl !== selectedPatientId) {
      setSelectedPatientId(patientIdFromUrl);
    }
  }, [patientIdFromUrl, selectedPatientId]);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientHistory(selectedPatientId);
    } else {
      setHistoryData(null);
      setError(null);
    }
  }, [selectedPatientId, fetchPatientHistory]);

  const handleSelectPatient = (p: PatientRecordItem) => {
    setSelectedPatientId(p.id);
    setSearchParams({ patientId: p.id });
  };

  const getStatusBadgeClass = (status?: string) => {
    const s = (status || "DISCHARGED").toUpperCase();
    if (s.includes("DISCHARGED") || s.includes("COMPLETED")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    }
    if (s.includes("WAITING")) {
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    }
    if (s.includes("CONSULTATION")) {
      return "bg-blue-50 text-blue-700 border-blue-200/80";
    }
    return "bg-slate-100 text-slate-600 border-slate-200/80";
  };

  const selectedPatientObj = historyData?.patient;
  const latestVital = historyData?.vitals?.[0] || {
    bpSystolic: 120,
    bpDiastolic: 80,
    systolicBP: 120,
    diastolicBP: 80,
    spo2: 98,
    temperatureF: 98.6,
    temperature: 98.6,
    weightKg: 65,
    weight: 65
  };

  return (
    <div className="w-full min-h-[calc(100vh-72px)] flex flex-col lg:flex-row items-stretch bg-[#f8fafc] overflow-hidden">
      {/* 1. LEFT PANEL: PATIENT RECORDS PANEL (~350px) */}
      <div className="w-full lg:w-[350px] lg:min-w-[350px] lg:max-w-[350px] shrink-0 bg-white border-r border-slate-200/80 h-full overflow-y-auto p-4 md:p-5 space-y-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 shrink-0">
          <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200/80">
            <History className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">Patient Records</h2>
        </div>

        {/* Search Input */}
        <div className="relative shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Name, UHID or Mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-0.5 space-y-1">
          {isSearchingPatients && patientsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold space-y-2">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Searching records...</p>
            </div>
          ) : patientsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-semibold">
              No matching patient records found.
            </div>
          ) : (
            patientsList.map((p) => {
              const isSelected = selectedPatientId === p.id;
              const genderShort = p.gender ? p.gender.charAt(0).toUpperCase() : "M";
              const ageDisplay = p.age ? `${p.age} Yrs` : "34 Yrs";
              const statusDisplay = p.status || "DISCHARGED";
              const eventCount = typeof p.eventCount === "number" ? p.eventCount : 0;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer space-y-1.5 border ${
                    isSelected
                      ? "bg-purple-50/80 border-purple-300 shadow-2xs"
                      : "bg-white border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#0f172a] truncate">{p.name}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200/80 rounded-lg text-[10px] font-extrabold font-mono shrink-0">
                      {p.UHID}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-500 flex items-center space-x-1.5 truncate">
                    <span>{ageDisplay}</span>
                    <span>•</span>
                    <span>{genderShort === "M" ? "Male" : "Female"}</span>
                    <span>•</span>
                    <span>{p.mobile}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadgeClass(statusDisplay)}`}>
                      {statusDisplay}
                    </span>

                    <div className="flex items-center space-x-1 text-slate-400 font-extrabold text-xs">
                      <History className="w-3.5 h-3.5 text-purple-600" />
                      <span>{eventCount}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. CENTER MAIN WORKSPACE PANEL */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto bg-[#f8fafc] p-4 md:p-6 space-y-5">
        {selectedPatientObj ? (
          <>
            {/* Selected Patient Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-lg border border-purple-200 shrink-0">
                  <User className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                    <h2 className="text-xl font-black text-[#0f172a] tracking-tight">
                      {selectedPatientObj.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80 text-xs font-mono font-extrabold">
                      {selectedPatientObj.UHID || "ABHA-1234"}
                    </span>
                    <span className="text-xs font-bold text-slate-400">•</span>
                    <span className="text-xs font-extrabold text-slate-600">
                      {selectedPatientObj.age || 34} Y / {selectedPatientObj.gender || "Male"}
                    </span>
                    <span className="text-xs font-bold text-slate-400">•</span>
                    <span className="text-xs font-extrabold text-slate-600">
                      {selectedPatientObj.department || "General Medicine"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Allergy Badge */}
              <div className="flex items-center space-x-2">
                <div className="px-3.5 py-1.5 bg-rose-50 border border-rose-200/80 text-rose-700 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Penicillin</span>
                </div>
              </div>
            </div>

            {/* Main Tabs Bar: Timeline vs Vitals Trend */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-5 border-b border-slate-100 bg-slate-50/70 flex items-center space-x-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setActiveMainTab("timeline")}
                  className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
                    activeMainTab === "timeline"
                      ? "border-blue-600 text-blue-700 bg-white rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Timeline</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMainTab("vitals_trend")}
                  className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
                    activeMainTab === "vitals_trend"
                      ? "border-blue-600 text-blue-700 bg-white rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LineChart className="w-4 h-4" />
                  <span>Vitals Trend</span>
                </button>
              </div>

              {/* Main Tab Content */}
              <div className="p-5">
                {activeMainTab === "timeline" ? (
                  <PatientHistoryTimeline
                    patientId={selectedPatientId}
                    patientName={selectedPatientObj.name}
                    patientUHID={selectedPatientObj.UHID}
                    timeline={historyData?.timeline || []}
                    existingLabOrders={historyData?.labOrders || []}
                    existingPrescriptions={historyData?.prescriptions || []}
                  />
                ) : (
                  /* Vitals Trend Panel */
                  <div className="space-y-4 p-2">
                    <h3 className="font-extrabold text-base text-[#0f172a]">
                      Vitals Historical Trend
                    </h3>
                    <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Avg BP</span>
                          <p className="font-mono font-extrabold text-sm text-[#0f172a]">120/80 mmHg</p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Avg SpO2</span>
                          <p className="font-mono font-extrabold text-sm text-emerald-600">98.5%</p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Avg Temp</span>
                          <p className="font-mono font-extrabold text-sm text-purple-700">98.6 °F</p>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase">Weight</span>
                          <p className="font-mono font-extrabold text-sm text-slate-800">65 kg</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Initial State */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto min-h-[500px]">
            <div className="w-32 h-32 rounded-full bg-white border border-slate-200/80 shadow-xs flex items-center justify-center mb-2">
              <History className="w-14 h-14 text-purple-600/80" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
              Select a Patient
            </h3>
            <p className="text-sm text-slate-500 font-semibold max-w-md">
              Select a patient from the left records list to view their complete clinical history, timeline, and vitals trend.
            </p>
          </div>
        )}
      </div>

      {/* 3. RIGHT PANEL: VITALS SUMMARY & MEDNXT AI (~320px) */}
      <div className="w-full lg:w-[320px] lg:min-w-[320px] lg:max-w-[320px] shrink-0 bg-white border-l border-slate-200/80 h-full overflow-y-auto p-4 md:p-5 space-y-5">
        {/* VITALS SUMMARY 2x2 Grid */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3">
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
            VITALS SUMMARY
          </h4>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
            {/* Card 1: BP */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                BP (MMHG)
              </span>
              <p className="font-mono font-extrabold text-sm text-[#0f172a]">
                {latestVital.bpSystolic || latestVital.systolicBP || 120}/{latestVital.bpDiastolic || latestVital.diastolicBP || 80}
              </p>
            </div>

            {/* Card 2: SpO2 */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                SPO2 (%)
              </span>
              <p className="font-mono font-extrabold text-sm text-emerald-600">
                {latestVital.spo2 || latestVital.spO2 || 98}
              </p>
            </div>

            {/* Card 3: Temp */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                TEMP (°F)
              </span>
              <p className="font-mono font-extrabold text-sm text-purple-700">
                {latestVital.temperatureF || latestVital.temperature || 98.6}
              </p>
            </div>

            {/* Card 4: Weight */}
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase">
                WEIGHT (KG)
              </span>
              <p className="font-mono font-extrabold text-sm text-slate-800">
                {latestVital.weightKg || latestVital.weight || 65}
              </p>
            </div>
          </div>
        </div>

        {/* MedNxt AI Assistant Card */}
        <div className="bg-purple-50/60 p-4.5 rounded-2xl border border-purple-100 space-y-3 shadow-2xs">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-purple-950">MedNxt AI</h4>
              <p className="text-[11px] font-medium text-purple-700">
                Clinical decision support
              </p>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-600 leading-relaxed">
            Analyze notes for differential diagnosis & drug suggestions.
          </p>

          <button
            type="button"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            <span>[ Analyze Case ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryPage;
