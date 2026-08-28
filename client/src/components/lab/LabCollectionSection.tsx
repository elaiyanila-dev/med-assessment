import React, { useState } from "react";
import { QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../../services/api";

interface LabCollectionSectionProps {
  orders: any[];
  onSuccess: () => void;
}

export const LabCollectionSection: React.FC<LabCollectionSectionProps> = ({
  orders = [],
  onSuccess
}) => {
  const [scanInput, setScanInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Pending Collection Queue contains orders needing sample collection (e.g. ORDERED or PENDING_COLLECTION)
  const pendingOrders = orders.filter((o) => {
    const st = (o.status || "").toUpperCase();
    return st === "ORDERED" || st === "PENDING_COLLECTION" || st === "PENDING";
  });

  // Sort STAT orders first
  const sortedPendingOrders = [...pendingOrders].sort((a, b) => {
    const aStat = a.priority === "STAT" ? 1 : 0;
    const bStat = b.priority === "STAT" ? 1 : 0;
    return bStat - aStat;
  });

  const totalPendingCount = pendingOrders.length;
  const statPendingCount = pendingOrders.filter((o) => o.priority === "STAT").length;

  const handleCollectOrder = async (orderIdToCollect: string) => {
    if (!orderIdToCollect.trim()) return;
    setIsSubmitting(true);
    setAlertMsg(null);

    try {
      const response = await api.post(`/laboratory/orders/${orderIdToCollect.trim()}/collect`, {
        orderId: orderIdToCollect.trim()
      });

      if (response.data?.success) {
        setAlertMsg({
          type: "success",
          text: `Sample collected successfully for Order #${orderIdToCollect.trim()}`
        });
        setScanInput("");
        onSuccess();
      } else {
        throw new Error(response.data?.error?.message || "Failed to collect sample");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to collect sample";
      setAlertMsg({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) {
      setAlertMsg({ type: "error", text: "Please enter an Order ID or Barcode" });
      return;
    }
    handleCollectOrder(scanInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* 1. RAPID ACCESSION SECTION MATCHING SCREENSHOT 1 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
        <div className="text-xs font-black text-[#0f172a] uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
          <QrCode className="w-4 h-4 text-purple-600" />
          <span>RAPID ACCESSION (SCAN BARCODE/ORDER ID)</span>
        </div>

        {alertMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-fadeIn ${
              alertMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              {alertMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{alertMsg.text}</span>
            </div>
            <button
              onClick={() => setAlertMsg(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-black"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Scan Form */}
          <form onSubmit={handleScanSubmit} className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <QrCode className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan Order Barcode or Type ID..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50/50 font-mono font-bold text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isSubmitting ? "Processing..." : "Collect"}
            </button>
          </form>

          {/* Right Metrics Badges */}
          <div className="flex items-center space-x-6 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6 shrink-0 justify-around sm:justify-start">
            <div className="text-center sm:text-right">
              <div className="text-2xl font-black text-amber-600 tracking-tight">
                {totalPendingCount}
              </div>
              <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">
                PENDING
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                {statPendingCount}
              </div>
              <div className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider">
                STAT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PENDING COLLECTION QUEUE TABLE MATCHING SCREENSHOT 1 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4">
        <div className="text-xs font-black text-[#0f172a] uppercase tracking-wider border-b border-slate-100 pb-3">
          Pending Collection Queue
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">PRIORITY</th>
                <th className="py-3 px-4">ORDER ID</th>
                <th className="py-3 px-4">PATIENT</th>
                <th className="py-3 px-4">TESTS</th>
                <th className="py-3 px-4">ORDER TIME</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {sortedPendingOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No pending orders awaiting sample collection.
                  </td>
                </tr>
              ) : (
                sortedPendingOrders.map((order) => {
                  const tests =
                    order.items && order.items.length > 0
                      ? order.items.map((i: any) => i.testName || i.test?.name || "Test")
                      : ["CBC"];

                  const isStat = order.priority === "STAT";

                  const timeStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })
                    : "N/A";

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        {isStat ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-700 border border-rose-200 font-black text-[10px] rounded-full uppercase tracking-wider shadow-2xs">
                            STAT
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[10px] rounded-full uppercase tracking-wider">
                            ROUTINE
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {order.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-[#0f172a]">
                          {order.patientName || order.patient?.name || "Patient"}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 mt-0.5 font-mono">
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
                      <td className="py-3.5 px-4 font-semibold text-slate-600 whitespace-nowrap">
                        {timeStr}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCollectOrder(order.id)}
                          disabled={isSubmitting}
                          className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
                        >
                          Collect
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
    </div>
  );
};
