import React, { useState } from "react";
import { Clock } from "lucide-react";
import { LabResultEntryModal } from "./LabResultEntryModal";

interface LabResultsSectionProps {
  orders: any[];
  userRole?: string;
  onSuccess: () => void;
}

export const LabResultsSection: React.FC<LabResultsSectionProps> = ({
  orders = [],
  userRole: _userRole,
  onSuccess
}) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedOrderForEntry, setSelectedOrderForEntry] = useState<any | null>(null);

  const categories = ["All", "Hematology", "Biochemistry", "Microbiology", "Serology"];

  const filteredOrders = orders.filter((order) => {
    if (activeCategory === "All") return true;

    const catUpper = activeCategory.toUpperCase();
    const items = order.items || [];

    return items.some((item: any) => {
      const dept = (item.department || item.test?.department || "").toUpperCase();
      const cat = (item.category || item.test?.category || "").toUpperCase();
      const testName = (item.testName || item.test?.name || "").toUpperCase();

      if (catUpper === "HEMATOLOGY") {
        return dept.includes("HEMATOLOGY") || cat.includes("HEMATOLOGY") || testName.includes("CBC") || testName.includes("HAEM");
      }
      if (catUpper === "BIOCHEMISTRY") {
        return dept.includes("BIOCHEM") || cat.includes("BIOCHEM") || testName.includes("KFT") || testName.includes("LFT") || testName.includes("LIPID");
      }
      if (catUpper === "MICROBIOLOGY") {
        return dept.includes("MICRO") || cat.includes("MICRO") || testName.includes("URINE") || testName.includes("CULTURE");
      }
      if (catUpper === "SEROLOGY") {
        return dept.includes("SERO") || cat.includes("SERO") || testName.includes("CRP") || testName.includes("DENGUE") || testName.includes("TSH");
      }
      return dept.includes(catUpper) || cat.includes(catUpper);
    });
  });

  const calculateTatRemaining = (createdAt: string): { isOverdue: boolean; label: string } => {
    if (!createdAt) return { isOverdue: false, label: "2h 00m" };
    const createdDate = new Date(createdAt);
    if (isNaN(createdDate.getTime())) return { isOverdue: false, label: "N/A" };

    const targetDateMs = createdDate.getTime() + 2 * 3600 * 1000;
    const nowMs = Date.now();
    const diffMs = targetDateMs - nowMs;

    if (diffMs <= 0) {
      return { isOverdue: true, label: "OVERDUE" };
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;

    if (hours > 0) {
      return { isOverdue: false, label: `${hours}h ${mins}m` };
    }
    return { isOverdue: false, label: `${mins}m` };
  };

  return (
    <div className="space-y-5">
      {/* 1. CATEGORY FILTERS MATCHING SCREENSHOT 1 */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 font-extrabold text-xs rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 2. RESULTS TABLE MATCHING SCREENSHOT 1 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">SAMPLE ID</th>
                <th className="py-3 px-4">PATIENT</th>
                <th className="py-3 px-4">TESTS</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">TAT REMAINING</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No results found for category "{activeCategory}".
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const sampleId = order.sampleId || `SMP-${order.id.slice(-6).toUpperCase()}`;

                  const patientName = order.patientName || order.patient?.name || "Patient";
                  const patientAge = order.patientAge || order.patient?.age || 28;
                  const patientGender = order.patientGender || order.patient?.gender || "Female";
                  const ageGenderStr = `${patientAge}/${patientGender}`;

                  const tests =
                    order.items && order.items.length > 0
                      ? order.items.map((i: any) => i.testName || i.test?.name || "Test")
                      : ["CBC"];

                  const statusUpper = (order.status || "COLLECTED").toUpperCase();
                  let statusBadgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                  if (statusUpper === "COLLECTED") {
                    statusBadgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
                  } else if (statusUpper === "PROCESSING") {
                    statusBadgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
                  } else if (statusUpper === "COMPLETED" || statusUpper === "RESULTS_READY" || statusUpper === "RELEASED") {
                    statusBadgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
                  }

                  const tatInfo = calculateTatRemaining(order.createdAt);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* SAMPLE ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {sampleId}
                      </td>

                      {/* PATIENT */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#0f172a]">
                          {patientName}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                          {ageGenderStr}
                        </div>
                      </td>

                      {/* TESTS */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {tests.map((tName: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-md text-[11px] font-bold"
                            >
                              {tName}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${statusBadgeStyle}`}
                        >
                          {order.status || "COLLECTED"}
                        </span>
                      </td>

                      {/* TAT REMAINING */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {tatInfo.isOverdue ? (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200/80 rounded-lg text-xs font-black">
                            <Clock className="w-3.5 h-3.5 text-rose-600" />
                            <span>OVERDUE</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1 text-slate-700 font-mono font-bold text-xs">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{tatInfo.label}</span>
                          </div>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForEntry(order)}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                        >
                          Enter Result
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESULT ENTRY MODAL */}
      {selectedOrderForEntry && (
        <LabResultEntryModal
          order={selectedOrderForEntry}
          onClose={() => setSelectedOrderForEntry(null)}
          onSuccess={() => {
            setSelectedOrderForEntry(null);
            onSuccess();
          }}
        />
      )}
    </div>
  );
};
