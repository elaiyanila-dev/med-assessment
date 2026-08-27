import React from "react";
import { Search } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const PharmacyFilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  const filters = [
    { label: "All Queue", value: "ALL" },
    { label: "Pending Dispense", value: "SENT_TO_PHARMACY" },
    { label: "Dispensed", value: "DISPENSED" },
    { label: "Cancelled", value: "CANCELLED" }
  ];

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Patient, UHID, Rx ID, Medicine..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 w-full md:w-auto bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
        {filters.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onStatusFilterChange(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
