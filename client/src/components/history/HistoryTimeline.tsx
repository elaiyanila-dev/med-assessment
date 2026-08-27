import React from "react";
import { Activity, Stethoscope, FileSpreadsheet, Pill, Clock, CheckCircle2, ChevronRight, UserPlus } from "lucide-react";

export interface TimelineEventItem {
  id: string;
  eventType: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface HistoryTimelineProps {
  events: TimelineEventItem[];
  onSelectEvent: (event: TimelineEventItem) => void;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ events, onSelectEvent }) => {
  const getEventIcon = (eventType: string) => {
    const type = eventType.toUpperCase();
    if (type.includes("CONSULTATION")) return <Stethoscope className="w-4 h-4 text-purple-600" />;
    if (type.includes("VITAL")) return <Activity className="w-4 h-4 text-emerald-600" />;
    if (type.includes("LAB")) return <FileSpreadsheet className="w-4 h-4 text-blue-600" />;
    if (type.includes("PRESCRIPTION")) return <Pill className="w-4 h-4 text-amber-600" />;
    if (type.includes("REGISTRATION")) return <UserPlus className="w-4 h-4 text-indigo-600" />;
    return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
  };

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

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center space-y-2">
        <Clock className="w-8 h-8 text-slate-300 mx-auto" />
        <h4 className="font-bold text-sm text-slate-700">No Clinical History Events</h4>
        <p className="text-xs text-slate-400">No events found matching the selected filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
      <div className="relative border-l-2 border-purple-100 ml-4 space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative pl-6 group">
            {/* Bullet Icon */}
            <div className="absolute -left-[17px] top-0.5 w-8 h-8 rounded-full bg-white border-2 border-purple-200 shadow-xs flex items-center justify-center group-hover:border-purple-600 transition-colors">
              {getEventIcon(event.eventType)}
            </div>

            <div
              onClick={() => onSelectEvent(event)}
              className="p-4 bg-slate-50/70 hover:bg-purple-50/60 rounded-xl border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    {event.eventType.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    • {formatDate(event.timestamp)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  {event.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center space-x-1 text-purple-700 font-bold text-xs">
                <span>View Details</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
