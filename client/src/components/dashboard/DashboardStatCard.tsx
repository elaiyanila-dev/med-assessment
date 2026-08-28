import React from "react";
import { ChevronRight } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  count: number;
  secondaryInfo: string;
  icon: React.ReactNode;
  onClick?: () => void;
  iconGradient?: string;
  badgeStyle?: string;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  count,
  secondaryInfo,
  icon,
  onClick,
  iconGradient = "bg-gradient-to-br from-indigo-500 to-purple-600",
  badgeStyle = "bg-purple-50 text-purple-700 border-purple-200"
}) => {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-[228px] flex flex-col justify-between relative overflow-hidden transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:border-purple-300 hover:shadow-md group"
          : "cursor-default"
      }`}
    >
      {/* Decorative background shape */}
      <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-purple-50/40 rounded-full pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        <div className={`p-3 text-white rounded-xl shadow-xs flex items-center justify-center ${iconGradient}`}>
          {icon}
        </div>
      </div>

      <div className="my-auto relative z-10 flex items-baseline justify-between">
        <span className="text-5xl font-black text-[#0f172a] tracking-tight">
          {count}
        </span>

        {isClickable && (
          <div className="text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all">
            <ChevronRight className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="relative z-10">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}
        >
          {secondaryInfo}
        </span>
      </div>
    </div>
  );
};
