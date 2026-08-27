import React from "react";
import { Calendar, Clock, UserCheck, CalendarX } from "lucide-react";

interface MetricsProps {
  metrics: {
    totalAppointmentsToday: number;
    pendingCheckIns: number;
    checkedInCount: number;
    noShowCount: number;
  };
}

export const AppointmentsSummaryCards: React.FC<MetricsProps> = ({ metrics }) => {
  const cards = [
    {
      title: "Today's Appointments",
      value: metrics.totalAppointmentsToday,
      icon: Calendar,
      color: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400"
    },
    {
      title: "Pending Check-Ins",
      value: metrics.pendingCheckIns,
      icon: Clock,
      color: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400"
    },
    {
      title: "Checked-In to Queue",
      value: metrics.checkedInCount,
      icon: UserCheck,
      color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400"
    },
    {
      title: "No-Shows / Cancelled",
      value: metrics.noShowCount,
      icon: CalendarX,
      color: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 backdrop-blur-md transition-all duration-200 hover:scale-[1.02] ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {card.title}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-100">{card.value}</h3>
              </div>
              <div className="rounded-xl p-3 bg-slate-900/40 border border-current opacity-80">
                <IconComponent className="h-6 w-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
