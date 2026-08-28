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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* Search Input */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Patient, UHID, Rx ID, Medicine..."
          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 w-full md:w-auto bg-slate-50 p-1 rounded-xl border border-slate-200/80">
        {filters.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onStatusFilterChange(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-purple-50 text-purple-700 font-extrabold border border-purple-200/80 shadow-2xs"
                  : "text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-100"
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
