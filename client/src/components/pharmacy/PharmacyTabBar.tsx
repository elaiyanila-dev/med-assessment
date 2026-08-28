import React from "react";

export type PharmacyTabType =
  | "opd"
  | "ipd"
  | "inventory"
  | "returns"
  | "analytics";

interface TabBarProps {
  activeTab: PharmacyTabType;
  onTabChange: (tab: PharmacyTabType) => void;
  opdCount?: number;
  ipdCount?: number;
  returnsCount?: number;
}

export const PharmacyTabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  opdCount = 2,
  ipdCount = 1,
  returnsCount = 1
}) => {
  const tabs: Array<{ id: PharmacyTabType; label: string; badge?: number }> = [
    { id: "opd", label: "OPD Queue", badge: opdCount },
    { id: "ipd", label: "IPD Indents", badge: ipdCount },
    { id: "inventory", label: "Inventory Master" },
    { id: "returns", label: "Returns & Verification", badge: returnsCount },
    { id: "analytics", label: "Analytics" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex items-center space-x-1.5 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              isActive
                ? "bg-purple-50 text-purple-700 font-extrabold border border-purple-200/80 shadow-2xs"
                : "text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isActive
                    ? "bg-purple-200/80 text-purple-800"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
