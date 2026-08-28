import React from "react";
import { Activity, Stethoscope, FileSpreadsheet, Pill, Clock, CheckCircle2, ChevronRight, UserPlus, Bed, FileText } from "lucide-react";

export interface TimelineEventItem {
  id: string;
  type?: string;
  eventType?: string;
  description: string;
  timestamp: string;
  actor?: string | { name: string; role?: string };
  metadata?: any;
}

interface HistoryTimelineProps {
  events: TimelineEventItem[];
  onSelectEvent: (event: TimelineEventItem) => void;
}

export function formatEventType(typeStr?: string): string {
  if (!typeStr) return "Clinical Event";
  return String(typeStr)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ events = [], onSelectEvent }) => {
  const safeEvents = Array.isArray(events) ? events : [];

  const getEventIcon = (typeInput?: string) => {
    const safeType = (typeInput || "").toString().toUpperCase();
    if (safeType.includes("CONSULTATION")) return <Stethoscope className="w-4 h-4 text-purple-600" />;
    if (safeType.includes("VITAL")) return <Activity className="w-4 h-4 text-emerald-600" />;
    if (safeType.includes("LAB_ORDER") || safeType.includes("LAB ORDER")) return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
    if (safeType.includes("LAB_REPORT") || safeType.includes("LAB REPORT") || safeType.includes("REPORT")) return <FileText className="w-4 h-4 text-cyan-600" />;
    if (safeType.includes("PRESCRIPTION") || safeType.includes("RX")) return <Pill className="w-4 h-4 text-amber-600" />;
    if (safeType.includes("ADMISSION") || safeType.includes("BED")) return <Bed className="w-4 h-4 text-amber-700" />;
    if (safeType.includes("REGISTRATION")) return <UserPlus className="w-4 h-4 text-indigo-600" />;
    return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Date unavailable";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString || "Date unavailable";
    }
  };

  if (safeEvents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center space-y-2">
        <Clock className="w-8 h-8 text-slate-300 mx-auto" />
        <h4 className="font-extrabold text-sm text-slate-700">No Clinical History Events</h4>
        <p className="text-xs text-slate-400 font-medium">No events recorded for this patient history view.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
      <div className="relative border-l-2 border-purple-100 ml-4 space-y-6">
        {safeEvents.map((event) => {
          const typeVal = event.eventType || event.type || "consultation";
          const actorName = typeof event.actor === "string" ? event.actor : event.actor?.name || "Staff";

          return (
            <div key={event.id || Math.random()} className="relative pl-6 group">
              {/* Bullet Icon */}
              <div className="absolute -left-[17px] top-0.5 w-8 h-8 rounded-full bg-white border-2 border-purple-200 shadow-xs flex items-center justify-center group-hover:border-purple-600 transition-colors">
                {getEventIcon(typeVal)}
              </div>

              <div
                onClick={() => onSelectEvent(event)}
                className="p-4 bg-slate-50/70 hover:bg-purple-50/60 rounded-xl border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs text-[#0f172a] uppercase tracking-wider">
                      {formatEventType(typeVal)}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 text-[10px] font-extrabold rounded-full">
                      {actorName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">
                      • {formatDate(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-1.5 leading-relaxed">
                    {event.description || "No detailed notes recorded."}
                  </p>
                </div>

                <div className="shrink-0 flex items-center space-x-1 text-purple-700 font-extrabold text-xs">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryTimeline;
