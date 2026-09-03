import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Bell, ChevronDown, Building2, LogOut, Menu } from "lucide-react";

interface AppHeaderProps {
  onMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick, isSidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const isClinicalRole = user?.role === "DOCTOR";

  const displayName = user?.name
    ? isClinicalRole && !user.name.startsWith("Dr.")
      ? `Dr. ${user.name}`
      : user.name
    : isClinicalRole
      ? "Dr. Rohan Sharma"
      : "Admin User";

  const doctorInitial = user?.name
    ? user.name.replace(/^Dr\.\s*/i, "").charAt(0).toUpperCase() || "D"
    : "D";

  const formattedRole = user?.role
    ? user.role.replace(/_/g, " ")
    : "DOCTOR";

  return (
    <header className="h-[72px] bg-white border-b border-slate-200/80 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Menu Toggle & Hospital Selector Pill */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl border border-brand-100 text-slate-600 hover:text-brand-700 hover:bg-brand-50 focus:outline-none transition-colors shadow-2xs"
          aria-label={isSidebarCollapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
          aria-pressed={!isSidebarCollapsed}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Rounded Hospital Selector Pill */}
        <div className="flex items-center space-x-2.5 px-4 py-2 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/80 rounded-full text-slate-800 font-bold text-sm transition-colors cursor-pointer shadow-2xs">
          <Building2 className="w-4 h-4 text-brand-700" />
          <span>MedNxt Hospitals</span>
        </div>
      </div>

      {/* Right: Operational Status, Notification Bell, Divider, Doctor Info Dropdown */}
      <div className="flex items-center space-x-4 md:space-x-5">
        {/* System Operational Indicator */}
        <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 bg-brand-50 border border-brand-200 rounded-full text-xs font-bold text-brand-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
          </span>
          <span>SYSTEM OPERATIONAL</span>
        </div>

        {/* Notification Bell Icon */}
        <div className="relative">
          <button
            type="button"
            className="p-2 text-slate-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors relative focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-600 rounded-full ring-2 ring-white"></span>
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-200"></div>

        {/* Doctor Profile Header Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center space-x-3 p-1 rounded-xl hover:bg-slate-100/80 transition-colors focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-brand-100 border border-brand-200 text-brand-700 font-bold text-sm flex items-center justify-center shadow-xs">
              {doctorInitial}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] font-bold text-slate-400 leading-tight tracking-wider uppercase mt-0.5">
                {formattedRole}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
