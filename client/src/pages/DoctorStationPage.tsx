import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { RefreshCw, Activity, Stethoscope, FileSpreadsheet, ArrowLeft, ShieldAlert } from "lucide-react";
import { api } from "../services/api";
import { DoctorStationHeader } from "../components/doctor-station/DoctorStationHeader";
import { DoctorStationQueueSidebar, StationQueueItem } from "../components/doctor-station/DoctorStationQueueSidebar";
import { PatientContextCard, SelectedPatientContext } from "../components/doctor-station/PatientContextCard";
import { DoctorStationSkeleton } from "../components/doctor-station/DoctorStationSkeleton";
import { AddPatientModal } from "../components/doctor-station/AddPatientModal";
import { PatientHistoryModal } from "../components/doctor-station/PatientHistoryModal";

// Phase 4B Clinical Workflow Components
import { VitalsForm } from "../components/doctor-station/VitalsForm";
import { ConsultationNotes } from "../components/doctor-station/ConsultationNotes";
import { LabOrderSection } from "../components/doctor-station/LabOrderSection";
import { PrescriptionSection } from "../components/doctor-station/PrescriptionSection";
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

  const [activeTab, setActiveTab] = useState<"vitals" | "diagnosis" | "labs">("vitals");

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

      // 2. Explicit Start / Retrieve Consultation via POST /consultations/start
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

  return (
    <div className="space-y-6">
      {/* Doctor Station Header */}
      <DoctorStationHeader
        onOpenAddPatient={() => setIsAddPatientOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onViewFullHistory={() => {
          if (patientId) {
            navigate(`/patient-history?patientId=${patientId}`);
          } else {
            navigate("/patient-history");
          }
        }}
      />

      {/* Error Alert State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className="px-3.5 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Return to Queue
            </button>
            {patientId && (
              <button
                onClick={() => fetchPatientContext(patientId, queueId)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: OPD Queue Sidebar */}
        <div className="lg:col-span-1">
          <DoctorStationQueueSidebar
            entries={queueEntries}
            selectedQueueId={queueId}
            onSelectPatient={handleSelectPatient}
          />
        </div>

        {/* Right Column: Selected Patient Clinical Area */}
        <div className="lg:col-span-3 space-y-6">
          {isLoadingContext ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Loading patient clinical record...</p>
            </div>
          ) : patientContext ? (
            <>
              {/* Patient Header & Context Card with Active Finish Button */}
              <PatientContextCard
                context={patientContext}
                onFinishClick={() => setIsFinishDialogOpen(true)}
              />

              {/* Consultation Workspace Tabs */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Tabs Bar */}
                <div className="px-6 border-b border-slate-100 bg-slate-50/70 flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("vitals")}
                    className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
                      activeTab === "vitals"
                        ? "border-purple-600 text-purple-700 bg-white rounded-t-xl"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Vitals & Symptoms</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("diagnosis")}
                    className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
                      activeTab === "diagnosis"
                        ? "border-purple-600 text-purple-700 bg-white rounded-t-xl"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Diagnosis & Clinical Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("labs")}
                    className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
                      activeTab === "labs"
                        ? "border-purple-600 text-purple-700 bg-white rounded-t-xl"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Prescription & Labs</span>
                  </button>
                </div>

                {/* Tab Content Components */}
                <div className="p-6">
                  {activeTab === "vitals" && (
                    <VitalsForm
                      consultationId={consultationSession?.id}
                      initialVitals={patientContext.latestVitals}
                      onVitalSaved={handleVitalSaved}
                    />
                  )}

                  {activeTab === "diagnosis" && (
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

                  {activeTab === "labs" && (
                    <div className="space-y-8">
                      <PrescriptionSection
                        consultationId={consultationSession?.id}
                        existingPrescriptions={consultationSession?.prescriptions}
                        onPrescriptionCreated={handlePrescriptionCreated}
                      />

                      <div className="border-t border-slate-100 pt-6">
                        <LabOrderSection
                          consultationId={consultationSession?.id}
                          existingLabOrders={existingLabOrders}
                          onLabOrderCreated={handleLabOrderCreated}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Default Doctor Station State when no patient selected */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto border border-purple-100">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">No Patient Selected</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Select an active patient from your OPD queue on the left sidebar, or start a consultation from the Patient Queue module to view clinical context.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/patient-queue")}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs inline-flex items-center space-x-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go to Patient Queue</span>
              </button>
            </div>
          )}
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
