import React, { useState } from "react";
import { X, Eye, CheckCircle2, Send, Loader2, UserCheck, ShieldCheck } from "lucide-react";
import { api } from "../../services/api";

interface ModalProps {
  order: any;
  userRole?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const LabResultDetailsModal: React.FC<ModalProps> = ({
  order,
  userRole,
  onClose,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canVerify = userRole === "PATHOLOGIST" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const handleVerify = async (resultId: string, targetStatus: "REVIEWED" | "RELEASED") => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await api.post(`/laboratory/results/${resultId}/verify`, {
        status: targetStatus
      });

      if (response.data?.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(response.data?.error?.message || "Verification failed");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Failed to update verification status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <Eye className="w-4 h-4 text-purple-600" />
            <span>Laboratory Report & Results</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Header Metadata */}
          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-purple-900">{order.patientName}</div>
              <div className="text-purple-700 font-mono text-[11px]">
                UHID: {order.patientUHID} • Order #{order.id.slice(-6).toUpperCase()}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  order.status === "RELEASED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : order.status === "CRITICAL"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
                }`}
              >
                {order.status}
              </span>
              {order.sampleId && (
                <div className="text-[10px] font-mono text-purple-800 font-bold mt-1">
                  Sample ID: {order.sampleId}
                </div>
              )}
            </div>
          </div>

          {/* Results List */}
          {order.results && order.results.length > 0 ? (
            <div className="space-y-4">
              {order.results.map((res: any) => (
                <div key={res.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Test: {res.testName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      Result Status: {res.status}
                    </span>
                  </div>

                  {/* Parameters Table */}
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-100">
                        <th className="py-1.5 px-2">Parameter Name</th>
                        <th className="py-1.5 px-2">Result Value</th>
                        <th className="py-1.5 px-2">Reference Range</th>
                        <th className="py-1.5 px-2 text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const rawParams = res.parameters;
                        let paramList: any[] = [];
                        if (Array.isArray(rawParams)) {
                          paramList = rawParams;
                        } else if (rawParams && typeof rawParams === "object") {
                          paramList = Object.entries(rawParams).map(([key, val], idx) => {
                            const valStr = String(val);
                            const parts = valStr.split(" ");
                            return {
                              id: `param-${idx}`,
                              parameterName: key,
                              resultValue: parts[0] || valStr,
                              unit: parts.slice(1).join(" ") || "",
                              referenceRange: "Normal Range",
                              abnormalFlag: false
                            };
                          });
                        }
                        return paramList.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-2 font-medium text-slate-700">{p.parameterName}</td>
                            <td className="py-2 px-2 font-mono font-bold text-slate-900">
                              {p.resultValue} {p.unit}
                            </td>
                            <td className="py-2 px-2 text-slate-500">{p.referenceRange}</td>
                            <td className="py-2 px-2 text-right">
                              {p.abnormalFlag ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700">
                                  ABNORMAL
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600">
                                  NORMAL
                                </span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>

                  {/* Signatures */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Entered by: {res.enteredBy}</span>
                    </div>

                    {res.reviewedBy && (
                      <div className="flex items-center space-x-1 text-emerald-700 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified by: {res.reviewedBy}</span>
                      </div>
                    )}
                  </div>

                  {/* Pathologist Action Buttons */}
                  {canVerify && res.status !== "RELEASED" && (
                    <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                      {res.status === "ENTERED" && (
                        <button
                          onClick={() => handleVerify(res.id, "REVIEWED")}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Mark Reviewed</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleVerify(res.id, "RELEASED")}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Release Final Report</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No detailed test parameters recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
