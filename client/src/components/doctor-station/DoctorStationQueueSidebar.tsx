import React from "react";
import { Users, Clock, ChevronRight } from "lucide-react";

export interface StationQueueItem {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  token: number | string;
  status: string;
  priority: string;
  arrivalTime: string;
}

interface DoctorStationQueueSidebarProps {
  entries: StationQueueItem[];
  selectedQueueId?: string | null;
  onSelectPatient: (patientId: string, queueId: string) => void;
}

export const DoctorStationQueueSidebar: React.FC<DoctorStationQueueSidebarProps> = ({
  entries,
  selectedQueueId,
  onSelectPatient
}) => {
  const getStatusDot = (status: string) => {
    switch (status) {
      case "IN_CONSULTATION":
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="In Consultation" />;
      case "CHECKED_IN":
        return <span className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Checked In" />;
      case "ON_HOLD":
        return <span className="w-2.5 h-2.5 rounded-full bg-orange-500" title="On Hold" />;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Waiting" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-purple-700" />
          <h3 className="font-bold text-sm text-slate-800">My OPD Queue</h3>
        </div>
        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
          {entries.length}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 space-y-1">
          <Clock className="w-5 h-5 mx-auto text-slate-300 mb-1" />
          <div>No active queue entries</div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {entries.map((item) => {
            const isSelected = selectedQueueId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectPatient(item.patientId, item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-purple-50 border-purple-300 shadow-xs"
                    : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-white text-purple-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                    Q-{item.token}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-xs text-slate-900 truncate flex items-center space-x-1.5">
                      {getStatusDot(item.status)}
                      <span className="truncate">{item.patientName}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">{item.patientUHID}</div>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400">
                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-purple-600" : ""}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
