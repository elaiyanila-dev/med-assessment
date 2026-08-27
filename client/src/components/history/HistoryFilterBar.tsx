import React from "react";
import { Filter, Activity, Stethoscope, FileSpreadsheet, Pill } from "lucide-react";

export type HistoryFilterType = "ALL" | "CONSULTATIONS" | "VITALS" | "LABORATORY" | "PRESCRIPTIONS";

interface HistoryFilterBarProps {
  activeFilter: HistoryFilterType;
  onSelectFilter: (filter: HistoryFilterType) => void;
}

export const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  activeFilter,
  onSelectFilter
}) => {
  const filters: Array<{ type: HistoryFilterType; label: string; icon: React.ReactNode }> = [
    { type: "ALL", label: "All Events", icon: <Filter className="w-3.5 h-3.5" /> },
    { type: "CONSULTATIONS", label: "Consultations", icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { type: "VITALS", label: "Vitals", icon: <Activity className="w-3.5 h-3.5" /> },
    { type: "LABORATORY", label: "Laboratory", icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { type: "PRESCRIPTIONS", label: "Prescriptions", icon: <Pill className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 overflow-x-auto">
      {filters.map((f) => {
        const isActive = activeFilter === f.type;
        return (
          <button
            key={f.type}
            type="button"
            onClick={() => onSelectFilter(f.type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            {f.icon}
            <span>{f.label}</span>
          </button>
        );
      })}
    </div>
  );
};
