import React from "react";

export const PharmacySkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse p-6">
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 h-24">
            <div className="h-4 bg-slate-700 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/40">
        <div className="h-10 bg-slate-700 rounded-lg w-full md:w-64"></div>
        <div className="flex gap-2 w-full md:w-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-slate-700 rounded-lg w-20"></div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex justify-between">
          <div className="h-5 bg-slate-700 rounded w-48"></div>
          <div className="h-5 bg-slate-700 rounded w-24"></div>
        </div>
        <div className="divide-y divide-slate-700/30">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="space-y-2 w-1/3">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-700/60 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-slate-700 rounded w-1/6"></div>
              <div className="h-6 bg-slate-700 rounded w-20"></div>
              <div className="h-8 bg-slate-700 rounded w-28"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
