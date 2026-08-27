import React from "react";
import { Users, Eye, Edit, Trash2, ShieldAlert, Activity } from "lucide-react";

interface PatientRow {
  id: string;
  name: string;
  UHID: string;
  age?: number;
  gender: string;
  mobile: string;
  email?: string;
  bloodGroup?: string;
  address?: string;
  priority: string;
  registrationType: string;
  department?: string;
  allergiesCount: number;
  conditionsCount: number;
  activeAdmissionBed?: string | null;
  activeQueueToken?: number | null;
  createdAt: string;
}

interface TableProps {
  patients: PatientRow[];
  userRole: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (p: number) => void;
  onViewProfile: (id: string) => void;
  onEditDemographics: (patient: PatientRow) => void;
  onSoftDelete: (id: string) => void;
}

export const PatientTable: React.FC<TableProps> = ({
  patients,
  userRole,
  pagination,
  onPageChange,
  onViewProfile,
  onEditDemographics,
  onSoftDelete
}) => {
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);
  const canMutate = ["RECEPTIONIST", "DOCTOR", "NURSE", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  if (patients.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-12 text-center">
        <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-medium text-slate-300">No Patient Records Found</h3>
        <p className="text-xs text-slate-500 mt-1">There are no patient profiles matching your search query or filter parameters.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md flex flex-col">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">UHID & Name</th>
              <th className="py-3.5 px-4 font-semibold">Demographics & Contact</th>
              <th className="py-3.5 px-4 font-semibold">Care Status & Location</th>
              <th className="py-3.5 px-4 font-semibold">Safety Flags</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors duration-150">
                {/* UHID & Name */}
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.priority !== "NORMAL" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {p.priority}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-purple-400 mt-0.5">{p.UHID}</div>
                </td>

                {/* Demographics */}
                <td className="py-4 px-4">
                  <div className="text-xs text-slate-200">
                    {p.age ? `${p.age} yrs` : "Age N/A"} • {p.gender} {p.bloodGroup && `• (${p.bloodGroup})`}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{p.mobile}</div>
                </td>

                {/* Care Status */}
                <td className="py-4 px-4">
                  {p.activeAdmissionBed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      Inpatient ({p.activeAdmissionBed})
                    </span>
                  ) : p.activeQueueToken ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      In OPD Queue (Token #{p.activeQueueToken})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Outpatient ({p.registrationType})
                    </span>
                  )}
                </td>

                {/* Safety Flags */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {p.allergiesCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <ShieldAlert className="h-3 w-3" /> {p.allergiesCount} Allergy
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">0 Allergies</span>
                    )}

                    {p.conditionsCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Activity className="h-3 w-3" /> {p.conditionsCount} Condition
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onViewProfile(p.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 transition-all inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Profile
                    </button>
                    {canMutate && (
                      <button
                        onClick={() => onEditDemographics(p)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all"
                        title="Edit Demographics"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onSoftDelete(p.id)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                        title="Soft Delete Profile"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 text-xs">
          <span className="text-slate-400">
            Showing page <strong className="text-slate-200">{pagination.page}</strong> of <strong className="text-slate-200">{pagination.totalPages}</strong> ({pagination.total} patients)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
