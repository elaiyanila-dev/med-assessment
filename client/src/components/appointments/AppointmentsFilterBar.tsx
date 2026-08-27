import React from "react";
import { Search, Plus, UserPlus } from "lucide-react";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  userRole: string;
  onOpenNewAppointmentModal: () => void;
  onOpenRegisterModal: () => void;
}

export const AppointmentsFilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  userRole,
  onOpenNewAppointmentModal,
  onOpenRegisterModal
}) => {
  const filters = [
    { label: "All Appointments", value: "ALL" },
    { label: "Scheduled", value: "SCHEDULED" },
    { label: "Checked-In", value: "CHECKED_IN" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "No-Show", value: "NO_SHOW" }
  ];

  const canMutate = ["RECEPTIONIST", "DOCTOR", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
      {/* Search Input */}
      <div className="relative w-full lg:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Patient, UHID, Doctor, Dept..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 w-full lg:w-auto bg-slate-950/60 p-1 rounded-lg border border-slate-800/80">
        {filters.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onStatusFilterChange(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      {canMutate && (
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            onClick={onOpenRegisterModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-purple-300 hover:bg-slate-700 border border-purple-500/30 transition-all"
          >
            <UserPlus className="h-4 w-4" /> Register & Book
          </button>
          <button
            onClick={onOpenNewAppointmentModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Book Appointment
          </button>
        </div>
      )}
    </div>
  );
};
