import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  UserDirectoryItem,
  UserDirectoryResponse,
  getUsers,
  updateUser,
  updateUserStatus,
  softDeleteUser
} from "../services/userService";
import { api } from "../services/api";
import { UserProfileDrawer } from "../components/users/UserProfileDrawer";
import { NewUserModal } from "../components/users/NewUserModal";
import { EditUserModal } from "../components/users/EditUserModal";
import { ResetPasswordModal } from "../components/users/ResetPasswordModal";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: any;
}

const rowRoleOptions = [
  { value: "SUPER_ADMIN", label: "Super Admin (SaaS Owner)" },
  { value: "ADMIN", label: "Hospital Admin" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "NURSE", label: "Nurse" },
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "LAB_TECHNICIAN", label: "Lab Technician" },
  { value: "RECEPTIONIST", label: "Receptionist" }
];

const formatLabel = (value: string) =>
  value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(new Date(value));

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeModule, setActiveModule] = useState<"users" | "audit" | "requests">("users");
  const [data, setData] = useState<UserDirectoryResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [selectedDrawerUser, setSelectedDrawerUser] = useState<UserDirectoryItem | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserDirectoryItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserDirectoryItem | null>(null);
  const [deletingUserTarget, setDeletingUserTarget] = useState<UserDirectoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, auditResponse] = await Promise.all([
        getUsers({
          search: search.trim() || undefined,
          page: currentPage,
          limit: 9
        }),
        api.get("/audit", { params: { limit: 8 } })
      ]);
      setData(usersResponse);
      setAuditLogs(auditResponse.data?.data?.logs || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to load admin panel data");
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    const timer = setTimeout(loadAdminData, 250);
    return () => clearTimeout(timer);
  }, [loadAdminData]);

  const usersList = data?.users || [];
  const metrics = data?.metrics;
  const allUserCount = metrics?.totalStaff ?? data?.pagination.total ?? 0;
  const pendingRequests = useMemo(
    () => auditLogs.filter((log) => log.action.includes("RESET") || log.action.includes("OVERRIDE")),
    [auditLogs]
  );

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleStatusToggle = async (userItem: UserDirectoryItem, nextStatus: string) => {
    try {
      await updateUserStatus(userItem.id, nextStatus);
      triggerSuccess(`Updated ${userItem.name} to ${formatLabel(nextStatus)}`);
      loadAdminData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Failed to update ${userItem.name}`);
    }
  };

  const handleRoleChange = async (userItem: UserDirectoryItem, nextRole: string) => {
    if (nextRole === userItem.role) return;

    try {
      await updateUser(userItem.id, { role: nextRole });
      triggerSuccess(`Updated ${userItem.name} role to ${formatLabel(nextRole)}`);
      loadAdminData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Failed to update role for ${userItem.name}`);
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!deletingUserTarget) return;
    setIsDeleting(true);
    try {
      await softDeleteUser(deletingUserTarget.id);
      triggerSuccess(`Soft-deleted ${deletingUserTarget.name}`);
      setDeletingUserTarget(null);
      if (selectedDrawerUser?.id === deletingUserTarget.id) setSelectedDrawerUser(null);
      loadAdminData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || `Failed to delete ${deletingUserTarget.name}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-5 py-6 md:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Flow
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Admin Panel</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage system users, roles, and security permissions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: "users", label: "Users" },
              { id: "audit", label: "Audit Logs" },
              { id: "requests", label: "Requests" }
            ].map((module) => (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id as "users" | "audit" | "requests")}
                className={`h-11 rounded-lg px-5 text-sm font-black transition ${
                  activeModule === module.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-100"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {module.label}
              </button>
            ))}
          </div>
        </section>

        {successMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <span className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-xs font-bold uppercase">Dismiss</button>
          </div>
        )}

        {activeModule === "users" && (
          <div className="flex justify-end">
            <button
              onClick={() => setIsNewUserModalOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
            >
              <UserPlus className="h-4 w-4" />
              Add New User
            </button>
          </div>
        )}

        {activeModule === "users" && (
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search users..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <p className="text-sm font-bold text-slate-500">
                Total Users: <span className="text-slate-950">{allUserCount}</span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">User Details</th>
                    <th className="px-4 py-3">Role (RBAC)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Security Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center font-semibold text-slate-400">Loading admin data...</td></tr>
                  ) : usersList.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center font-semibold text-slate-400">No users match these filters.</td></tr>
                  ) : (
                    usersList.map((item) => {
                      const isSelf = item.id === currentUser?.id;
                      return (
                        <tr key={item.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-indigo-600">
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 font-black text-slate-950">
                                  {item.name}
                                  {isSelf && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-sky-700">You</span>}
                                </div>
                                <p className="text-xs font-medium text-slate-500">{item.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.role}
                              onChange={(event) => handleRoleChange(item, event.target.value)}
                              className="h-9 w-[245px] rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            >
                              {rowRoleOptions.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${item.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                              <LockKeyhole className="h-3.5 w-3.5" />
                              {formatLabel(item.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setResettingUser(item)}
                                className="ml-1 inline-flex h-9 items-center gap-2 rounded-lg border border-violet-100 bg-violet-50 px-3 text-xs font-black text-violet-600 transition hover:border-violet-200 hover:bg-violet-100"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                Reset Password
                              </button>
                              {currentUser?.role === "SUPER_ADMIN" && (
                                <button onClick={() => setDeletingUserTarget(item)} disabled={isSelf} title="Soft delete user" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
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
            {(data?.pagination.totalPages || 1) > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                <span>
                  Page {data?.pagination.page || 1} of {data?.pagination.totalPages || 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={(data?.pagination.page || 1) <= 1}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((page) => Math.min(data?.pagination.totalPages || 1, page + 1))}
                    disabled={(data?.pagination.page || 1) >= (data?.pagination.totalPages || 1)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeModule === "audit" && (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  System Activity Log
                </h2>
                <span className="text-xs font-black uppercase text-slate-400">{auditLogs.length} Events</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-4 text-xs font-bold text-slate-500">{formatTime(log.timestamp)}</td>
                        <td className="px-4 py-4 font-black text-slate-800">{log.actorName || "System"}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700">
                            {formatLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-600">{log.entityType} {log.entityId}</td>
                      </tr>
                    ))}
                    {!auditLogs.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm font-semibold text-slate-400">
                          No audit activity found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
        )}

        {activeModule === "requests" && (
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
                  <Clock3 className="h-4 w-4 text-amber-600" />
                  Password Recovery Requests
                </h2>
                <span className="rounded-md border border-slate-200 px-2 py-1 text-xs font-black text-slate-500">{pendingRequests.length} Pending</span>
              </div>
              {pendingRequests.length ? (
                <div className="divide-y divide-slate-100">
                  {pendingRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="p-4">
                      <p className="text-sm font-black text-slate-900">{formatLabel(request.action)}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{request.actorName || "System"} requested access to {request.entityType}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-200" />
                  <p className="mt-3 text-sm font-semibold text-slate-400">No pending admin requests.</p>
                </div>
              )}
            </section>
        )}
      </div>

      <UserProfileDrawer
        userItem={selectedDrawerUser}
        actorRole={currentUser?.role}
        actorId={currentUser?.id}
        onClose={() => setSelectedDrawerUser(null)}
        onEdit={(u) => setEditingUser(u)}
        onStatusToggle={handleStatusToggle}
        onResetPassword={(u) => setResettingUser(u)}
        onDelete={(u) => setDeletingUserTarget(u)}
      />

      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onSuccess={() => {
          triggerSuccess("Successfully onboarded new staff user");
          loadAdminData();
        }}
      />

      <EditUserModal
        userItem={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          triggerSuccess("Successfully updated staff user");
          loadAdminData();
        }}
      />

      <ResetPasswordModal
        userItem={resettingUser}
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        onSuccess={() => triggerSuccess("Successfully reset staff user password")}
      />

      {deletingUserTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="rounded-lg bg-rose-50 p-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950">Confirm Soft Delete</h3>
                <p className="text-xs font-semibold text-slate-500">Account access will be disabled.</p>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm font-medium text-slate-600">
              Soft-delete <strong className="text-slate-950">{deletingUserTarget.name}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setDeletingUserTarget(null)} disabled={isDeleting} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleConfirmSoftDelete} disabled={isDeleting} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50">
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Soft Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
