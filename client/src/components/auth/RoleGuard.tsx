import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  const userRole = user?.role || "DOCTOR";
  const hasPermission = allowedRoles.includes(userRole);

  if (!hasPermission) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xs border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-[#0f172a]">Access Denied</h2>
            <p className="text-xs font-semibold text-slate-500">
              You do not have permission to view this page.
            </p>
            <div className="inline-block px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 font-mono mt-1">
              Required Role: {allowedRoles.join(", ")}
            </div>
          </div>
          <div className="pt-2">
            <Link
              to="/patient-queue"
              className="inline-flex items-center space-x-2 px-4.5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Patient Queue</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
