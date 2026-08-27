import React from "react";

export const DoctorStationSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" data-testid="doctor-station-skeleton">
      {/* Top Banner Header Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-64 bg-slate-200 rounded-md"></div>
        </div>
        <div className="flex space-x-3">
          <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
          <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Queue Sidebar Skeleton */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="h-6 w-32 bg-slate-200 rounded-md mb-4"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl w-full"></div>
          ))}
        </div>

        {/* Right Patient Area Skeleton */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
              <div className="h-8 w-24 bg-slate-200 rounded-full"></div>
            </div>
            <div className="h-4 w-96 bg-slate-200 rounded-md"></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 h-80"></div>
        </div>
      </div>
    </div>
  );
};
