import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getNavItemsForRole } from "../../config/navigation";
import { Activity } from "lucide-react";

interface AppSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = getNavItemsForRole(user?.role);

  const handleNavClick = (path: string) => {
    navigate(path);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#2b1055] text-white flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-purple-900/60 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Activity className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              MedNxt
            </h1>
            <p className="text-[11px] font-medium text-purple-300/80 tracking-wide uppercase">
              Hospitals
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`
                w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left
                ${
                  isActive
                    ? "bg-purple-800/90 text-white shadow-md border-l-4 border-purple-300 font-semibold"
                    : "text-purple-200/80 hover:text-white hover:bg-purple-900/50"
                }
              `}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-purple-300/80"}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-purple-900/60 text-xs text-purple-300/60 text-center shrink-0">
        MedNxt HMS v1.0 • Enterprise
      </div>
    </aside>
  );
};
