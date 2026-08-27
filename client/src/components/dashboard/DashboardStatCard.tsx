import React from "react";
import { ChevronRight } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  count: number;
  secondaryInfo: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badgeVariant?: "purple" | "indigo" | "amber";
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  count,
  secondaryInfo,
  icon,
  onClick,
  badgeVariant = "purple"
}) => {
  const isClickable = !!onClick;

  const badgeStyles = {
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200"
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-xs transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:border-purple-300 hover:shadow-md group"
          : "cursor-default"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
          {title}
        </span>
        <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
          {count}
        </span>

        {isClickable && (
          <div className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyles[badgeVariant]}`}
        >
          {secondaryInfo}
        </span>
      </div>
    </div>
  );
};
