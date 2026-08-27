import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Plus, Check, Loader2 } from "lucide-react";
import { api } from "../../services/api";

interface LabTestItem {
  id: string;
  code: string;
  name: string;
  department: string;
  specimen: string;
  price: number;
}

interface LabOrderSectionProps {
  consultationId: string;
  existingLabOrders?: any[];
  onLabOrderCreated: (order: any) => void;
}

export const LabOrderSection: React.FC<LabOrderSectionProps> = ({
  consultationId,
  existingLabOrders = [],
  onLabOrderCreated
}) => {
  const [availableTests, setAvailableTests] = useState<LabTestItem[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<"ROUTINE" | "STAT">("ROUTINE");

  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      setIsLoadingTests(true);
      try {
        const response = await api.get("/consultations/lab-tests");
        if (response.data?.success) {
          setAvailableTests(response.data.data);
        }
      } catch {
        setErrorMsg("Failed to load lab tests catalog");
      } finally {
        setIsLoadingTests(false);
      }
    };
    fetchTests();
  }, []);

  const toggleTestSelection = (testId: string) => {
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds(selectedTestIds.filter((id) => id !== testId));
    } else {
      setSelectedTestIds([...selectedTestIds, testId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestIds.length === 0) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        testIds: selectedTestIds,
        priority
      };

      const response = await api.post(`/consultations/${consultationId}/lab-orders`, payload);
      if (response.data?.success) {
        setSuccessMsg("Lab order placed successfully!");
        setSelectedTestIds([]);
        onLabOrderCreated(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to place lab order");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Error placing lab order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
          <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          <span>Requisition Laboratory Tests</span>
        </div>
        {successMsg && (
          <span className="text-xs font-bold text-emerald-600 flex items-center">
            <Check className="w-3.5 h-3.5 mr-1" /> {successMsg}
          </span>
        )}
        {errorMsg && <span className="text-xs font-bold text-rose-600">{errorMsg}</span>}
      </div>

      {isLoadingTests ? (
        <div className="py-6 text-center text-xs text-slate-400">
          <Loader2 className="w-5 h-5 mx-auto animate-spin mb-1 text-purple-600" />
          <span>Loading active lab test catalog...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Priority & Selected Count */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Order Priority:</span>
              <button
                type="button"
                onClick={() => setPriority("ROUTINE")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  priority === "ROUTINE"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                Routine
              </button>
              <button
                type="button"
                onClick={() => setPriority("STAT")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  priority === "STAT"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                STAT / Urgent
              </button>
            </div>

            <div className="text-xs font-semibold text-purple-700">
              {selectedTestIds.length} test(s) selected
            </div>
          </div>

          {/* Available Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {availableTests.map((t) => {
              const isSelected = selectedTestIds.includes(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggleTestSelection(t.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-purple-50 border-purple-300 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs text-slate-800">{t.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {t.code} • ₹{t.price}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || selectedTestIds.length === 0}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Order Lab Tests ({selectedTestIds.length})</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Existing Lab Orders for this Consultation / Patient */}
      {existingLabOrders.length > 0 && (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Requisitioned Lab Orders
          </h5>
          <div className="space-y-2">
            {existingLabOrders.map((order) => {
              const hasResults = order.results && order.results.length > 0;
              return (
                <div
                  key={order.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 flex items-center space-x-2">
                        <span>Order #{order.id.slice(-6).toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                          {order.priority}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tests: {order.items?.map((i: any) => i.test?.name || "Test").join(", ")}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        order.status === "RELEASED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : order.status === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : order.status === "RESULT_READY"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Render Results & Parameter Breakdown */}
                  {hasResults && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-2 bg-white p-2.5 rounded-lg border border-slate-100">
                      <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                        Laboratory Results & Parameters
                      </div>
                      {order.results.map((resItem: any) => (
                        <div key={resItem.id} className="space-y-1">
                          {resItem.parameters?.map((param: any) => (
                            <div
                              key={param.id}
                              className="flex items-center justify-between text-[11px] py-0.5 px-1 rounded hover:bg-slate-50"
                            >
                              <span className="text-slate-600 font-medium">{param.parameterName}</span>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`font-bold font-mono ${
                                    param.abnormalFlag ? "text-rose-600" : "text-slate-800"
                                  }`}
                                >
                                  {param.resultValue} {param.unit}
                                </span>
                                <span className="text-slate-400 text-[10px]">({param.referenceRange})</span>
                                {param.abnormalFlag && (
                                  <span className="px-1 py-0.2 text-[9px] font-bold bg-rose-100 text-rose-700 rounded">
                                    HIGH
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
