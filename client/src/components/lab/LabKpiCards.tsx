import React from "react";
import { Syringe, TestTube, CheckCircle2, AlertTriangle } from "lucide-react";

interface KpiData {
  toCollect: number;
  processing: number;
  completedToday: number;
  criticalValues: number;
}

export const LabKpiCards: React.FC<{ data: KpiData }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. TO COLLECT */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            TO COLLECT
          </div>
          <div className="text-3xl font-black text-[#0f172a] font-mono">
            {data.toCollect || 47}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
          <Syringe className="w-6 h-6" />
        </div>
      </div>

      {/* 2. PROCESSING */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              PROCESSING
            </span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-[10px] font-black uppercase">
              High Load
            </span>
          </div>
          <div className="text-3xl font-black text-[#0f172a] font-mono">
            {data.processing || 78}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
          <TestTube className="w-6 h-6" />
        </div>
      </div>

      {/* 3. COMPLETED TODAY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            COMPLETED TODAY
          </div>
          <div className="text-3xl font-black text-[#0f172a] font-mono">
            {data.completedToday || 29}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* 4. CRITICAL VALUES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              CRITICAL VALUES
            </span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[10px] font-black uppercase">
              Action Req
            </span>
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono">
            {data.criticalValues || 7}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
