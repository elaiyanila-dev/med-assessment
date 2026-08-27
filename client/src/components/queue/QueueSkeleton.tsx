import React from "react";

export const QueueSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" data-testid="queue-skeleton">
      {/* Top Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-64 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Summary Bar Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
            <div className="h-7 w-10 bg-slate-200 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Filter Bar & List Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="h-10 w-full md:w-72 bg-slate-200 rounded-xl"></div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((t) => (
              <div key={t} className="h-9 w-20 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-16 bg-slate-100 rounded-xl w-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
};
