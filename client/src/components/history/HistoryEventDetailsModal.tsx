import React from "react";
import { X, Calendar, FileText } from "lucide-react";
import { TimelineEventItem } from "./HistoryTimeline";

interface HistoryEventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEventItem | null;
  patientName?: string;
  patientUHID?: string;
}

export const HistoryEventDetailsModal: React.FC<HistoryEventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  patientName,
  patientUHID
}) => {
  if (!isOpen || !event) return null;

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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">
                {(event.eventType || event.type || "Clinical Event").replace(/_/g, " ")} Details
              </h3>
              <p className="text-xs text-slate-500 font-mono font-medium">
                {patientName} ({patientUHID})
              </p>
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

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-100 space-y-1">
            <div className="flex items-center space-x-1.5 text-purple-900 font-bold">
              <Calendar className="w-3.5 h-3.5 text-purple-700" />
              <span>Timestamp: {formatDate(event.timestamp)}</span>
            </div>
            <p className="text-slate-700 font-medium text-xs mt-1">{event.description}</p>
          </div>

          {event.metadata && typeof event.metadata === "object" && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Event Summary Attributes
              </h4>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {Object.entries(event.metadata).map(([key, val]) => (
                  <div key={key} className="p-2 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{key}</span>
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-500 italic">
            Event ID: {event.id}
          </div>
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
