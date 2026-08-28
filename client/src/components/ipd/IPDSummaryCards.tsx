import React from "react";
import { Activity, Bed, Clock, IndianRupee } from "lucide-react";

interface IPDSummaryCardsProps {
  metrics: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    activeAdmissionsCount: number;
    occupancyPercentage: number;
    avgStayDays?: number | string;
    dailyEstRev?: number | string;
  };
}

export const IPDSummaryCards: React.FC<IPDSummaryCardsProps> = ({ metrics }) => {
  const occupancyVal = metrics.occupancyPercentage ? `${metrics.occupancyPercentage}%` : "20%";
  const availableVal = metrics.availableBeds !== undefined ? metrics.availableBeds : 6;
  const avgStayVal = metrics.avgStayDays !== undefined ? `${metrics.avgStayDays} Days` : "0 Days";
  const revVal = metrics.dailyEstRev !== undefined ? `₹${metrics.dailyEstRev}` : "₹0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. OCCUPANCY */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            OCCUPANCY
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight">
              {occupancyVal}
            </span>
            <span className="text-xs font-bold text-slate-400">
              Capacity
            </span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs">
          <Activity className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* 2. AVAILABLE */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            AVAILABLE
          </span>
          <span className="text-2xl md:text-3xl font-black text-emerald-600 tracking-tight block">
            {availableVal}
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
          <Bed className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* 3. AVG STAY */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            AVG STAY
          </span>
          <span className="text-2xl md:text-3xl font-black text-amber-600 tracking-tight block">
            {avgStayVal}
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
          <Clock className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* 4. DAILY EST. REV */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            DAILY EST. REV
          </span>
          <span className="text-2xl md:text-3xl font-black text-[#0f172a] tracking-tight block">
            {revVal}
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
          <IndianRupee className="w-5.5 h-5.5" />
        </div>
      </div>
    </div>
  );
};

export default IPDSummaryCards;
