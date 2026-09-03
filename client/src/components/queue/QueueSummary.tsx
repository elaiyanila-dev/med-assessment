import React from "react";
import { Clock, Activity, CheckCircle2, Timer } from "lucide-react";

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
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      iconBg: "bg-orange-50"
    },
    {
      label: "IN CONSULT",
      value: summary.inConsultation,
      icon: <Activity className="h-5 w-5 text-emerald-600" />,
      iconBg: "bg-emerald-50"
    },
    {
      label: "COMPLETED",
      value: completedCount,
      icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,
      iconBg: "bg-blue-50"
    },
    {
      label: "TOTAL PATIENTS",
      value: summary.total,
      icon: <Timer className="h-5 w-5 text-violet-600" />,
      iconBg: "bg-violet-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="relative flex min-h-[96px] items-center justify-between overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <div className="text-sm font-black uppercase tracking-wide text-slate-500">
              {card.label}
            </div>
            <div className="mt-1 text-3xl font-black tracking-tight text-slate-950">
              {card.value}
            </div>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
