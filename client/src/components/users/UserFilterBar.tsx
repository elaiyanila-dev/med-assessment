import React from "react";
import { Search, Filter, RotateCcw, UserPlus } from "lucide-react";

interface UserFilterBarProps {
  search: string;
  roleFilter: string;
  departmentFilter: string;
  statusFilter: string;
  onSearchChange: (val: string) => void;
  onRoleChange: (val: string) => void;
  onDepartmentChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onResetFilters: () => void;
  onOpenNewUserModal: () => void;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  search,
  roleFilter,
  departmentFilter,
  statusFilter,
  onSearchChange,
  onRoleChange,
  onDepartmentChange,
  onStatusChange,
  onResetFilters,
  onOpenNewUserModal
}) => {
  const roles = [
    { value: "ALL", label: "All Roles" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ADMIN", label: "Administrator" },
    { value: "DOCTOR", label: "Doctor" },
    { value: "NURSE", label: "Nurse" },
    { value: "RECEPTIONIST", label: "Receptionist" },
    { value: "LAB_TECHNICIAN", label: "Lab Technician" },
    { value: "PATHOLOGIST", label: "Pathologist" },
    { value: "PHARMACIST", label: "Pharmacist" }
  ];

  const departments = [
    { value: "ALL", label: "All Departments" },
    { value: "General Medicine", label: "General Medicine" },
    { value: "Cardiology", label: "Cardiology" },
    { value: "Pediatrics", label: "Pediatrics" },
    { value: "Orthopedics", label: "Orthopedics" },
    { value: "Neurology", label: "Neurology" },
    { value: "Emergency", label: "Emergency" },
    { value: "ICU", label: "ICU" },
    { value: "Wards", label: "IPD Wards" },
    { value: "Laboratory", label: "Laboratory" },
    { value: "Pharmacy", label: "Pharmacy" },
    { value: "Administration", label: "Administration" }
  ];

  const statuses = [
    { value: "ALL", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
    { value: "SUSPENDED", label: "Suspended" }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/40 backdrop-blur-sm">
      {/* Search Input */}
      <div className="relative w-full lg:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, phone, role..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-700/60 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
        <div className="flex items-center gap-1 text-xs text-slate-400 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value} className="bg-slate-900 text-slate-200">
              {r.label}
            </option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
        >
          {departments.map((d) => (
            <option key={d.value} value={d.value} className="bg-slate-900 text-slate-200">
              {d.label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-slate-900/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value} className="bg-slate-900 text-slate-200">
              {s.label}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        <button
          onClick={onResetFilters}
          title="Reset Filters"
          className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Onboard New Staff Button */}
        <button
          onClick={onOpenNewUserModal}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-lg shadow-cyan-900/20 transition-all ml-auto lg:ml-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Onboard Staff</span>
        </button>
      </div>
    </div>
  );
};
