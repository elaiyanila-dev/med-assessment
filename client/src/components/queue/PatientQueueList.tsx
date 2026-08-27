import React from "react";
import { User, Clock, ArrowRight, Play, Pause, AlertTriangle, Building2, Smartphone } from "lucide-react";

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
      return isoString;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === "EMERGENCY" || p === "URGENT") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {priority}
        </span>
      );
    }
    if (p === "HIGH") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
          {priority}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Waiting
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Checked In
          </span>
        );
      case "IN_CONSULTATION":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            In Consultation
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            On Hold
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center space-y-3">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Queue Entries Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          There are currently no active patient queue records matching your filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="py-3.5 px-6">Token</th>
              <th className="py-3.5 px-6">Patient Info</th>
              <th className="py-3.5 px-6">Source</th>
              <th className="py-3.5 px-6">Priority</th>
              <th className="py-3.5 px-6">Arrival Time</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {entries.map((entry) => {
              const isUpdating = isUpdatingId === entry.id;

              return (
                <tr
                  key={entry.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    entry.status === "IN_CONSULTATION" ? "bg-emerald-50/30" : ""
                  }`}
                >
                  {/* Token */}
                  <td className="py-4 px-6 font-bold text-purple-700">
                    <span className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs font-mono">
                      Q-{entry.token}
                    </span>
                  </td>

                  {/* Patient Info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center font-semibold text-sm border border-purple-100 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{entry.patientName}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-2">
                          <span className="font-mono text-purple-600">{entry.patientUHID}</span>
                          <span>•</span>
                          <span>
                            {entry.patientAge ? `${entry.patientAge}y` : ""} {entry.patientGender}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Source */}
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600">
                      {entry.source === "REMOTE" ? (
                        <>
                          <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                          <span>Remote</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Clinic</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-6">{getPriorityBadge(entry.priority)}</td>

                  {/* Arrival Time */}
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    <div className="flex items-center space-x-1 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatTime(entry.arrivalTime)}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6">{getStatusBadge(entry.status)}</td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right space-x-2">
                    {/* Primary Action: Start Consultation / Call */}
                    {entry.status !== "IN_CONSULTATION" && entry.status !== "COMPLETED" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => onStartConsultation(entry)}
                        className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg transition-all shadow-xs inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Consult</span>
                      </button>
                    )}

                    {/* Hold / Resume Action */}
                    {entry.status !== "COMPLETED" && entry.status !== "CANCELLED" && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => onToggleHold(entry)}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                          entry.status === "ON_HOLD"
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={entry.status === "ON_HOLD" ? "Resume patient" : "Put patient on hold"}
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Go to Station Direct Navigation */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onGoToStation(entry)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <span>Station</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
