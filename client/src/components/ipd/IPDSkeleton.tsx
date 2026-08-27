import React from "react";

export const IPDSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" data-testid="ipd-skeleton">
      {/* Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="h-10 w-64 bg-slate-200 rounded-xl"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>
        ))}
      </div>

      {/* Bed Grid & Wards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl"></div>
        <div className="lg:col-span-1 h-72 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  );
};
