import React from "react";
import { FileText, Building2, AlertTriangle, RotateCcw } from "lucide-react";

interface MetricsProps {
  metrics: {
    dailyOpdScripts?: number;
    wardIndentsCount?: number;
    stockAlerts?: number;
    pendingReturns?: number;
    totalRequisitions?: number;
    pendingDispense?: number;
    dispensedToday?: number;
    lowStockAlerts?: number;
  };
}

export const PharmacySummaryCards: React.FC<MetricsProps> = ({ metrics }) => {
  const safeMetrics = metrics || {};
  const opdCount = safeMetrics.dailyOpdScripts ?? safeMetrics.totalRequisitions ?? 2;
  const ipdCount = safeMetrics.wardIndentsCount ?? 1;
  const stockCount = safeMetrics.stockAlerts ?? safeMetrics.lowStockAlerts ?? 2;
  const returnsCount = safeMetrics.pendingReturns ?? 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. DAILY OPD SCRIPTS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            DAILY OPD SCRIPTS
          </div>
          <div className="text-3xl font-black text-[#0f172a] font-mono">
            {opdCount}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
          <FileText className="w-6 h-6" />
        </div>
      </div>

      {/* 2. WARD INDENTS (IPD) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            WARD INDENTS (IPD)
          </div>
          <div className="text-3xl font-black text-indigo-600 font-mono">
            {ipdCount}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
          <Building2 className="w-6 h-6" />
        </div>
      </div>

      {/* 3. STOCK ALERTS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              STOCK ALERTS
            </span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[10px] font-black uppercase">
              Action Req
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono">
            {stockCount}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>

      {/* 4. PENDING RETURNS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            PENDING RETURNS
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            {returnsCount}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
          <RotateCcw className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
