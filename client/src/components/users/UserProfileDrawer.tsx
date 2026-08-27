import React, { useEffect, useState } from "react";
import { X, User, Mail, Phone, Building, Briefcase, Calendar, Activity, Edit3, KeyRound, UserX, UserCheck, Trash2, Clock } from "lucide-react";
import { UserDirectoryItem, UserProfileResponse, getUserById } from "../../services/userService";

interface UserProfileDrawerProps {
  userItem: UserDirectoryItem | null;
  actorRole?: string;
  actorId?: string;
  onClose: () => void;
  onEdit: (user: UserDirectoryItem) => void;
  onStatusToggle: (user: UserDirectoryItem, nextStatus: string) => void;
  onResetPassword: (user: UserDirectoryItem) => void;
  onDelete: (user: UserDirectoryItem) => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  userItem,
  actorRole,
  actorId,
  onClose,
  onEdit,
  onStatusToggle,
  onResetPassword,
  onDelete
}) => {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userItem) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    getUserById(userItem.id)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.error?.message || "Failed to load staff profile");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userItem]);

  if (!userItem) return null;

  const isSuperAdmin = actorRole === "SUPER_ADMIN";
  const isSelf = userItem.id === actorId;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-lg">
              {userItem.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{userItem.name}</h2>
              <p className="text-xs text-slate-400 font-mono">{userItem.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 bg-slate-800 rounded w-1/2"></div>
              <div className="h-20 bg-slate-800 rounded"></div>
              <div className="h-32 bg-slate-800 rounded"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-sm">
              {error}
            </div>
          ) : (
            <>
              {/* Account Status Badge */}
              <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
                <span className="text-xs text-slate-400 font-medium">Account Status</span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    userItem.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {userItem.status}
                </span>
              </div>

              {/* Basic Demographic Information */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Demographics & Contact</span>
                </h3>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" /> Email
                    </span>
                    <span className="text-slate-200 font-medium text-xs">{userItem.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> Phone
                    </span>
                    <span className="text-slate-200 font-mono text-xs">{userItem.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" /> Department
                    </span>
                    <span className="text-slate-200 text-xs">{userItem.department || "General"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" /> Specialization
                    </span>
                    <span className="text-slate-200 text-xs">{userItem.specialization || "General Practice"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Member Since
                    </span>
                    <span className="text-slate-200 text-xs">
                      {new Date(userItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operational Activity Metrics */}
              {profile?.operationalMetrics && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span>Operational Scope Metrics</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                      <p className="text-[11px] text-slate-400">Assigned Queue</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {profile.operationalMetrics.assignedQueueEntriesCount}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                      <p className="text-[11px] text-slate-400">Active Consultations</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {profile.operationalMetrics.activeConsultationsCount}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                      <p className="text-[11px] text-slate-400">IPD Admissions</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {profile.operationalMetrics.activeAdmissionsCount}
                      </p>
                    </div>
                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                      <p className="text-[11px] text-slate-400">Active Lab Orders</p>
                      <p className="text-lg font-bold text-slate-200 mt-1">
                        {profile.operationalMetrics.labOrdersCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nurse Shift Info if applicable */}
              {profile?.nurseDetails && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Nurse Shift Profile</span>
                  </h3>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Ward:</span>
                      <span className="font-medium">{profile.nurseDetails.ward}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Shift:</span>
                      <span className="font-medium">{profile.nurseDetails.shift}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Timing:</span>
                      <span className="font-mono">{profile.nurseDetails.startTime} - {profile.nurseDetails.endTime}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/90 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onEdit(userItem)}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs py-2.5 px-3 rounded-lg border border-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => onResetPassword(userItem)}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs py-2.5 px-3 rounded-lg border border-slate-700 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>Reset Pass</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() =>
                onStatusToggle(
                  userItem,
                  userItem.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                )
              }
              className={`flex-1 flex items-center justify-center gap-2 font-medium text-xs py-2.5 px-3 rounded-lg border transition-colors ${
                userItem.status === "ACTIVE"
                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              }`}
            >
              {userItem.status === "ACTIVE" ? (
                <>
                  <UserX className="w-3.5 h-3.5" /> Suspend Account
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" /> Activate Account
                </>
              )}
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => onDelete(userItem)}
                disabled={isSelf}
                className="flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-medium text-xs py-2.5 px-3 rounded-lg border border-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
