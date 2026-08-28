import React from "react";
import { Package } from "lucide-react";

export const PharmacyEmptyState: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs flex flex-col items-center justify-center text-center h-full min-h-[500px] space-y-4">
      {/* Package / Cube Icon Box */}
      <div className="w-20 h-20 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/80 shadow-2xs">
        <Package className="w-10 h-10 text-purple-600" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-lg font-black text-[#0f172a] tracking-tight">
          Ready for Next Patient
        </h3>
        <p className="text-xs font-semibold text-slate-500 leading-relaxed">
          Select a prescription from the queue to start the dispensing workflow.
        </p>
      </div>
    </div>
  );
};
