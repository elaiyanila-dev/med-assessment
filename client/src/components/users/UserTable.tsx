import React from "react";
import { UserDirectoryItem } from "../../services/userService";
import { Eye, Edit3, KeyRound, Trash2, ChevronLeft, ChevronRight, Shield, UserCheck, UserX } from "lucide-react";

interface UserTableProps {
  users: UserDirectoryItem[];
  actorRole?: string;
  actorId?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewUser: (user: UserDirectoryItem) => void;
  onEditUser: (user: UserDirectoryItem) => void;
  onStatusToggle: (user: UserDirectoryItem, nextStatus: string) => void;
  onResetPassword: (user: UserDirectoryItem) => void;
  onDeleteUser: (user: UserDirectoryItem) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  actorRole,
  actorId,
  currentPage,
  totalPages,
  onPageChange,
  onViewUser,
  onEditUser,
  onStatusToggle,
  onResetPassword,
  onDeleteUser
}) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "ADMIN":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "DOCTOR":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      case "NURSE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "RECEPTIONIST":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "LAB_TECHNICIAN":
      case "PATHOLOGIST":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "PHARMACIST":
        return "bg-teal-500/20 text-teal-300 border-teal-500/30";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600/50";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "INACTIVE":
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
      case "SUSPENDED":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    }
  };

  const isSuperAdmin = actorRole === "SUPER_ADMIN";

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-md shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Staff Member</th>
              <th className="py-3.5 px-4 font-semibold">Role</th>
              <th className="py-3.5 px-4 font-semibold">Department</th>
              <th className="py-3.5 px-4 font-semibold">Contact Phone</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <UserX className="w-8 h-8 text-slate-500" />
                    <p className="text-base font-medium text-slate-300">No staff members found</p>
                    <p className="text-xs text-slate-500">Try adjusting your search terms or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSelf = user.id === actorId;
                return (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-700/30 transition-colors group"
                  >
                    {/* Staff Member Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-700/60 border border-slate-600/50 flex items-center justify-center font-bold text-slate-200 text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.role === "SUPER_ADMIN" && (
                              <span title="Super Administrator">
                                <Shield className="w-3.5 h-3.5 text-purple-400" />
                              </span>
                            )}
                            {isSelf && (
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Department / Specialization */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 text-xs font-medium">
                        {user.department || "General"}
                      </div>
                      {user.specialization && (
                        <div className="text-[11px] text-slate-400">{user.specialization}</div>
                      )}
                    </td>

                    {/* Contact Phone */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      {user.phone || "—"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(user.status)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                        {user.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* View Drawer */}
                        <button
                          onClick={() => onViewUser(user)}
                          title="View Profile Details"
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-700/60 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Demographics */}
                        <button
                          onClick={() => onEditUser(user)}
                          title="Edit Staff Demographics"
                          className="p-1.5 text-slate-400 hover:text-blue-300 hover:bg-slate-700/60 rounded-md transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Toggle Status (Active <-> Suspended) */}
                        <button
                          onClick={() =>
                            onStatusToggle(
                              user,
                              user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                            )
                          }
                          title={user.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                          className={`p-1.5 rounded-md transition-colors ${
                            user.status === "ACTIVE"
                              ? "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                              : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                        >
                          {user.status === "ACTIVE" ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => onResetPassword(user)}
                          title="Reset Password"
                          className="p-1.5 text-slate-400 hover:text-purple-300 hover:bg-slate-700/60 rounded-md transition-colors"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Soft Delete - ONLY shown to SUPER_ADMIN */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => onDeleteUser(user)}
                            disabled={isSelf}
                            title={isSelf ? "You cannot delete your own account" : "Soft Delete User"}
                            className={`p-1.5 rounded-md transition-colors ${
                              isSelf
                                ? "text-slate-600 cursor-not-allowed"
                                : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between bg-slate-900/40 text-xs text-slate-400">
          <div>
            Page <span className="font-semibold text-slate-200">{currentPage}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
