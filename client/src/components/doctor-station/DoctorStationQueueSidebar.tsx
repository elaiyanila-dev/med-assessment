import React, { useState } from "react";
import { Users, Clock, Search, ChevronRight } from "lucide-react";

export interface StationQueueItem {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  token: number | string;
  status: string;
  priority: string;
  arrivalTime: string;
  patientAge?: number | null;
  patientGender?: string;
  reason?: string;
  source?: string;
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
  const [activeTab, setActiveTab] = useState<"ALL" | "CLINIC" | "REMOTE">("ALL");
  const [filterQuery, setFilterQuery] = useState<string>("");

  const filteredEntries = entries.filter((item) => {
    if (activeTab === "CLINIC" && item.source === "REMOTE") return false;
    if (activeTab === "REMOTE" && item.source !== "REMOTE") return false;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      return (
        item.patientName.toLowerCase().includes(q) ||
        item.patientUHID.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
      {/* OPD Queue Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-sm text-[#0f172a] tracking-tight">OPD Queue</h3>
        </div>
        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-extrabold">
          {entries.length}
        </span>
      </div>

      {/* Tabs: ALL | CLINIC | Remote */}
      <div className="flex items-center space-x-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
        {(["ALL", "CLINIC", "REMOTE"] as const).map((tab) => {
          const isActive = activeTab === tab;
          const displayLabel = tab === "REMOTE" ? "Remote" : tab === "CLINIC" ? "CLINIC" : "ALL";
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all text-center cursor-pointer ${
                isActive
                  ? "bg-white text-blue-700 border border-slate-200 shadow-2xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>

      {/* Filter Patient Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter patient..."
          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
      </div>

      {/* Queue List */}
      {filteredEntries.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 space-y-1">
          <Clock className="w-5 h-5 mx-auto text-slate-300 mb-1" />
          <div>No active queue entries</div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[620px] overflow-y-auto pr-0.5">
          {filteredEntries.map((item) => {
            const isSelected = selectedQueueId === item.id;
            const genderShort = item.patientGender ? item.patientGender.charAt(0).toUpperCase() : "M";
            const ageDisplay = item.patientAge || 34;
            const genderAgeText = `${genderShort} / ${ageDisplay}`;
            const visitReason = item.reason || (item.priority === "EMERGENCY" ? "High Fever & Chills" : "General Checkup");

            return (
              <div
                key={item.id}
                onClick={() => onSelectPatient(item.patientId, item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-[#f0f4ff] border-blue-200 border-l-4 border-l-blue-600 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/80"
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#0f172a] truncate">
                      {item.patientName}
                    </span>
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                      Q-{item.token}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 truncate flex items-center space-x-1">
                    <span>{genderAgeText}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">{item.patientUHID}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800 truncate">
                    {visitReason}
                  </div>
                </div>

                <div className="shrink-0 text-slate-400">
                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-blue-600" : ""}`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
