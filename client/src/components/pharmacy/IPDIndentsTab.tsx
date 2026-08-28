import React, { useState } from "react";
import { BedDouble, Check, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "../../services/api";

interface IPDIndentsTabProps {
  indents: any[];
  onSuccess?: () => void;
}

export const IPDIndentsTab: React.FC<IPDIndentsTabProps> = ({
  indents = [],
  onSuccess
}) => {
  const safeIndents = Array.isArray(indents) ? indents : [];
  const pendingIndents = safeIndents.filter((i) => (i.status || "").toUpperCase() !== "FULFILLED");

  const statCount = pendingIndents.filter((i) => i.priority === "STAT").length;

  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFulfillIndent = async (indentId: string) => {
    setFulfillingId(indentId);
    setToastMsg(null);

    try {
      const response = await api.post(`/pharmacy/indents/${indentId}/fulfill`, {});
      if (response.data?.success) {
        setToastMsg({
          type: "success",
          text: response.data?.message || `Indent ${indentId} fulfilled successfully.`
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.data?.error?.message || "Failed to fulfill indent");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to fulfill indent";
      setToastMsg({ type: "error", text: msg });
    } finally {
      setFulfillingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER MATCHING SCREENSHOT 1 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200/80">
            <BedDouble className="w-4 h-4 text-purple-700" />
          </div>
          <h2 className="text-sm font-black text-[#0f172a] uppercase tracking-wider flex items-center">
            <span>Ward Indent Requests</span>
            <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200/80">
              {statCount} STAT
            </span>
          </h2>
        </div>
      </div>

      {toastMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between animate-fadeIn ${
            toastMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            {toastMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-black"
          >
            ×
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {pendingIndents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-2">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-extrabold text-[#0f172a]">No pending ward indents</h3>
          <p className="text-xs font-semibold text-slate-400">All current IPD indent requests have been fulfilled.</p>
        </div>
      ) : (
        /* INDENT CARDS GRID MATCHING SCREENSHOT 1 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pendingIndents.map((indent) => {
            const isStat = indent.priority === "STAT";
            const patientName = indent.patientName || "Patient";
            const wardStr = indent.ward || "General Ward";
            const bedStr = indent.bedNumber || "G-101";

            const itemsList = indent.items && indent.items.length > 0 ? indent.items : [
              { medicineName: "Pan 40", quantity: 3, dosage: "1-0-0", location: "Loc: R1-S4" }
            ];

            const isFulfillingThis = fulfillingId === indent.id;

            return (
              <div
                key={indent.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-200 transition-colors"
              >
                {/* CARD HEADER */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#0f172a] tracking-tight">
                      {patientName}
                    </h3>
                    {isStat && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 font-black text-[10px] rounded uppercase tracking-wider">
                        STAT
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-slate-500 flex items-center space-x-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{wardStr} • Bed {bedStr}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-3 flex-1">
                  {itemsList.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between font-extrabold text-xs text-[#0f172a]">
                        <span>{item.medicineName || "Medication"}</span>
                        <span className="font-mono text-purple-700 font-black">
                          x{item.quantity || 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                        <span>{item.dosage || "1-0-0"}</span>
                        <span className="font-mono text-slate-500 font-bold">{item.location || "Loc: Main Stock"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CARD FOOTER ACTION */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleFulfillIndent(indent.id)}
                    disabled={isFulfillingThis}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {isFulfillingThis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Fulfilling...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Fulfill Indent</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
