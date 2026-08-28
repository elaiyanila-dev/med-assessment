import React, { useState } from "react";
import { RotateCcw, Check, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "../../services/api";

interface ReturnsTabProps {
  returns: any[];
  onSuccess?: () => void;
}

export const ReturnsTab: React.FC<ReturnsTabProps> = ({
  returns = [],
  onSuccess
}) => {
  const safeReturns = Array.isArray(returns) ? returns : [];
  const pendingRequests = safeReturns.filter(
    (r) => (r.status || "").toUpperCase() === "PENDING" || (r.status || "").toUpperCase() === "PENDING_VERIFICATION"
  );

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleProcessRequest = async (returnId: string, action: "restock" | "dispose" | "reject") => {
    setProcessingId(returnId);
    setToastMsg(null);

    try {
      const response = await api.post(`/pharmacy/returns/${returnId}/process`, { action });
      if (response.data?.success) {
        setToastMsg({
          type: "success",
          text: response.data?.message || "Request processed successfully."
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error(response.data?.error?.message || "Failed to process return request");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to process request";
      setToastMsg({ type: "error", text: msg });
    } finally {
      setProcessingId(null);
      setRejectingRequest(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER MATCHING SCREENSHOT 1 */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200/80">
            <RotateCcw className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">
              Pending Return/Waste Requests
            </h2>
            <div className="text-xs font-semibold text-slate-400 mt-0.5">
              Review ward medication returns and pharmacy waste logs for restocking or disposal.
            </div>
          </div>
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
      {pendingRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-2">
          <RotateCcw className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-extrabold text-[#0f172a]">No Pending Return/Waste Requests</h3>
          <p className="text-xs font-semibold text-slate-400">All return and waste requests have been processed.</p>
        </div>
      ) : (
        /* PENDING REQUEST ROWS MATCHING SCREENSHOT 1 */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {/* HEADER ROW */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/80 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-200/80">
            <div className="col-span-3">SOURCE</div>
            <div className="col-span-3">MEDICINE & QTY</div>
            <div className="col-span-3">REASON</div>
            <div className="col-span-1">TYPE</div>
            <div className="col-span-2 text-right">ACTIONS</div>
          </div>

          {/* REQUEST ROWS */}
          {pendingRequests.map((req) => {
            const isWaste = (req.type || "").toUpperCase() === "WASTE";
            const sourceStr = req.source || req.location || (req.ward ? `${req.ward} - Bed ${req.bedNumber || "1"}` : "Ward");
            const medName = req.medicineName || "Medication";
            const qty = req.quantity || 1;
            const reasonStr = req.reason || "Unused Medication";
            const isProcessingThis = processingId === req.id;

            return (
              <div
                key={req.id}
                className="p-5 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-slate-50/60 transition-colors space-y-3 md:space-y-0"
              >
                {/* SOURCE */}
                <div className="col-span-3">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase md:hidden mb-0.5">SOURCE</div>
                  <div className="text-xs font-black text-[#0f172a] tracking-tight">
                    {sourceStr}
                  </div>
                </div>

                {/* MEDICINE & QTY */}
                <div className="col-span-3">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase md:hidden mb-0.5">MEDICINE & QTY</div>
                  <div className="text-xs font-black text-[#0f172a]">
                    {medName}
                  </div>
                  <div className="text-xs font-mono font-bold text-purple-700">
                    Qty: {qty}
                  </div>
                </div>

                {/* REASON */}
                <div className="col-span-3">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase md:hidden mb-0.5">REASON</div>
                  <div className="text-xs font-semibold text-slate-600">
                    {reasonStr}
                  </div>
                </div>

                {/* TYPE BADGE */}
                <div className="col-span-1">
                  <div className="text-[11px] font-extrabold text-slate-400 uppercase md:hidden mb-0.5">TYPE</div>
                  {isWaste ? (
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-black uppercase tracking-wider inline-block">
                      WASTE
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-black uppercase tracking-wider inline-block">
                      RETURN
                    </span>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="col-span-2 flex items-center justify-start md:justify-end space-x-2 pt-2 md:pt-0">
                  <button
                    type="button"
                    onClick={() => setRejectingRequest(req)}
                    disabled={isProcessingThis}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200/80 rounded-xl text-xs font-extrabold cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                  >
                    Discard/Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProcessRequest(req.id, isWaste ? "dispose" : "restock")}
                    disabled={isProcessingThis}
                    className="px-3.5 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-xs transition-colors shrink-0 flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isProcessingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>{isWaste ? "Verify & Dispose" : "Verify & Restock"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DISCARD/REJECT */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-sm w-full p-6 space-y-4 my-auto select-none">
            <div className="space-y-1">
              <h3 className="text-base font-black text-[#0f172a]">Reject this return request?</h3>
              <p className="text-xs font-semibold text-slate-500">
                This request will be marked as rejected and removed from pending requests without restocking inventory.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-bold text-slate-700 space-y-1 font-mono">
              <div>Source: {rejectingRequest.source}</div>
              <div>Medicine: {rejectingRequest.medicineName} (Qty: {rejectingRequest.quantity})</div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleProcessRequest(rejectingRequest.id, "reject")}
                disabled={processingId === rejectingRequest.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center space-x-1 disabled:opacity-50"
              >
                {processingId === rejectingRequest.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Reject Request</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
