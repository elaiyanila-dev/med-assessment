import React from "react";

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" data-testid="dashboard-skeleton">
      {/* Top Banner Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
          <div className="h-7 w-64 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-lg"></div>
      </div>

      {/* 3 Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
              <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
            </div>
            <div className="h-9 w-16 bg-slate-200 rounded-lg"></div>
            <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Upcoming Appointments Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-12 bg-slate-100 rounded-lg w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
};
