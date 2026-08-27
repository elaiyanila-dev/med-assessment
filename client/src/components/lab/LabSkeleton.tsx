import React from "react";

export const LabSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Metrics Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl border border-slate-200/80" />
        ))}
      </div>

      {/* Filter & Search Bar Skeleton */}
      <div className="h-14 bg-slate-100 rounded-2xl border border-slate-200/80" />

      {/* Order Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4">
        <div className="h-8 bg-slate-100 rounded-xl w-1/4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl" />
        ))}
      </div>
    </div>
  );
};
