import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getNavItemsForRole } from "../../config/navigation";
import { Building2, LogOut, Settings } from "lucide-react";

interface AppSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  collapsed?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ mobileOpen, setMobileOpen, collapsed = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = getNavItemsForRole(user?.role);
  const isAdminPortal = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

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

  const displayName = user?.name || "MedNxt User";

  const userInitial = user?.name
    ? user.name.replace(/^Dr\.\s*/i, "").charAt(0).toUpperCase() || "D"
    : "D";

  const formattedRole = user?.role
    ? user.role.replace(/_/g, " ")
    : "DOCTOR";

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 text-white flex flex-col transition-all duration-300 ease-in-out shrink-0
        lg:static lg:translate-x-0 shadow-xl
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        ${collapsed ? "w-[283px] min-w-[283px] max-w-[283px] lg:w-[88px] lg:min-w-[88px] lg:max-w-[88px]" : "w-[283px] min-w-[283px] max-w-[283px]"}
      `}
      style={{
        background:
          "linear-gradient(to bottom, var(--brand-sidebar-from), var(--brand-sidebar-via), var(--brand-sidebar-to))"
      }}
    >
      {/* Top Brand Area */}
      <div className={`pt-6 pb-4 flex items-center shrink-0 ${collapsed ? "lg:justify-center lg:px-0 px-6 space-x-3.5" : "px-6 space-x-3.5"}`}>
        <div className="w-11 h-11 rounded-xl border flex items-center justify-center text-white shadow-inner shrink-0 bg-white/15 border-white/20">
          <Building2 className="w-6 h-6 text-brand-100" />
        </div>
        <div className={collapsed ? "lg:hidden" : ""}>
          <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">
            MedNxt
          </h1>
          <p className="text-[10px] font-bold tracking-widest uppercase mt-1 text-brand-200">
            AI HEALTH SYSTEM
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div
        className={`mx-4 my-2 rounded-2xl border flex items-center shadow-inner shrink-0 bg-black/20 border-white/10 ${
          collapsed ? "lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:p-0 p-3.5 space-x-3" : "p-3.5 space-x-3"
        }`}
      >
        <div className={`${collapsed ? "lg:w-10 lg:h-10" : "w-10 h-10"} rounded-full border text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 bg-white/15 border-white/30`}>
          {userInitial}
        </div>
        <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
          <p className={`${isAdminPortal ? "text-base" : "text-sm"} font-bold text-white leading-tight truncate`}>
            {displayName}
          </p>
          <p className="text-[11px] font-semibold tracking-wider uppercase leading-tight mt-0.5 text-brand-200">
            {formattedRole}
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 py-4 space-y-1.5 overflow-y-auto ${collapsed ? "lg:px-3 px-3.5" : "px-3.5"}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === "/registration" && location.pathname === "/patients/new");

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              title={collapsed ? item.label : undefined}
              className={`
                relative w-full flex items-center rounded-xl ${isAdminPortal ? "text-base" : "text-sm"} font-medium transition-all duration-150 text-left
                ${collapsed ? "lg:h-12 lg:justify-center lg:px-0 px-4 py-3 space-x-3.5" : "px-4 py-3 space-x-3.5"}
                ${
                  isActive
                    ? "bg-white/15 border-white/20 text-white shadow-md font-bold"
                    : "text-brand-100 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-brand-100"}`} />
              <span className={`truncate flex-1 ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
              {isActive && (
                <span className={`w-2 h-2 rounded-full bg-white shrink-0 ${collapsed ? "lg:absolute lg:right-3 lg:ml-0 ml-2" : "ml-2"}`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions Anchored */}
      <div className={`space-y-2 border-t shrink-0 border-black/20 ${collapsed ? "lg:px-3 lg:py-4 p-4" : "p-4"}`}>
        {isAdminPortal && (
          <button
            onClick={() => handleNavClick("/settings")}
            title={collapsed ? "System Settings" : undefined}
            className={`w-full flex items-center rounded-xl text-base font-semibold hover:text-white transition-colors text-left ${
              collapsed ? "lg:h-12 lg:justify-center lg:px-0 px-4 py-2.5 space-x-3" : "px-4 py-2.5 space-x-3"
            } ${
              location.pathname === "/settings"
                ? "bg-white/15 text-white shadow-md"
                : "text-brand-100 hover:bg-white/10"
            }`}
          >
            <Settings className={`w-5 h-5 shrink-0 ${location.pathname === "/settings" ? "text-white" : "text-brand-100"}`} />
            <span className={collapsed ? "lg:hidden" : ""}>System Settings</span>
          </button>
        )}
        <button
          onClick={handleSignOut}
          title={collapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center rounded-xl ${isAdminPortal ? "text-base" : "text-sm"} font-semibold hover:text-white transition-colors text-left text-brand-100 hover:bg-white/10 ${
            collapsed ? "lg:h-12 lg:justify-center lg:px-0 px-4 py-2.5 space-x-3" : "px-4 py-2.5 space-x-3"
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0 text-brand-100" />
          <span className={collapsed ? "lg:hidden" : ""}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
