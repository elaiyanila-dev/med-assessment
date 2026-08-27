import React from "react";
import {
  FileSpreadsheet,
  TestTube,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Send
} from "lucide-react";

interface MetricsProps {
  totalOrders: number;
  pendingCollection: number;
  inProcessing: number;
  resultsReady: number;
  criticalResults: number;
  releasedReports: number;
}

export const LabSummaryCards: React.FC<{ metrics: MetricsProps }> = ({ metrics }) => {
  const cards = [
    {
      title: "Total Requisitions",
      value: metrics.totalOrders,
      icon: FileSpreadsheet,
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      borderColor: "border-purple-200"
    },
    {
      title: "Pending Collection",
      value: metrics.pendingCollection,
      icon: TestTube,
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200"
    },
    {
      title: "In Processing",
      value: metrics.inProcessing,
      icon: Cpu,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200"
    },
    {
      title: "Results Ready",
      value: metrics.resultsReady,
      icon: CheckCircle2,
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
      borderColor: "border-indigo-200"
    },
    {
      title: "Critical Results",
      value: metrics.criticalResults,
      icon: AlertTriangle,
      bgColor: "bg-rose-50",
      textColor: "text-rose-700",
      borderColor: "border-rose-200"
    },
    {
      title: "Released Reports",
      value: metrics.releasedReports,
      icon: Send,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      borderColor: "border-emerald-200"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-2xl border ${card.borderColor} ${card.bgColor} transition-all duration-200 hover:shadow-xs`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <Icon className={`w-4 h-4 ${card.textColor}`} />
            </div>
            <div className={`text-2xl font-black mt-2 font-mono ${card.textColor}`}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};
