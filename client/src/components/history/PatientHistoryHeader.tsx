import React from "react";
import { User, Phone, ShieldAlert, AlertCircle, Calendar } from "lucide-react";

interface PatientHistoryHeaderProps {
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
    allergies: Array<{ id: string; allergen: string; severity?: string | null }>;
    conditions: Array<{ id: string; condition: string; status?: string | null }>;
  };
  totalEventsCount: number;
}

export const PatientHistoryHeader: React.FC<PatientHistoryHeaderProps> = ({
  patient,
  totalEventsCount
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
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

        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-xl text-xs font-bold flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{totalEventsCount} Total Events Logged</span>
          </div>
        </div>
      </div>

      {/* Allergies and Conditions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Allergies</span>
          </div>
          {(!patient.allergies || patient.allergies.length === 0) ? (
            <span className="text-xs text-slate-400 italic">No known allergies</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((a) => (
                <span
                  key={a.id || a.allergen}
                  className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-medium"
                >
                  {a.allergen} {a.severity ? `(${a.severity})` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Medical Conditions</span>
          </div>
          {(!patient.conditions || patient.conditions.length === 0) ? (
            <span className="text-xs text-slate-400 italic">No active conditions</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {patient.conditions.map((c) => (
                <span
                  key={c.id || c.condition}
                  className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-medium"
                >
                  {c.condition}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
