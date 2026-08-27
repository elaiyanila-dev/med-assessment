import React from "react";
import { X, Clock, Calendar } from "lucide-react";

interface TimelineItem {
  id: string;
  eventType: string;
  description: string;
  timestamp: string;
}

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientUHID?: string;
  timeline: TimelineItem[];
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientUHID,
  timeline
}) => {
  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                {patientName ? `${patientName}'s Timeline` : "Patient Clinical History"}
              </h3>
              <p className="text-xs text-slate-500 font-mono font-medium">{patientUHID}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Events Content */}
        <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
          {timeline.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <Calendar className="w-6 h-6 mx-auto text-slate-300" />
              <p>No historical events logged for this patient.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-purple-100 ml-3 space-y-6">
              {timeline.map((event) => (
                <div key={event.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-purple-600 flex items-center justify-center" />
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {event.eventType}
                  </div>
                  <div className="text-sm font-medium text-slate-600 mt-0.5">
                    {event.description}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {formatDate(event.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
