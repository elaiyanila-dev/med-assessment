import React from "react";
import { Users, UserCheck, Stethoscope, UserCog, UserX } from "lucide-react";
import { UserSummaryMetrics } from "../../services/userService";

interface UserSummaryCardsProps {
  metrics: UserSummaryMetrics;
}

export const UserSummaryCards: React.FC<UserSummaryCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: "Total Staff",
      value: metrics.totalStaff,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Active Staff",
      value: metrics.activeStaff,
      icon: UserCheck,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Doctors",
      value: metrics.doctorsCount,
      icon: Stethoscope,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10 border-cyan-500/20"
    },
    {
      title: "Nurses",
      value: metrics.nursesCount,
      icon: UserCog,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Inactive / Suspended",
      value: metrics.inactiveOrSuspendedCount,
      icon: UserX,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`p-4 rounded-xl border backdrop-blur-md transition-all hover:scale-[1.02] ${card.bgColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">{card.title}</p>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">{card.value}</h3>
              </div>
              <div className={`p-2.5 rounded-lg bg-slate-900/40 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
