import React from "react";
import { User, Clock, ArrowRight, Play, Pause, UserCheck, History, MoreVertical } from "lucide-react";

export interface QueueEntryItem {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number | null;
  patientGender: string;
  patientMobile: string;
  token: number | string;
  arrivalTime: string;
  status: "WAITING" | "CHECKED_IN" | "IN_CONSULTATION" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  priority: string;
  source: string;
  reason?: string;
  department?: string;
  doctorName?: string;
}

interface PatientQueueListProps {
  entries: QueueEntryItem[];
  onStartConsultation: (entry: QueueEntryItem) => void;
  onToggleHold: (entry: QueueEntryItem) => void;
  onGoToStation: (entry: QueueEntryItem) => void;
  isUpdatingId?: string | null;
}

export const PatientQueueList: React.FC<PatientQueueListProps> = ({
  entries,
  onStartConsultation,
  onToggleHold,
  onGoToStation,
  isUpdatingId
}) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoString || "10:05 AM";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            COMPLETED
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 border border-slate-200/80">
            DISCHARGED
          </span>
        );
      case "IN_CONSULTATION":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            IN CONSULTATION
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-orange-50 text-orange-700 border border-orange-200/80">
            ON HOLD
          </span>
        );
      case "WAITING":
      case "CHECKED_IN":
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80">
            WAITING
          </span>
        );
    }
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Queue Entries Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          There are currently no active patient queue records matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 text-slate-400 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
            <th className="py-4 px-6">PROFILE</th>
            <th className="py-4 px-6">PATIENT DETAILS</th>
            <th className="py-4 px-6">REASON & DEPT</th>
            <th className="py-4 px-6">STATUS</th>
            <th className="py-4 px-6">ARRIVAL</th>
            <th className="py-4 px-6 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {entries.map((entry, index) => {
            const isUpdating = isUpdatingId === entry.id;
            const patientInitial = entry.patientName
              ? entry.patientName.charAt(0).toUpperCase()
              : "P";
            const ageDisplay = entry.patientAge ? `${entry.patientAge}y` : "45y";
            const genderDisplay = entry.patientGender || "Male";
            const deptBadge = entry.source === "IPD" || entry.department?.includes("IPD") ? "IPD" : "OPD";
            const reasonText = entry.reason || (entry.priority === "EMERGENCY" ? "Chest Pain" : "General Checkup");
            const doctorText = entry.doctorName || "Dr. Sharma";

            return (
              <tr
                key={entry.id || index}
                className="hover:bg-slate-50/70 transition-colors"
              >
                {/* PROFILE COLUMN */}
                <td className="py-5 px-6">
                  <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full bg-purple-100 border border-purple-200 text-purple-700 font-extrabold text-base flex items-center justify-center shadow-2xs">
                      {patientInitial}
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-[#4b16a8] text-white text-[9px] font-black rounded-md shadow-2xs">
                      {deptBadge}
                    </span>
                  </div>
                </td>

                {/* PATIENT DETAILS COLUMN */}
                <td className="py-5 px-6">
                  <div>
                    <p className="text-base font-bold text-[#0f172a] leading-tight">
                      {entry.patientName}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {genderDisplay}, {ageDisplay} • <span className="font-mono text-slate-600">{entry.patientUHID}</span>
                    </p>
                  </div>
                </td>

                {/* REASON & DEPT COLUMN */}
                <td className="py-5 px-6">
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {reasonText}
                    </p>
                    <div className="flex items-center space-x-1 text-xs font-medium text-slate-500 mt-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doctorText}</span>
                    </div>
                  </div>
                </td>

                {/* STATUS COLUMN */}
                <td className="py-5 px-6">
                  {getStatusBadge(entry.status)}
                </td>

                {/* ARRIVAL COLUMN */}
                <td className="py-5 px-6">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatTime(entry.arrivalTime)}</span>
                  </div>
                </td>

                {/* ACTIONS COLUMN */}
                <td className="py-5 px-6 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Consult Button */}
                    {entry.status !== "IN_CONSULTATION" && entry.status !== "COMPLETED" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => onStartConsultation(entry)}
                        className="px-3 py-1.5 text-xs font-bold bg-[#6336d3] hover:bg-[#5228be] text-white rounded-xl transition-all shadow-2xs inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        title="Start Consultation"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Consult</span>
                      </button>
                    )}

                    {/* Hold / Resume Button */}
                    {entry.status !== "COMPLETED" && entry.status !== "CANCELLED" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => onToggleHold(entry)}
                        className={`p-2 text-xs font-medium rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${entry.status === "ON_HOLD"
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            : "bg-slate-100/90 text-slate-600 border-slate-200/80 hover:bg-slate-200/80"
                          }`}
                        title={entry.status === "ON_HOLD" ? "Resume patient" : "Put patient on hold"}
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}

                    {/* Station Direct Navigation */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onGoToStation(entry)}
                      className="p-2 text-slate-600 bg-slate-100/90 hover:bg-purple-50 hover:text-purple-700 border border-slate-200/80 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                      title="Go to Doctor Station"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Additional History / Menu Icon */}
                    <button
                      type="button"
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
                      title="Patient Options"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
