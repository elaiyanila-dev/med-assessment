import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { CopilotPanel } from "../copilot/CopilotPanel";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const isAdminPortal = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed((prev) => !prev);
      return;
    }

    setMobileOpen((prev) => !prev);
  };

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-row overflow-hidden font-sans text-slate-800 relative">
      {/* Sidebar Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Reusable AppSidebar */}
      <AppSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={sidebarCollapsed}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Reusable AppHeader */}
        <AppHeader
          onMenuClick={handleMenuClick}
          isSidebarCollapsed={sidebarCollapsed}
        />

        {/* Dynamic Page Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#f8fafc]">
          <div className="w-full h-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI / Sparkle Circular Button */}
      {!isCopilotOpen && (
        <div className={`fixed z-40 ${isAdminPortal ? "bottom-5 right-5" : "bottom-6 right-6"}`}>
          <button
            type="button"
            aria-label="AI Assistant"
            onClick={() => setIsCopilotOpen(true)}
            className={`${isAdminPortal ? "h-10 w-10" : "h-12 w-12"} rounded-full bg-brand-700 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer border border-brand-200 group`}
          >
            <Sparkles className={`${isAdminPortal ? "h-5 w-5" : "h-6 w-6"} text-brand-100 group-hover:rotate-12 transition-transform duration-300`} />
          </button>
        </div>
      )}

      {/* MedNxt Co-pilot Agent Panel */}
      <CopilotPanel
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};
