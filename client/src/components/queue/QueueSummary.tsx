import React from "react";
import { Clock, Activity, CheckCircle2, Users } from "lucide-react";

export interface QueueSummaryData {
  total: number;
  waiting: number;
  checkedIn: number;
  inConsultation: number;
  onHold: number;
  highPriority: number;
  completed?: number;
}

interface QueueSummaryProps {
  summary: QueueSummaryData;
}

export const QueueSummary: React.FC<QueueSummaryProps> = ({ summary }) => {
  const completedCount =
    typeof summary.completed === "number"
      ? summary.completed
      : Math.max(0, summary.total - (summary.waiting + summary.inConsultation + summary.onHold));

  const cards = [
    {
      label: "WAITING",
      value: summary.waiting,
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      iconBg: "bg-amber-50 border-amber-100/80"
    },
    {
      label: "IN CONSULT",
      value: summary.inConsultation,
      icon: <Activity className="w-5 h-5 text-emerald-500" />,
      iconBg: "bg-emerald-50 border-emerald-100/80"
    },
    {
      label: "COMPLETED",
      value: completedCount,
      icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
      iconBg: "bg-blue-50 border-blue-100/80"
    },
    {
      label: "TOTAL PATIENTS",
      value: summary.total,
      icon: <Users className="w-5 h-5 text-purple-600" />,
      iconBg: "bg-purple-50 border-purple-100/80"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between relative overflow-hidden"
        >
          <div>
            <div className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              {card.label}
            </div>
            <div className="text-4xl md:text-5xl font-black text-[#0f172a] mt-1.5 tracking-tight">
              {card.value}
            </div>
          </div>
          <div className={`p-3.5 rounded-xl border flex items-center justify-center shadow-2xs ${card.iconBg}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
