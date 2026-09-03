import React from "react";
import { User, Clock, PlayCircle, Pause, UserCheck, History, MoreVertical, Thermometer } from "lucide-react";

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
      case "CANCELLED":
        return (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            DISCHARGED
          </span>
        );
      case "IN_CONSULTATION":
        return (
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
            VITALS DONE
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
            ON HOLD
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
            CHECKED IN
          </span>
        );
      case "WAITING":
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">
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
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-sm font-black uppercase tracking-wide text-slate-500">
            <th className="px-6 py-4">Profile</th>
            <th className="px-6 py-4">Patient Details</th>
            <th className="px-6 py-4">Reason & Dept</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Arrival</th>
            <th className="px-6 py-4 text-right">Actions</th>
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
                className="transition-colors hover:bg-slate-50/70"
              >
                {/* PROFILE COLUMN */}
                <td className="px-6 py-5">
                  <div className="relative w-12 h-12">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-base font-black text-slate-700 shadow-sm">
                      {patientInitial}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 rounded-lg px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm ${deptBadge === "IPD" ? "bg-orange-500" : "bg-sky-500"}`}>
                      {deptBadge}
                    </span>
                  </div>
                </td>

                {/* PATIENT DETAILS COLUMN */}
                <td className="px-6 py-5">
                  <div>
                    <p className="flex items-center gap-2 text-base font-black leading-tight text-slate-950">
                      {entry.patientName}
                      {entry.priority === "EMERGENCY" && <span className="text-base text-red-500">!</span>}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {genderDisplay}, {ageDisplay} <span className="text-slate-300">•</span> <span>{entry.patientUHID}</span>
                    </p>
                  </div>
                </td>

                {/* REASON & DEPT COLUMN */}
                <td className="px-6 py-5">
                  <div>
                    <p className="text-base font-black leading-tight text-slate-900">
                      {reasonText}
                    </p>
                    <div className="mt-1 flex items-center space-x-1 text-sm font-medium text-slate-500">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{doctorText}</span>
                    </div>
                  </div>
                </td>

                {/* STATUS COLUMN */}
                <td className="px-6 py-5">
                  {getStatusBadge(entry.status)}
                </td>

                {/* ARRIVAL COLUMN */}
                <td className="px-6 py-5">
                  <div className="flex items-center space-x-2 text-sm font-medium text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{formatTime(entry.arrivalTime)}</span>
                  </div>
                </td>

                {/* ACTIONS COLUMN */}
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {/* Consult Button */}
                    {entry.status !== "IN_CONSULTATION" && entry.status !== "COMPLETED" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => onStartConsultation(entry)}
                        className="text-slate-500 transition hover:text-sky-700 disabled:opacity-50"
                        title="Start Consultation"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </button>
                    )}

                    {/* Hold / Resume Button */}
                    {entry.status !== "COMPLETED" && entry.status !== "CANCELLED" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => onToggleHold(entry)}
                        className={`transition disabled:opacity-50 ${entry.status === "ON_HOLD"
                            ? "text-amber-700 hover:text-amber-800"
                            : "text-slate-400 hover:text-slate-700"
                          }`}
                        title={entry.status === "ON_HOLD" ? "Resume patient" : "Put patient on hold"}
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    )}

                    {/* Station Direct Navigation */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onGoToStation(entry)}
                      className="text-slate-400 transition hover:text-blue-700 disabled:opacity-50"
                      title="Go to Doctor Station"
                    >
                      <History className="h-4 w-4" />
                    </button>

                    {/* Additional History / Menu Icon */}
                    {entry.status === "CHECKED_IN" && (
                      <button
                        type="button"
                        className="text-slate-500 transition hover:text-orange-600"
                        title="Record Vitals"
                      >
                        <Thermometer className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-slate-400 transition hover:text-slate-600"
                      title="Patient Options"
                    >
                      <MoreVertical className="h-4 w-4" />
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
