import React from "react";
import { Search, UserPlus, Filter } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  registrationTypeFilter: string;
  onRegistrationTypeChange: (type: string) => void;
  bloodGroupFilter: string;
  onBloodGroupChange: (bg: string) => void;
  priorityFilter: string;
  onPriorityChange: (p: string) => void;
  userRole: string;
  onOpenRegisterModal: () => void;
}

export const PatientFilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  registrationTypeFilter,
  onRegistrationTypeChange,
  bloodGroupFilter,
  onBloodGroupChange,
  priorityFilter,
  onPriorityChange,
  userRole,
  onOpenRegisterModal
}) => {
  const tabs = [
    { label: "All Patients", value: "ALL" },
    { label: "OPD Outpatients", value: "OPD" },
    { label: "IPD Inpatients", value: "IPD" }
  ];

  const bloodGroups = ["ALL", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
  const priorities = ["ALL", "NORMAL", "HIGH", "URGENT", "EMERGENCY"];

  const canRegister = ["RECEPTIONIST", "DOCTOR", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
      {/* Search Input */}
      <div className="relative w-full lg:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Name, UHID, Mobile..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
        />
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        {/* Type Tabs */}
        <div className="flex gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
          {tabs.map((t) => {
            const isActive = registrationTypeFilter === t.value;
            return (
              <button
                key={t.value}
                onClick={() => onRegistrationTypeChange(t.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Blood Group Select */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Blood:</span>
          <select
            value={bloodGroupFilter}
            onChange={(e) => onBloodGroupChange(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none"
          >
            {bloodGroups.map((bg) => (
              <option key={bg} value={bg} className="bg-slate-900 text-slate-200">
                {bg}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Select */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none"
          >
            {priorities.map((p) => (
              <option key={p} value={p} className="bg-slate-900 text-slate-200">
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Button */}
      {canRegister && (
        <button
          onClick={onOpenRegisterModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all shrink-0"
        >
          <UserPlus className="h-4 w-4" /> Register New Patient
        </button>
      )}
    </div>
  );
};
