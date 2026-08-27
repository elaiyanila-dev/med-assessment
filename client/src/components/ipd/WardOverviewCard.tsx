import React from "react";
import { Building2 } from "lucide-react";

export interface WardMetric {
  ward: string;
  wardCode: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
}

interface WardOverviewCardProps {
  wards: WardMetric[];
  selectedWard?: string | null;
  onSelectWard?: (ward: string | null) => void;
}

export const WardOverviewCard: React.FC<WardOverviewCardProps> = ({
  wards,
  selectedWard,
  onSelectWard
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <Building2 className="w-5 h-5 text-purple-600" />
          <h3 className="font-extrabold text-base text-slate-800">Ward Overview</h3>
        </div>
        {selectedWard && (
          <button
            type="button"
            onClick={() => onSelectWard?.(null)}
            className="text-xs text-purple-700 font-bold hover:underline cursor-pointer"
          >
            Show All Wards
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {wards.map((w) => {
          const isSelected = selectedWard === w.ward;
          const occRate = w.totalBeds > 0 ? Math.round((w.occupiedBeds / w.totalBeds) * 100) : 0;

          return (
            <div
              key={w.ward}
              onClick={() => onSelectWard?.(isSelected ? null : w.ward)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-purple-50 border-purple-500 shadow-xs"
                  : "bg-slate-50/70 hover:bg-slate-100/80 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900">{w.ward}</span>
                <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  {w.wardCode}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Occupied: <strong className="text-amber-600">{w.occupiedBeds}</strong></span>
                <span>Available: <strong className="text-emerald-600">{w.availableBeds}</strong></span>
                <span>Total: <strong>{w.totalBeds}</strong></span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${occRate}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
