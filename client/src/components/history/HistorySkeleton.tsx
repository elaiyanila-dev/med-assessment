import React from "react";

export const HistorySkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" data-testid="history-skeleton">
      {/* Search Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="h-10 w-96 bg-slate-200 rounded-xl"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Patient Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
        <div className="h-4 w-96 bg-slate-200 rounded-md"></div>
      </div>

      {/* Timeline Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="h-6 w-48 bg-slate-200 rounded-md mb-4"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl w-full"></div>
        ))}
      </div>
    </div>
  );
};
