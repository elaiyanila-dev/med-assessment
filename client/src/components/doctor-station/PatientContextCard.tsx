import React from "react";
import { User, Phone, AlertCircle, ShieldAlert, CheckCircle2, HeartPulse } from "lucide-react";

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
}

export const PatientContextCard: React.FC<PatientContextCardProps> = ({ context, onFinishClick }) => {
  const { patient, queueEntry, latestVitals } = context;

  const isCompleted = queueEntry?.status === "COMPLETED";

  const getPriorityBadge = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === "EMERGENCY" || p === "URGENT") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {priority}
        </span>
      );
    }
    if (p === "HIGH") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {priority}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case "WAITING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Waiting
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Checked In
          </span>
        );
      case "IN_CONSULTATION":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            In Consultation
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            On Hold
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-bold text-lg border border-purple-200 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-extrabold text-slate-900">{patient.name}</h2>
              <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                {patient.UHID}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium flex items-center space-x-3 mt-1">
              <span>{patient.age ? `${patient.age} yrs` : ""} {patient.gender}</span>
              <span>•</span>
              <span className="flex items-center"><Phone className="w-3 h-3 mr-1 text-slate-400" />{patient.mobile}</span>
              {patient.bloodGroup && (
                <>
                  <span>•</span>
                  <span className="font-bold text-rose-600">Blood Group: {patient.bloodGroup}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {queueEntry && (
            <div className="text-right">
              <div className="text-xs text-slate-400 font-semibold uppercase">Token</div>
              <div className="font-mono font-extrabold text-lg text-purple-700">Q-{queueEntry.token}</div>
            </div>
          )}

          <div className="flex flex-col items-end space-y-1">
            {getStatusBadge(queueEntry?.status)}
            {getPriorityBadge(patient.priority || queueEntry?.priority || "ROUTINE")}
          </div>

          {/* Finish Consultation Button */}
          <button
            type="button"
            disabled={isCompleted || !onFinishClick}
            onClick={onFinishClick}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 ${
              isCompleted
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? "Completed" : "Finish Visit"}</span>
          </button>
        </div>
      </div>

      {/* Allergies and Conditions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Allergies */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Allergies</span>
          </div>
          {patient.allergies.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No known allergies recorded</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((a) => (
                <span
                  key={a.id}
                  className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium"
                >
                  {a.allergen} {a.severity ? `(${a.severity})` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Conditions */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Medical Conditions</span>
          </div>
          {patient.conditions.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No active conditions recorded</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {patient.conditions.map((c) => (
                <span
                  key={c.id}
                  className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-medium"
                >
                  {c.condition}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest Vitals Summary Bar */}
      {latestVitals && (
        <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-purple-700 font-bold">
            <HeartPulse className="w-4 h-4 text-purple-600" />
            <span>Latest Recorded Vitals</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-700 font-medium">
            {latestVitals.systolicBP && (
              <span>BP: <strong>{latestVitals.systolicBP}/{latestVitals.diastolicBP}</strong> mmHg</span>
            )}
            {latestVitals.spo2 && <span>SpO2: <strong>{latestVitals.spo2}%</strong></span>}
            {latestVitals.temperature && <span>Temp: <strong>{latestVitals.temperature}°F</strong></span>}
            {latestVitals.weight && <span>Weight: <strong>{latestVitals.weight} kg</strong></span>}
          </div>
        </div>
      )}
    </div>
  );
};
