import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getNavItemsForRole } from "../../config/navigation";
import { Building2, LogOut } from "lucide-react";

interface AppSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = getNavItemsForRole(user?.role);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const doctorName = user?.name
    ? user.name.startsWith("Dr.")
      ? user.name
      : `Dr. ${user.name}`
    : "Dr. Sharma";

  const doctorInitial = user?.name
    ? user.name.replace(/^Dr\.\s*/i, "").charAt(0).toUpperCase() || "D"
    : "D";

  const formattedRole = user?.role
    ? user.role.replace(/_/g, " ")
    : "DOCTOR";

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-[283px] min-w-[283px] max-w-[283px] bg-gradient-to-b from-[#30278f] via-[#3a1d95] to-[#4b16a8] text-white flex flex-col transition-transform duration-300 ease-in-out shrink-0
        lg:static lg:translate-x-0 shadow-xl
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Top Brand Area */}
      <div className="pt-6 px-6 pb-4 flex items-center space-x-3.5 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-purple-500/25 border border-purple-300/30 flex items-center justify-center text-white shadow-inner shrink-0">
          <Building2 className="w-6 h-6 text-purple-100" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">
            MedNxt
          </h1>
          <p className="text-[10px] font-bold text-purple-200/80 tracking-widest uppercase mt-1">
            AI HEALTH SYSTEM
          </p>
        </div>
      </div>

      {/* Doctor Profile Card */}
      <div className="mx-4 my-2 p-3.5 rounded-2xl bg-[#231770]/80 border border-purple-400/20 flex items-center space-x-3 shadow-inner shrink-0">
        <div className="w-10 h-10 rounded-full bg-purple-500/30 border border-purple-300/40 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
          {doctorInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white leading-tight truncate">
            {doctorName}
          </p>
          <p className="text-[11px] font-semibold text-purple-200/70 tracking-wider uppercase leading-tight mt-0.5">
            {formattedRole}
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3.5 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === "/patient-queue" && location.pathname === "/patients/new");

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`
                w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 text-left
                ${
                  isActive
                    ? "bg-[#6336d3] text-white shadow-md border border-purple-400/30 font-bold"
                    : "text-purple-200/80 hover:text-white hover:bg-purple-800/40"
                }
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-purple-300/80"}`} />
              <span className="truncate flex-1">{item.label}</span>
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-white shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Sign Out Anchored */}
      <div className="p-4 border-t border-purple-800/40 shrink-0">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-200/90 hover:text-white hover:bg-purple-800/40 transition-colors text-left"
        >
          <LogOut className="w-5 h-5 shrink-0 text-purple-300/80" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
