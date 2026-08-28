import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { RefreshCw, FileText, Pill, FileSpreadsheet, History, ArrowLeft, ShieldAlert, Sparkles, HeartPulse, Activity } from "lucide-react";
import { api } from "../services/api";
import { DoctorStationQueueSidebar, StationQueueItem } from "../components/doctor-station/DoctorStationQueueSidebar";
import { PatientContextCard, SelectedPatientContext } from "../components/doctor-station/PatientContextCard";
import { DoctorStationSkeleton } from "../components/doctor-station/DoctorStationSkeleton";
import { AddPatientModal } from "../components/doctor-station/AddPatientModal";
import { PatientHistoryModal } from "../components/doctor-station/PatientHistoryModal";

// Clinical Workflow Components
import { VitalsForm } from "../components/doctor-station/VitalsForm";
import { ConsultationNotes } from "../components/doctor-station/ConsultationNotes";
import { LabOrderSection } from "../components/doctor-station/LabOrderSection";
import { PrescriptionSection } from "../components/doctor-station/PrescriptionSection";
import { PatientHistoryTimeline } from "../components/doctor-station/PatientHistoryTimeline";
import { FinishConsultationDialog } from "../components/doctor-station/FinishConsultationDialog";

export const DoctorStationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const patientId = searchParams.get("patientId");
  const queueId = searchParams.get("queueId");

  const [queueEntries, setQueueEntries] = useState<StationQueueItem[]>([]);
  const [patientContext, setPatientContext] = useState<SelectedPatientContext | null>(null);

  // Active Consultation State from Backend
  const [consultationSession, setConsultationSession] = useState<any | null>(null);
  const [existingLabOrders, setExistingLabOrders] = useState<any[]>([]);

  const [isLoadingContext, setIsLoadingContext] = useState<boolean>(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddPatientOpen, setIsAddPatientOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"note" | "prescription" | "labs" | "history">("note");

  // Fetch Doctor Station OPD Queue
  const fetchQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const response = await api.get("/doctor-station/queue");
      if (response.data?.success && response.data?.data?.entries) {
        setQueueEntries(response.data.data.entries);
      }
    } catch {
      // Non-blocking queue sidebar error handling
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  // Fetch Selected Patient Clinical Context & Active Consultation
  const fetchPatientContext = useCallback(async (pid: string, qid?: string | null) => {
    setIsLoadingContext(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (qid) params.queueId = qid;

      // 1. Fetch Patient Context
      const response = await api.get(`/doctor-station/patient/${pid}`, { params });
      if (response.data?.success && response.data?.data) {
        setPatientContext(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to load patient clinical context");
      }

      // 2. Start / Retrieve Consultation
      const sessionResponse = await api.post(`/consultations/start`, {
        patientId: pid,
        queueId: qid || undefined
      });

      if (sessionResponse.data?.success && sessionResponse.data?.data) {
        setConsultationSession(sessionResponse.data.data.consultation);
        setExistingLabOrders(sessionResponse.data.data.labOrders || []);

        if (sessionResponse.data.data.latestVital) {
          setPatientContext((prev) =>
            prev ? { ...prev, latestVitals: sessionResponse.data.data.latestVital } : prev
          );
        }
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        "Unauthorized or invalid patient context.";
      setError(msg);
      setPatientContext(null);
      setConsultationSession(null);
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (patientId) {
      fetchPatientContext(patientId, queueId);
    } else {
      setPatientContext(null);
      setConsultationSession(null);
      setError(null);
    }
  }, [patientId, queueId, fetchPatientContext]);

  // Sidebar Patient Selection Handler
  const handleSelectPatient = (newPatientId: string, newQueueId: string) => {
    setSearchParams({ patientId: newPatientId, queueId: newQueueId });
  };

  // Vital Saved Callback
  const handleVitalSaved = (newVital: any) => {
    setPatientContext((prev) => (prev ? { ...prev, latestVitals: newVital } : prev));
  };

  // Notes Saved Callback
  const handleNotesSaved = (updatedConsultation: any) => {
    setConsultationSession((prev: any) => ({
      ...prev,
      ...updatedConsultation
    }));
  };

  // Prescription Created Callback
  const handlePrescriptionCreated = (newPrescription: any) => {
    setConsultationSession((prev: any) => ({
      ...prev,
      prescriptions: [...(prev?.prescriptions || []), newPrescription]
    }));
  };

  // Lab Order Created Callback
  const handleLabOrderCreated = (newLabOrder: any) => {
    setExistingLabOrders((prev) => [newLabOrder, ...prev]);
  };

  // Finish Consultation Success Callback
  const handleFinishedSuccess = () => {
    setIsFinishDialogOpen(false);
    fetchQueue();
    if (patientId) {
      fetchPatientContext(patientId, queueId);
    }
  };

  if (isLoadingQueue && !queueEntries.length && !patientId) {
    return <DoctorStationSkeleton />;
  }

  const latestVitals = patientContext?.latestVitals;

  return (
    <div className="w-full min-h-[calc(100vh-72px)] flex flex-col lg:flex-row items-stretch bg-[#f8fafc] overflow-hidden">
      {/* PANEL 1: LEFT OPD QUEUE PANEL (~350px) */}
      <div className="w-full lg:w-[350px] lg:min-w-[350px] lg:max-w-[350px] shrink-0 bg-white border-r border-slate-200/80 p-4 space-y-3.5 overflow-y-auto">
        <DoctorStationQueueSidebar
          entries={queueEntries}
          selectedQueueId={queueId}
          onSelectPatient={handleSelectPatient}
        />
      </div>

      {/* PANEL 2: CENTER CONSULTATION WORKSPACE (FLEXIBLE / MAIN WIDTH) */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-xl text-red-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Patient Context Error</h3>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate("/patient-queue")}
                className="px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Return to Queue
              </button>
              {patientId && (
                <button
                  onClick={() => fetchPatientContext(patientId, queueId)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>
          </div>
        )}

        {isLoadingContext ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading patient clinical record...</p>
          </div>
        ) : patientContext ? (
          <>
            {/* Selected Patient Compact Banner */}
            <PatientContextCard
              context={patientContext}
              onFinishClick={() => setIsFinishDialogOpen(true)}
              onStartSession={() => {
                if (patientId) fetchPatientContext(patientId, queueId);
              }}
            />

            {/* Consultation Navigation & Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Tabs Bar */}
              <div className="px-5 border-b border-slate-100 bg-slate-50/70 flex items-center space-x-1 pt-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("note")}
                  className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === "note"
                      ? "border-blue-600 text-blue-700 bg-white rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Consultation Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("prescription")}
                  className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === "prescription"
                      ? "border-blue-600 text-blue-700 bg-white rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Pill className="w-4 h-4" />
                  <span>Prescription</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("labs")}
                  className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === "labs"
                      ? "border-blue-600 text-blue-700 bg-white rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Lab Orders</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === "history"
                      ? "border-blue-600 text-blue-700 bg-white rounded-t-xl"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Patient History</span>
                </button>
              </div>

              {/* Active Tab Content */}
              <div className="p-5">
                {activeTab === "note" && (
                  <ConsultationNotes
                    consultationId={consultationSession?.id}
                    initialSubjective={consultationSession?.subjective}
                    initialObjective={consultationSession?.objective}
                    initialAssessment={consultationSession?.assessment}
                    initialPlan={consultationSession?.plan}
                    initialIcd10Code={consultationSession?.icd10Code}
                    onNotesSaved={handleNotesSaved}
                  />
                )}

                {activeTab === "prescription" && (
                  <PrescriptionSection
                    consultationId={consultationSession?.id}
                    existingPrescriptions={consultationSession?.prescriptions}
                    onPrescriptionCreated={handlePrescriptionCreated}
                  />
                )}

                {activeTab === "labs" && (
                  <LabOrderSection
                    consultationId={consultationSession?.id}
                    existingLabOrders={existingLabOrders}
                    onLabOrderCreated={handleLabOrderCreated}
                  />
                )}

                {activeTab === "history" && (
                  <PatientHistoryTimeline
                    patientId={patientId}
                    patientName={patientContext?.patient.name}
                    patientUHID={patientContext?.patient.UHID}
                    timeline={patientContext?.recentTimeline || []}
                    existingLabOrders={existingLabOrders}
                    existingPrescriptions={consultationSession?.prescriptions || []}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          /* Unselected Patient State */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0f172a]">No Patient Selected</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
                Select an active patient from your OPD queue on the left sidebar to start or view consultation notes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/patient-queue")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs inline-flex items-center space-x-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Patient Queue</span>
            </button>
          </div>
        )}
      </div>

      {/* PANEL 3: RIGHT VITALS & MEDNXT AI PANEL (~370px) */}
      <div className="w-full lg:w-[370px] lg:min-w-[370px] lg:max-w-[370px] shrink-0 bg-white border-l border-slate-200/80 p-4 space-y-4 overflow-y-auto">
        {/* VITALS SUMMARY 2x2 Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4.5 space-y-3.5">
          <div className="flex items-center space-x-2 text-slate-400 font-extrabold text-[11px] uppercase tracking-wider">
            <HeartPulse className="w-4 h-4 text-blue-600" />
            <span>VITALS SUMMARY</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* BP Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center space-y-0.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">BP (MMHG)</div>
              <div className="text-lg font-black text-[#0f172a]">
                {latestVitals?.systolicBP ? `${latestVitals.systolicBP}/${latestVitals.diastolicBP}` : "120/80"}
              </div>
            </div>

            {/* SpO2 Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center space-y-0.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">SPO2 (%)</div>
              <div className="text-lg font-black text-[#0f172a]">
                {latestVitals?.spo2 ? `${latestVitals.spo2}` : "98"}
              </div>
            </div>

            {/* Temp Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center space-y-0.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">TEMP (°F)</div>
              <div className="text-lg font-black text-[#0f172a]">
                {latestVitals?.temperature ? `${latestVitals.temperature}` : "98.6"}
              </div>
            </div>

            {/* Weight Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-center space-y-0.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">WEIGHT (KG)</div>
              <div className="text-lg font-black text-[#0f172a]">
                {latestVitals?.weight ? `${latestVitals.weight}` : "65"}
              </div>
            </div>
          </div>

          {/* Quick Vitals Record Trigger if patient selected */}
          {patientContext && (
            <div className="pt-1 border-t border-slate-100">
              <VitalsForm
                consultationId={consultationSession?.id}
                initialVitals={latestVitals}
                onVitalSaved={handleVitalSaved}
              />
            </div>
          )}
        </div>

        {/* MEDNXT AI CARD */}
        <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 text-white p-4.5 rounded-2xl shadow-md space-y-2.5 relative overflow-hidden">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-200" />
            <h4 className="font-extrabold text-base tracking-tight text-white">MedNxt AI</h4>
          </div>

          <p className="text-xs text-purple-100/90 font-medium leading-relaxed">
            Analyze notes for differential diagnosis & drug suggestions.
          </p>

          <button
            type="button"
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-extrabold text-xs rounded-xl border border-white/30 transition-all cursor-pointer shadow-2xs"
          >
            Analyze Case
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
      />

      <PatientHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        patientName={patientContext?.patient.name}
        patientUHID={patientContext?.patient.UHID}
        timeline={patientContext?.recentTimeline || []}
      />

      {consultationSession && (
        <FinishConsultationDialog
          isOpen={isFinishDialogOpen}
          onClose={() => setIsFinishDialogOpen(false)}
          consultationId={consultationSession.id}
          queueId={queueId}
          patientName={patientContext?.patient.name || "Patient"}
          onFinishedSuccess={handleFinishedSuccess}
        />
      )}
    </div>
  );
};

export default DoctorStationPage;
