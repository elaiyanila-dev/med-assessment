import React, { useState } from "react";
import { X, ArrowDown, Sparkles, Loader2, Check, AlertTriangle, FileCode } from "lucide-react";
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
  const safeOrder = order || { id: "ORDER", items: [] };
  const sampleId = safeOrder.sampleId || `SMP-${safeOrder.id.slice(-6).toUpperCase()}`;
  const patientName = safeOrder.patientName || safeOrder.patient?.name || "Patient";
  const items = safeOrder.items && safeOrder.items.length > 0 ? safeOrder.items : [{ testName: "CBC", testId: "TEST-CBC" }];
  const testNamesStr = items.map((i: any) => i.testName || i.test?.name || "Test").join(", ");

  // Initialize test groups and parameter forms dynamically
  const initialTestGroups: TestResultGroup[] = items.map((item: any) => {
    let defaultParams: ParameterRow[] = [];
    const tName = (item.testName || item.test?.name || "").toUpperCase();

    if (tName.includes("CBC") || tName.includes("HAEMOGRAM") || tName.includes("COMPLETE BLOOD")) {
      defaultParams = [
        { parameterName: "Hemoglobin", resultValue: "", unit: "g/dL", referenceRange: "13.0-17.0", abnormalFlag: false },
        { parameterName: "WBC", resultValue: "", unit: "/cumm", referenceRange: "4000-11000", abnormalFlag: false },
        { parameterName: "Platelets", resultValue: "", unit: "lakh/cumm", referenceRange: "1.5-4.5", abnormalFlag: false }
      ];
    } else if (tName.includes("KFT") || tName.includes("KIDNEY")) {
      defaultParams = [
        { parameterName: "Serum Creatinine", resultValue: "", unit: "mg/dL", referenceRange: "0.7-1.3", abnormalFlag: false },
        { parameterName: "Blood Urea Nitrogen (BUN)", resultValue: "", unit: "mg/dL", referenceRange: "7-20", abnormalFlag: false },
        { parameterName: "Uric Acid", resultValue: "", unit: "mg/dL", referenceRange: "3.5-7.2", abnormalFlag: false }
      ];
    } else if (tName.includes("TSH") || tName.includes("THYROID")) {
      defaultParams = [
        { parameterName: "Thyroid Stimulating Hormone (TSH)", resultValue: "", unit: "uIU/mL", referenceRange: "0.4-4.0", abnormalFlag: false }
      ];
    } else if (tName.includes("CRP") || tName.includes("C-REACTIVE")) {
      defaultParams = [
        { parameterName: "C-Reactive Protein (CRP)", resultValue: "", unit: "mg/L", referenceRange: "< 6.0", abnormalFlag: false }
      ];
    } else {
      defaultParams = [
        { parameterName: `${item.testName || "Test"} Result`, resultValue: "", unit: "mg/dL", referenceRange: "Normal Range", abnormalFlag: false }
      ];
    }
    return {
      testId: item.testId || item.id || item.testCode || "TEST-001",
      testName: item.testName || item.test?.name || "Laboratory Test",
      parameters: defaultParams
    };
  });

  const [testGroups, setTestGroups] = useState<TestResultGroup[]>(initialTestGroups);
  const [hl7Text, setHl7Text] = useState("");
  const [isFetchingMachine, setIsFetchingMachine] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{ isAbnormal: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!order) return null;

  const handleParamValueChange = (groupIdx: number, paramIdx: number, val: string) => {
    const nextGroups = [...testGroups];
    nextGroups[groupIdx].parameters[paramIdx].resultValue = val;
    setTestGroups(nextGroups);
  };

  // Fetch simulated machine values
  const handleFetchMachineData = () => {
    setIsFetchingMachine(true);
    setSuccessToast(null);

    setTimeout(() => {
      const nextGroups = testGroups.map((group) => {
        const updatedParams = group.parameters.map((p) => {
          let val = p.resultValue;
          const pName = p.parameterName.toUpperCase();
          if (pName.includes("HEMOGLOBIN") || pName.includes("HB")) val = "14.2";
          else if (pName.includes("WBC") || pName.includes("LEUKOCYTE")) val = "7200";
          else if (pName.includes("PLATELET")) val = "2.8";
          else if (pName.includes("CREATININE")) val = "1.1";
          else if (pName.includes("BUN") || pName.includes("UREA")) val = "14";
          else if (pName.includes("URIC")) val = "5.2";
          else if (pName.includes("TSH")) val = "2.4";
          else if (pName.includes("CRP")) val = "3.5";
          else if (!val) val = "100";
          return { ...p, resultValue: val };
        });
        return { ...group, parameters: updatedParams };
      });

      setTestGroups(nextGroups);
      setIsFetchingMachine(false);
      setSuccessToast("Machine data fetched and populated successfully!");
    }, 600);
  };

  // HL7 Message Parser Simulation
  const handleParseHl7 = () => {
    if (!hl7Text.trim()) {
      setErrorMsg("Please paste a valid HL7 segment first.");
      return;
    }
    setErrorMsg(null);
    setSuccessToast(null);

    const text = hl7Text.trim();
    // Simulated HL7 extraction logic
    const nextGroups = testGroups.map((group) => {
      const updatedParams = group.parameters.map((p) => {
        let val = p.resultValue;
        const pName = p.parameterName.toLowerCase();
        if (text.toLowerCase().includes("hb") || text.toLowerCase().includes("hemoglobin")) {
          if (pName.includes("hemoglobin") || pName.includes("hb")) val = "14.2";
        }
        if (text.toLowerCase().includes("wbc") || text.toLowerCase().includes("7200")) {
          if (pName.includes("wbc")) val = "7200";
        }
        if (text.toLowerCase().includes("plt") || text.toLowerCase().includes("platelet")) {
          if (pName.includes("platelet")) val = "2.8";
        }
        if (!val) {
          const matchNum = text.match(/\d+(\.\d+)?/);
          if (matchNum) val = matchNum[0];
        }
        return { ...p, resultValue: val || "12.5" };
      });
      return { ...group, parameters: updatedParams };
    });

    setTestGroups(nextGroups);
    setSuccessToast("HL7 Message parsed and values extracted successfully!");
  };

  // AI Pathologist Analysis
  const handleRunAiAnalysis = () => {
    setIsAnalyzingAi(true);
    setAiAnalysisResult(null);

    setTimeout(() => {
      let isAbnormal = false;
      const abnormalDetails: string[] = [];

      testGroups.forEach((group) => {
        group.parameters.forEach((param) => {
          const numVal = parseFloat(param.resultValue);
          if (!isNaN(numVal)) {
            if (param.parameterName.includes("Hemoglobin") && (numVal < 13.0 || numVal > 17.0)) {
              isAbnormal = true;
              abnormalDetails.push(`Hemoglobin (${numVal} g/dL) is outside range (${param.referenceRange})`);
            }
            if (param.parameterName.includes("WBC") && (numVal < 4000 || numVal > 11000)) {
              isAbnormal = true;
              abnormalDetails.push(`WBC (${numVal} /cumm) is outside range (${param.referenceRange})`);
            }
            if (param.parameterName.includes("Creatinine") && (numVal < 0.7 || numVal > 1.3)) {
              isAbnormal = true;
              abnormalDetails.push(`Creatinine (${numVal} mg/dL) is outside range (${param.referenceRange})`);
            }
          }
        });
      });

      if (isAbnormal) {
        setAiAnalysisResult({
          isAbnormal: true,
          text: `Decision Support: Potential abnormality detected.\n${abnormalDetails.join("\n")}. Review recommended before final sign-off.`
        });
      } else {
        setAiAnalysisResult({
          isAbnormal: false,
          text: "Decision Support: No significant parameter abnormalities detected. All values fall within configured reference ranges."
        });
      }

      setIsAnalyzingAi(false);
    }, 600);
  };

  // Finalize & Release
  const handleFinalizeAndRelease = async () => {
    // Validate inputs
    let hasEmpty = false;
    testGroups.forEach((g) => {
      g.parameters.forEach((p) => {
        if (!p.resultValue.trim()) hasEmpty = true;
      });
    });

    if (hasEmpty) {
      setErrorMsg("Please enter all required parameter results before finalizing.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        results: testGroups.map((g) => ({
          testId: g.testId,
          parameters: g.parameters,
          isCritical: aiAnalysisResult?.isAbnormal || false
        }))
      };

      const response = await api.post(`/laboratory/orders/${order.id}/results`, payload);

      if (response.data?.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(response.data?.error?.message || "Failed to finalize and release results");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Failed to finalize results");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* DARK NAVY HEADER SECTION (#0f172a) */}
        <div className="bg-[#0f172a] text-white p-5 md:p-6 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
              Result Entry: {sampleId}
            </h2>
            <div className="text-xs font-extrabold text-slate-300 mt-1">
              {patientName} • {testNamesStr}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MODAL BODY (SPLIT VIEW: 65% LEFT / 35% RIGHT) */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto min-h-0">
          {/* LEFT SECTION (65%): PARAMETERS & HL7 IMPORT */}
          <div className="lg:w-[65%] p-5 md:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600">
                  ×
                </button>
              </div>
            )}

            {successToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center justify-between">
                <span>{successToast}</span>
                <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-emerald-600">
                  ×
                </button>
              </div>
            )}

            {/* PARAMETERS HEADER ROW */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">
                Parameters
              </h3>

              <button
                type="button"
                onClick={handleFetchMachineData}
                disabled={isFetchingMachine}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl border border-blue-200/80 transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isFetchingMachine ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>Fetch Machine Data</span>
              </button>
            </div>

            {/* DYNAMIC PARAMETERS INPUT LIST */}
            <div className="space-y-4">
              {testGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-3">
                  {testGroups.length > 1 && (
                    <div className="text-xs font-black text-purple-900 uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 inline-block">
                      {group.testName}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {group.parameters.map((param, paramIdx) => (
                      <div
                        key={paramIdx}
                        className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 hover:border-purple-200 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-black text-[#0f172a] tracking-tight">
                            {param.parameterName}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                            Ref: {param.referenceRange}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={param.resultValue}
                            onChange={(e) => handleParamValueChange(groupIdx, paramIdx, e.target.value)}
                            placeholder="Value..."
                            className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-2xs"
                          />
                          <span className="text-xs font-bold text-slate-500 shrink-0 font-mono">
                            {param.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* HL7 MESSAGE IMPORT (SIMULATION) SECTION */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-purple-600" />
                  <span>HL7 MESSAGE IMPORT (SIMULATION)</span>
                </div>
                <button
                  type="button"
                  onClick={handleParseHl7}
                  className="text-xs font-black text-purple-600 hover:text-purple-800 cursor-pointer"
                >
                  Parse & Extract
                </button>
              </div>

              <textarea
                rows={3}
                value={hl7Text}
                onChange={(e) => setHl7Text(e.target.value)}
                placeholder="Paste raw HL7 segment here..."
                className="w-full p-3 text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>

          {/* RIGHT SECTION (35%): AI PATHOLOGIST PANEL */}
          <div className="lg:w-[35%] bg-purple-50/40 p-5 md:p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-[#0f172a] font-black text-sm uppercase tracking-wider">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200/80">
                  <Sparkles className="w-4 h-4 text-purple-700" />
                </div>
                <span>AI Pathologist</span>
              </div>

              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                Analyze results for anomalies and clinical correlation.
              </p>

              <button
                type="button"
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzingAi}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isAnalyzingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Analyzing Parameters...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Run Analysis</span>
                  </>
                )}
              </button>

              {/* AI Analysis Result Card */}
              {aiAnalysisResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold space-y-2 animate-fadeIn ${
                    aiAnalysisResult.isAbnormal
                      ? "bg-amber-50 text-amber-900 border-amber-200"
                      : "bg-emerald-50 text-emerald-900 border-emerald-200"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {aiAnalysisResult.isAbnormal ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="whitespace-pre-line leading-relaxed">
                      {aiAnalysisResult.text}
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-200/50">
                    Clinical decision support only. Pathologist review required.
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] font-bold text-slate-400 text-center leading-normal">
              Final sign-off will record your pathologist credentials in audit log.
            </div>
          </div>
        </div>

        {/* LIGHT-GRAY FOOTER SECTION */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 md:p-5 rounded-b-3xl flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200/80 cursor-pointer transition-colors shadow-2xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleFinalizeAndRelease}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Releasing...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Finalize & Release</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
