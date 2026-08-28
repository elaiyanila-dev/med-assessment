import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { CopilotPanel } from "../copilot/CopilotPanel";
import { Sparkles } from "lucide-react";

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-row overflow-x-hidden font-sans text-slate-800 relative">
      {/* Sidebar Overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Reusable AppSidebar */}
      <AppSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Reusable AppHeader */}
        <AppHeader onMenuClick={() => setMobileOpen((prev) => !prev)} />

        {/* Dynamic Page Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI / Sparkle Circular Button */}
      {!isCopilotOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            aria-label="AI Assistant"
            onClick={() => setIsCopilotOpen(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer border border-purple-400/30 group"
          >
            <Sparkles className="w-6 h-6 text-purple-100 group-hover:rotate-12 transition-transform duration-300" />
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
