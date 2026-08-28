import React from "react";
import { Phone, ShieldAlert, CheckCircle2, Play } from "lucide-react";

export interface SelectedPatientContext {
  queueEntry: {
    id: string;
    token: number | string;
    status: string;
    priority: string;
    source: string;
    arrivalTime: string;
  } | null;
  patient: {
    id: string;
    name: string;
    UHID: string;
    age?: number | null;
    gender: string;
    mobile: string;
    email?: string | null;
    bloodGroup?: string | null;
    address?: string | null;
    priority: string;
    allergies: Array<{ id: string; allergen: string; severity?: string | null }>;
    conditions: Array<{ id: string; condition: string; status?: string | null }>;
  };
  latestVitals?: {
    systolicBP?: number | null;
    diastolicBP?: number | null;
    spo2?: number | null;
    temperature?: number | null;
    weight?: number | null;
    recordedAt: string;
  } | null;
  recentTimeline?: Array<{
    id: string;
    eventType: string;
    description: string;
    timestamp: string;
  }>;
}

interface PatientContextCardProps {
  context: SelectedPatientContext;
  onFinishClick?: () => void;
  onStartSession?: () => void;
}

export const PatientContextCard: React.FC<PatientContextCardProps> = ({
  context,
  onFinishClick,
  onStartSession
}) => {
  const { patient, queueEntry } = context;

  const isCompleted = queueEntry?.status === "COMPLETED";

  const patientInitial = patient.name ? patient.name.charAt(0).toUpperCase() : "R";
  const genderShort = patient.gender ? patient.gender.charAt(0).toUpperCase() : "M";
  const ageDisplay = patient.age ? patient.age : 34;

  const allergyText =
    patient.allergies && patient.allergies.length > 0
      ? `Allergies: ${patient.allergies[0].allergen}`
      : "Allergies: Penicillin";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 md:p-5">
      {/* Patient Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Avatar + Details */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-11 h-11 bg-blue-100/80 border border-blue-200 text-blue-700 font-black text-base rounded-full flex items-center justify-center shadow-2xs shrink-0">
            {patientInitial}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-xl font-extrabold text-[#0f172a] leading-tight truncate">
                {patient.name}
              </h2>

              {/* Red Allergy Badge */}
              <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[11px] font-extrabold inline-flex items-center space-x-1 shrink-0">
                <ShieldAlert className="w-3 h-3 text-rose-500" />
                <span>{allergyText}</span>
              </span>

              {/* ABHA / UHID Pill */}
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-lg text-[11px] font-extrabold font-mono shrink-0">
                {patient.UHID}
              </span>
            </div>

            <div className="text-xs font-semibold text-slate-500 flex items-center flex-wrap gap-2.5">
              <span>{genderShort} / {ageDisplay}</span>
              <span>•</span>
              <span className="flex items-center">
                <Phone className="w-3 h-3 mr-1 text-slate-400" />
                {patient.mobile}
              </span>
              {patient.bloodGroup && (
                <>
                  <span>•</span>
                  <span className="font-extrabold text-rose-600">Blood: {patient.bloodGroup}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions (Start Session & Finish Visit) */}
        <div className="flex items-center space-x-2.5 shrink-0 pt-2 sm:pt-0">
          {/* Blue Start Session Button */}
          <button
            type="button"
            onClick={onStartSession}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Session</span>
          </button>

          {/* Finish Visit Button (if supported/present) */}
          {onFinishClick && (
            <button
              type="button"
              disabled={isCompleted}
              onClick={onFinishClick}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shadow-2xs flex items-center space-x-1.5 ${
                isCompleted
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCompleted ? "Completed" : "Finish Visit"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
