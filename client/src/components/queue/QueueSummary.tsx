import React from "react";
import { Users, Clock, UserCheck, Play, Pause, AlertTriangle } from "lucide-react";

export interface QueueSummaryData {
  total: number;
  waiting: number;
  checkedIn: number;
  inConsultation: number;
  onHold: number;
  highPriority: number;
}

interface QueueSummaryProps {
  summary: QueueSummaryData;
}

export const QueueSummary: React.FC<QueueSummaryProps> = ({ summary }) => {
  const cards = [
    {
      label: "Total Active",
      value: summary.total,
      icon: <Users className="w-4 h-4 text-purple-600" />,
      bg: "bg-purple-50 border-purple-100"
    },
    {
      label: "Waiting",
      value: summary.waiting,
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      bg: "bg-amber-50 border-amber-100"
    },
    {
      label: "Checked In",
      value: summary.checkedIn,
      icon: <UserCheck className="w-4 h-4 text-blue-600" />,
      bg: "bg-blue-50 border-blue-100"
    },
    {
      label: "In Consultation",
      value: summary.inConsultation,
      icon: <Play className="w-4 h-4 text-emerald-600" />,
      bg: "bg-emerald-50 border-emerald-100"
    },
    {
      label: "On Hold",
      value: summary.onHold,
      icon: <Pause className="w-4 h-4 text-orange-600" />,
      bg: "bg-orange-50 border-orange-100"
    },
    {
      label: "High Priority",
      value: summary.highPriority,
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
      bg: "bg-rose-50 border-rose-100"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {card.label}
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {card.value}
            </div>
          </div>
          <div className={`p-2 rounded-lg border ${card.bg}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
