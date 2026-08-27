import React from "react";
import { Bed, UserCheck, CheckCircle2, Wrench } from "lucide-react";

interface IPDSummaryCardsProps {
  metrics: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    activeAdmissionsCount: number;
    occupancyPercentage: number;
  };
}

export const IPDSummaryCards: React.FC<IPDSummaryCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Beds */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Ward Beds
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {metrics.totalBeds}
          </span>
        </div>
        <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
          <Bed className="w-6 h-6" />
        </div>
      </div>

      {/* Occupied Beds */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Occupied Beds
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-600">
              {metrics.occupiedBeds}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {metrics.occupancyPercentage}% Occupancy
            </span>
          </div>
        </div>
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
          <UserCheck className="w-6 h-6" />
        </div>
      </div>

      {/* Available Beds */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Available Beds
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
            {metrics.availableBeds}
          </span>
        </div>
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* Maintenance / Cleaning */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Maintenance / Cleaning
          </span>
          <span className="text-2xl font-extrabold text-slate-700 mt-1 block">
            {metrics.maintenanceBeds}
          </span>
        </div>
        <div className="p-3 bg-slate-100 text-slate-600 rounded-xl border border-slate-200">
          <Wrench className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
