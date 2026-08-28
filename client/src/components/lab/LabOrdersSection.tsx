import React, { useState } from "react";
import { Search } from "lucide-react";
import { LabOrderDetailsModal } from "./LabOrderDetailsModal";

interface LabOrdersSectionProps {
  orders: any[];
  onViewDetails?: (order: any) => void;
}

export const LabOrdersSection: React.FC<LabOrdersSectionProps> = ({
  orders = [],
  onViewDetails
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any | null>(null);

  const handleOpenDetails = (order: any) => {
    setSelectedOrderForModal(order);
    if (onViewDetails) {
      onViewDetails(order);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const orderId = (order.id || "").toLowerCase();
    const patientName = (order.patientName || order.patient?.name || "").toLowerCase();
    const uhid = (order.patientUHID || order.patient?.uhid || order.patientId || "").toLowerCase();
    const testNames = (order.items || []).map((i: any) => (i.testName || i.test?.name || "").toLowerCase()).join(" ");

    return (
      orderId.includes(q) ||
      patientName.includes(q) ||
      uhid.includes(q) ||
      testNames.includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Orders..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50/50"
          />
        </div>

        <div className="text-xs font-extrabold text-slate-500 shrink-0">
          {orders.length} Total Orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">ORDER ID</th>
              <th className="py-3 px-4">PATIENT</th>
              <th className="py-3 px-4">TESTS</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">ORDER TIME</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">
                  No orders match your search criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const tests = order.items && order.items.length > 0
                  ? order.items.map((i: any) => i.testName || i.test?.name || "Test")
                  : ["CBC"];

                const orderTimeStr = order.createdAt
                  ? new Date(order.createdAt).toLocaleString("en-US", {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true
                    })
                  : "N/A";

                const isStat = order.priority === "STAT";

                let statusBadgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                const statusUpper = (order.status || "").toUpperCase();
                if (statusUpper === "COLLECTED") {
                  statusBadgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
                } else if (statusUpper === "ORDERED") {
                  statusBadgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
                } else if (statusUpper === "PROCESSING") {
                  statusBadgeStyle = "bg-purple-50 text-purple-700 border-purple-200/80";
                } else if (statusUpper === "COMPLETED" || statusUpper === "RESULTS_READY") {
                  statusBadgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
                } else if (statusUpper === "RELEASED") {
                  statusBadgeStyle = "bg-green-50 text-green-700 border-green-200/80";
                }

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <div>{order.id}</div>
                      {isStat && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 font-extrabold text-[10px] rounded border border-rose-200">
                          STAT
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#0f172a]">
                        {order.patientName || order.patient?.name || "Patient"}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        {order.patientUHID || order.patient?.uhid || "ABHA-5678"}
                      </div>
                    </td>
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
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${statusBadgeStyle}`}
                      >
                        {order.status || "ORDERED"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600 whitespace-nowrap">
                      {orderTimeStr}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(order)}
                        className="text-purple-600 hover:text-purple-800 font-extrabold text-xs cursor-pointer hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Large Centered Order Details Modal */}
      {selectedOrderForModal && (
        <LabOrderDetailsModal
          order={selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
        />
      )}
    </div>
  );
};
