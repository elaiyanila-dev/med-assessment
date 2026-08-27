import React from "react";
import { X, ShieldAlert, Activity, FileText, Plus, Trash2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Allergy {
  id: string;
  allergen: string;
  severity?: string;
  reaction?: string;
}

interface Condition {
  id: string;
  condition: string;
  status?: string;
  diagnosed?: string;
}

interface ProfileDetail {
  id: string;
  name: string;
  UHID: string;
  age?: number;
  gender: string;
  mobile: string;
  email?: string;
  bloodGroup?: string;
  address?: string;
  priority: string;
  registrationType: string;
  department?: string;
  allergies: Allergy[];
  conditions: Condition[];
  activeAdmission?: any;
  activeQueueEntry?: any;
  createdAt: string;
}

interface DrawerProps {
  patient: ProfileDetail | null;
  userRole: string;
  onClose: () => void;
  onOpenAddAllergy: () => void;
  onRemoveAllergy: (allergyId: string) => void;
  onOpenAddCondition: () => void;
  onUpdateConditionStatus: (conditionId: string, currentStatus: string) => void;
}

export const PatientProfileDrawer: React.FC<DrawerProps> = ({
  patient,
  userRole,
  onClose,
  onOpenAddAllergy,
  onRemoveAllergy,
  onOpenAddCondition,
  onUpdateConditionStatus
}) => {
  const navigate = useNavigate();
  const canManageSafety = ["DOCTOR", "NURSE", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div>
            <span className="text-[11px] font-mono text-purple-400 font-bold">{patient.UHID}</span>
            <h2 className="text-lg font-bold text-slate-100">{patient.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/patient-history?search=${encodeURIComponent(patient.UHID)}`)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" /> Full History
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Demographics Card */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Demographic Profile</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Gender & Age:</span>
                <div className="font-semibold text-slate-200">{patient.gender} {patient.age ? `(${patient.age} yrs)` : ""}</div>
              </div>
              <div>
                <span className="text-slate-500">Blood Group:</span>
                <div className="font-semibold text-slate-200">{patient.bloodGroup || "Not specified"}</div>
              </div>
              <div>
                <span className="text-slate-500">Mobile Contact:</span>
                <div className="font-mono text-purple-300">{patient.mobile}</div>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <div className="font-mono text-slate-300 truncate">{patient.email || "N/A"}</div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Residential Address:</span>
                <div className="text-slate-300">{patient.address || "No address on record"}</div>
              </div>
            </div>
          </div>

          {/* Active Care Encounters */}
          {(patient.activeAdmission || patient.activeQueueEntry) && (
            <div className="bg-purple-950/20 rounded-xl border border-purple-500/30 p-4 space-y-2">
              <h3 className="text-xs uppercase font-bold text-purple-300 tracking-wider">Active Care Encounter</h3>
              {patient.activeAdmission && (
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span>Admitted in <strong>{patient.activeAdmission.bed?.ward}</strong> (Bed {patient.activeAdmission.bed?.bedNumber})</span>
                </div>
              )}
              {patient.activeQueueEntry && (
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>Active in OPD Queue (Token #{patient.activeQueueEntry.token} - {patient.activeQueueEntry.status})</span>
                </div>
              )}
            </div>
          )}

          {/* Allergies Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> Allergies & Safety Alerts ({patient.allergies.length})
              </h3>
              {canManageSafety && (
                <button
                  onClick={onOpenAddAllergy}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Allergy
                </button>
              )}
            </div>

            {patient.allergies.length === 0 ? (
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs text-slate-500 italic text-center">
                No recorded allergies for this patient
              </div>
            ) : (
              <div className="space-y-2">
                {patient.allergies.map((a) => (
                  <div key={a.id} className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-300 text-xs">{a.allergen}</div>
                      <div className="text-[11px] text-slate-400">Severity: {a.severity || "MODERATE"} {a.reaction && `• Reaction: ${a.reaction}`}</div>
                    </div>
                    {canManageSafety && (
                      <button
                        onClick={() => onRemoveAllergy(a.id)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Remove Allergy Alert"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chronic Conditions Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Medical Conditions & History ({patient.conditions.length})
              </h3>
              {canManageSafety && (
                <button
                  onClick={onOpenAddCondition}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Condition
                </button>
              )}
            </div>

            {patient.conditions.length === 0 ? (
              <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs text-slate-500 italic text-center">
                No recorded chronic medical conditions
              </div>
            ) : (
              <div className="space-y-2">
                {patient.conditions.map((c) => (
                  <div key={c.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-300 text-xs">{c.condition}</div>
                      <div className="text-[11px] text-slate-400">Status: {c.status || "ACTIVE"}</div>
                    </div>
                    {canManageSafety && (
                      <button
                        onClick={() => onUpdateConditionStatus(c.id, c.status || "ACTIVE")}
                        className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        Toggle Status
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
