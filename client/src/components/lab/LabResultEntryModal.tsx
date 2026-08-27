import React, { useState } from "react";
import { X, FileEdit, Plus, Trash2, Loader2, Check } from "lucide-react";
import { api } from "../../services/api";

interface ParameterRow {
  parameterName: string;
  resultValue: string;
  unit: string;
  referenceRange: string;
  abnormalFlag: boolean;
}

interface TestResultGroup {
  testId: string;
  testName: string;
  parameters: ParameterRow[];
  isCritical: boolean;
}

interface ModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const LabResultEntryModal: React.FC<ModalProps> = ({
  order,
  onClose,
  onSuccess
}) => {
  // Pre-populate parameter forms based on requested tests
  const initialTestGroups: TestResultGroup[] = order.items.map((item: any) => {
    let defaultParams: ParameterRow[] = [];
    const nameUpper = item.testName.toUpperCase();

    if (nameUpper.includes("CBC") || nameUpper.includes("HAEMOGRAM")) {
      defaultParams = [
        { parameterName: "Hemoglobin", resultValue: "14.2", unit: "g/dL", referenceRange: "13.0 - 17.0", abnormalFlag: false },
        { parameterName: "Total Leukocyte Count (TLC)", resultValue: "7,500", unit: "/cumm", referenceRange: "4,000 - 11,000", abnormalFlag: false },
        { parameterName: "Platelet Count", resultValue: "250,000", unit: "/cumm", referenceRange: "150,000 - 450,000", abnormalFlag: false }
      ];
    } else if (nameUpper.includes("CRP") || nameUpper.includes("C-REACTIVE")) {
      defaultParams = [
        { parameterName: "C-Reactive Protein (CRP)", resultValue: "18.5", unit: "mg/L", referenceRange: "< 6.0", abnormalFlag: true }
      ];
    } else if (nameUpper.includes("LIPID")) {
      defaultParams = [
        { parameterName: "Total Cholesterol", resultValue: "210", unit: "mg/dL", referenceRange: "< 200", abnormalFlag: true },
        { parameterName: "Triglycerides", resultValue: "160", unit: "mg/dL", referenceRange: "< 150", abnormalFlag: true }
      ];
    } else {
      defaultParams = [
        { parameterName: `${item.testName} Value`, resultValue: "100", unit: "mg/dL", referenceRange: "70 - 110", abnormalFlag: false }
      ];
    }

    return {
      testId: item.testId,
      testName: item.testName,
      parameters: defaultParams,
      isCritical: false
    };
  });

  const [testGroups, setTestGroups] = useState<TestResultGroup[]>(initialTestGroups);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleParamChange = (
    groupIndex: number,
    paramIndex: number,
    field: keyof ParameterRow,
    value: any
  ) => {
    const newGroups = [...testGroups];
    newGroups[groupIndex].parameters[paramIndex] = {
      ...newGroups[groupIndex].parameters[paramIndex],
      [field]: value
    };
    setTestGroups(newGroups);
  };

  const addParamRow = (groupIndex: number) => {
    const newGroups = [...testGroups];
    newGroups[groupIndex].parameters.push({
      parameterName: "",
      resultValue: "",
      unit: "mg/dL",
      referenceRange: "Normal",
      abnormalFlag: false
    });
    setTestGroups(newGroups);
  };

  const removeParamRow = (groupIndex: number, paramIndex: number) => {
    const newGroups = [...testGroups];
    if (newGroups[groupIndex].parameters.length > 1) {
      newGroups[groupIndex].parameters.splice(paramIndex, 1);
      setTestGroups(newGroups);
    }
  };

  const toggleCritical = (groupIndex: number) => {
    const newGroups = [...testGroups];
    newGroups[groupIndex].isCritical = !newGroups[groupIndex].isCritical;
    setTestGroups(newGroups);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        results: testGroups.map((g) => ({
          testId: g.testId,
          parameters: g.parameters,
          isCritical: g.isCritical
        }))
      };

      const response = await api.post(`/laboratory/orders/${order.id}/results`, payload);

      if (response.data?.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(response.data?.error?.message || "Failed to record lab results");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Failed to submit lab results");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <FileEdit className="w-4 h-4 text-purple-600" />
            <span>Enter Laboratory Test Results</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
            <div className="font-bold text-slate-800">{order.patientName}</div>
            <div className="text-slate-500 font-mono">
              UHID: {order.patientUHID} • Order #{order.id.slice(-6).toUpperCase()} • Sample: {order.sampleId || "N/A"}
            </div>
          </div>

          {/* Test Parameter Groups */}
          {testGroups.map((group, groupIdx) => (
            <div
              key={group.testId}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="font-bold text-xs text-purple-900 uppercase tracking-wider">
                  Test: {group.testName}
                </span>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={group.isCritical}
                    onChange={() => toggleCritical(groupIdx)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-700">Flag as Critical Result</span>
                </label>
              </div>

              {/* Parameter Rows */}
              <div className="space-y-2">
                {group.parameters.map((param, paramIdx) => (
                  <div key={paramIdx} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Parameter Name"
                        value={param.parameterName}
                        onChange={(e) =>
                          handleParamChange(groupIdx, paramIdx, "parameterName", e.target.value)
                        }
                        required
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Value"
                        value={param.resultValue}
                        onChange={(e) =>
                          handleParamChange(groupIdx, paramIdx, "resultValue", e.target.value)
                        }
                        required
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Unit"
                        value={param.unit}
                        onChange={(e) => handleParamChange(groupIdx, paramIdx, "unit", e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 bg-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Ref Range"
                        value={param.referenceRange}
                        onChange={(e) =>
                          handleParamChange(groupIdx, paramIdx, "referenceRange", e.target.value)
                        }
                        required
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-500 bg-white"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-end space-x-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleParamChange(groupIdx, paramIdx, "abnormalFlag", !param.abnormalFlag)
                        }
                        title="Toggle Abnormal / High Flag"
                        className={`p-1 rounded text-[10px] font-bold ${
                          param.abnormalFlag
                            ? "bg-rose-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        HIGH
                      </button>

                      {group.parameters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParamRow(groupIdx, paramIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addParamRow(groupIdx)}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center space-x-1 cursor-pointer pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Parameter Row</span>
              </button>
            </div>
          ))}

          <div className="flex justify-end space-x-2 pt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Results...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Results</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
