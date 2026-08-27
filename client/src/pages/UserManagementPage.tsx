import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  UserDirectoryItem,
  UserDirectoryResponse,
  getUsers,
  updateUserStatus,
  softDeleteUser
} from "../services/userService";
import { UserDirectorySkeleton } from "../components/users/UserDirectorySkeleton";
import { UserSummaryCards } from "../components/users/UserSummaryCards";
import { UserFilterBar } from "../components/users/UserFilterBar";
import { UserTable } from "../components/users/UserTable";
import { UserProfileDrawer } from "../components/users/UserProfileDrawer";
import { NewUserModal } from "../components/users/NewUserModal";
import { EditUserModal } from "../components/users/EditUserModal";
import { ResetPasswordModal } from "../components/users/ResetPasswordModal";
import { ShieldCheck, ShieldAlert, AlertTriangle, Trash2 } from "lucide-react";

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [data, setData] = useState<UserDirectoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal & Drawer states
  const [selectedDrawerUser, setSelectedDrawerUser] = useState<UserDirectoryItem | null>(null);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserDirectoryItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserDirectoryItem | null>(null);

  // Delete Confirmation dialog state
  const [deletingUserTarget, setDeletingUserTarget] = useState<UserDirectoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadUserDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsers({
        search: search.trim() || undefined,
        role: roleFilter !== "ALL" ? roleFilter : undefined,
        department: departmentFilter !== "ALL" ? departmentFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        page: currentPage,
        limit: 15
      });
      setData(response);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(
        err.response?.data?.error?.message || "Failed to load staff user directory"
      );
    }
  }, [search, roleFilter, departmentFilter, statusFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUserDirectory();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUserDirectory]);

  // Toast / notification timers
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleResetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setDepartmentFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const handleStatusToggle = async (userItem: UserDirectoryItem, nextStatus: string) => {
    try {
      await updateUserStatus(userItem.id, nextStatus);
      triggerSuccess(`Updated account status for ${userItem.name} to ${nextStatus}`);
      loadUserDirectory();
      if (selectedDrawerUser?.id === userItem.id) {
        setSelectedDrawerUser({ ...userItem, status: nextStatus });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || `Failed to change status for ${userItem.name}`
      );
    }
  };

  const handleConfirmSoftDelete = async () => {
    if (!deletingUserTarget) return;

    setIsDeleting(true);
    setError(null);

    try {
      await softDeleteUser(deletingUserTarget.id);
      setIsDeleting(false);
      triggerSuccess(`Soft-deleted staff user account ${deletingUserTarget.name}`);
      setDeletingUserTarget(null);
      if (selectedDrawerUser?.id === deletingUserTarget.id) {
        setSelectedDrawerUser(null);
      }
      loadUserDirectory();
    } catch (err: any) {
      setIsDeleting(false);
      setError(
        err.response?.data?.error?.message || `Failed to delete ${deletingUserTarget.name}`
      );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              User Management & Governance
            </h1>
            <span className="bg-cyan-500/10 text-cyan-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Phase 11 Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized directory for hospital staff governance, security credentials, and role privileges
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/50">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Logged in as: <strong className="text-slate-200">{currentUser?.name || "Admin"}</strong> ({currentUser?.role})</span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-300 text-sm animate-in fade-in">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between gap-3 text-rose-300 text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-rose-400 hover:text-rose-200 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton vs Main Content */}
      {loading && !data ? (
        <UserDirectorySkeleton />
      ) : (
        <>
          {/* Summary Cards */}
          {data?.metrics && <UserSummaryCards metrics={data.metrics} />}

          {/* Filter Bar */}
          <UserFilterBar
            search={search}
            roleFilter={roleFilter}
            departmentFilter={departmentFilter}
            statusFilter={statusFilter}
            onSearchChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            onRoleChange={(val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            }}
            onDepartmentChange={(val) => {
              setDepartmentFilter(val);
              setCurrentPage(1);
            }}
            onStatusChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            onResetFilters={handleResetFilters}
            onOpenNewUserModal={() => setIsNewUserModalOpen(true)}
          />

          {/* User Table */}
          <UserTable
            users={data?.users || []}
            actorRole={currentUser?.role}
            actorId={currentUser?.id}
            currentPage={data?.pagination.page || 1}
            totalPages={data?.pagination.totalPages || 1}
            onPageChange={(page) => setCurrentPage(page)}
            onViewUser={(u) => setSelectedDrawerUser(u)}
            onEditUser={(u) => setEditingUser(u)}
            onStatusToggle={handleStatusToggle}
            onResetPassword={(u) => setResettingUser(u)}
            onDeleteUser={(u) => setDeletingUserTarget(u)}
          />
        </>
      )}

      {/* User Profile Drawer */}
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

      {/* New User Onboarding Modal */}
      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onSuccess={() => {
          triggerSuccess("Successfully onboarded new staff user");
          loadUserDirectory();
        }}
      />

      {/* Edit Demographics Modal */}
      <EditUserModal
        userItem={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          triggerSuccess("Successfully updated staff demographics");
          loadUserDirectory();
        }}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        userItem={resettingUser}
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        onSuccess={() => {
          triggerSuccess("Successfully reset staff user password");
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deletingUserTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Confirm Soft Delete</h3>
                <p className="text-xs text-slate-400">Super Administrator Governance Control</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/40">
              Are you sure you want to soft-delete staff member{" "}
              <strong className="text-slate-100">{deletingUserTarget.name}</strong> ({deletingUserTarget.email})?
              This will disable their account access while retaining underlying database integrity.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUserTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSoftDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-900/20 disabled:opacity-50 transition-all"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Soft Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
