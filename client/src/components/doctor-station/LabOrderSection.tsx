import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, Check, Loader2, AlertCircle } from "lucide-react";
import { api } from "../../services/api";

interface LabTestItem {
  id: string;
  code: string;
  name: string;
  category: string;
  department?: string;
}

interface LabOrderSectionProps {
  consultationId: string;
  existingLabOrders?: any[];
  onLabOrderCreated: (order: any) => void;
}

const DEFAULT_LAB_TESTS: LabTestItem[] = [
  { id: "TEST-CBC", code: "CBC", name: "Complete Blood Count", category: "Hematology" },
  { id: "TEST-LFT", code: "LFT", name: "Liver Function Test", category: "Biochemistry" },
  { id: "TEST-KFT", code: "KFT", name: "Kidney Function Test", category: "Biochemistry" },
  { id: "TEST-LIPID", code: "LIPID", name: "Lipid Profile", category: "Biochemistry" },
  { id: "TEST-TSH", code: "TSH", name: "Thyroid Stimulating Hormone", category: "Endocrinology" }
];

// Persistent patient-keyed selected tests store across patient switches
const patientSelectedLabTestsMap: Record<string, LabTestItem[]> = {};

export const LabOrderSection: React.FC<LabOrderSectionProps> = ({
  consultationId,
  existingLabOrders = [],
  onLabOrderCreated
}) => {
  const [availableTests, setAvailableTests] = useState<LabTestItem[]>(DEFAULT_LAB_TESTS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTests, setSelectedTests] = useState<LabTestItem[]>([]);
  const [isStat, setIsStat] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restore patient-specific selected lab tests whenever patient or consultationId changes
  useEffect(() => {
    const key = consultationId || "DEFAULT";
    const restored = patientSelectedLabTestsMap[key] || [];
    setSelectedTests(restored);
    setSuccessMsg(null);
    setErrorMsg(null);
    setIsStat(false);
    setSearchTerm("");
  }, [consultationId]);

  // Fetch / filter lab test catalog
  useEffect(() => {
    let isMounted = true;
    const fetchTests = async () => {
      try {
        const response = await api.get("/consultations/lab-tests");
        if (isMounted && response.data?.success && Array.isArray(response.data.data)) {
          const fetched = response.data.data.length > 0 ? response.data.data : DEFAULT_LAB_TESTS;
          setAvailableTests(fetched);
        }
      } catch {
        if (isMounted) {
          setAvailableTests(DEFAULT_LAB_TESTS);
        }
      }
    };
    fetchTests();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddTest = (test: LabTestItem) => {
    setErrorMsg(null);
    const key = consultationId || "DEFAULT";
    const safeCurrent = Array.isArray(selectedTests) ? selectedTests : [];

    if (safeCurrent.some((t) => t.id === test.id)) {
      return; // Already selected
    }

    const updated = [...safeCurrent, test];
    setSelectedTests(updated);
    patientSelectedLabTestsMap[key] = updated;
  };

  const handleRemoveTest = (testId: string) => {
    const key = consultationId || "DEFAULT";
    const safeCurrent = Array.isArray(selectedTests) ? selectedTests : [];
    const updated = safeCurrent.filter((t) => t.id !== testId);
    setSelectedTests(updated);
    patientSelectedLabTestsMap[key] = updated;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeCurrent = Array.isArray(selectedTests) ? selectedTests : [];

    if (safeCurrent.length === 0) {
      setErrorMsg("Please select at least one lab test.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        testIds: safeCurrent.map((t) => t.id),
        priority: isStat ? "STAT" : "ROUTINE"
      };

      const response = await api.post(`/consultations/${consultationId}/lab-orders`, payload);
      if (response.data?.success) {
        setSuccessMsg("Lab order placed successfully!");
        setSelectedTests([]);
        const key = consultationId || "DEFAULT";
        patientSelectedLabTestsMap[key] = [];
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

  const query = searchTerm.toLowerCase().trim();
  const safeCatalog = Array.isArray(availableTests) ? availableTests : DEFAULT_LAB_TESTS;
  const filteredCatalog = query
    ? safeCatalog.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.code.toLowerCase().includes(query) ||
          (t.category || "").toLowerCase().includes(query)
      )
    : safeCatalog;

  const safeSelectedList = Array.isArray(selectedTests) ? selectedTests : [];
  const safeExistingOrders = Array.isArray(existingLabOrders) ? existingLabOrders : [];

  return (
    <div className="space-y-5">
      {/* Top Header Card inside Lab Order Section */}
      <form onSubmit={handlePlaceOrder} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-black text-lg text-[#0f172a] tracking-tight">
              Order Lab Tests
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Select tests to add to the order list.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* STAT Checkbox Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isStat}
                onChange={(e) => setIsStat(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 accent-rose-600 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-700">
                STAT <span className="text-slate-400 font-semibold">(Urgent)</span>
              </span>
            </label>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isSubmitting || safeSelectedList.length === 0}
              className="px-5.5 py-2.5 bg-[#6336d3] hover:bg-[#5228be] active:bg-[#461fa8] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Placing Order...</span>
                </>
              ) : (
                <span>Place Order</span>
              )}
            </button>
          </div>
        </div>

        {/* Status Notices */}
        {(successMsg || errorMsg) && (
          <div className="flex items-center space-x-2">
            {successMsg && (
              <span className="text-xs font-extrabold text-emerald-600 flex items-center bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                <Check className="w-3.5 h-3.5 mr-1" /> {successMsg}
              </span>
            )}
            {errorMsg && (
              <span className="text-xs font-extrabold text-rose-600 flex items-center bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errorMsg}
              </span>
            )}
          </div>
        )}

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tests (e.g. CBC, Lipid Profile...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-[#0f172a] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* 2-Column Grid: AVAILABLE TESTS vs SELECTED TESTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* LEFT COLUMN: AVAILABLE TESTS */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              AVAILABLE TESTS
            </h4>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {filteredCatalog.length === 0 ? (
                <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200/80 text-center text-xs font-medium text-slate-400">
                  No matching lab tests found.
                </div>
              ) : (
                filteredCatalog.map((test) => {
                  const isSelected = safeSelectedList.some((t) => t.id === test.id);
                  return (
                    <div
                      key={test.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-purple-50/60 border-purple-200/80"
                          : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                      }`}
                    >
                      <div>
                        <h5 className="font-extrabold text-xs text-[#0f172a]">{test.name}</h5>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                          {test.code} • {test.category}
                        </p>
                      </div>

                      {isSelected ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-[11px] font-extrabold flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Added</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddTest(test)}
                          className="w-8 h-8 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 flex items-center justify-center font-extrabold text-sm transition-all cursor-pointer shadow-2xs"
                          title="Add Test"
                        >
                          +
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SELECTED TESTS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                SELECTED TESTS
              </h4>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-extrabold text-[11px] rounded-full">
                {safeSelectedList.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {safeSelectedList.length === 0 ? (
                <div className="p-8 bg-slate-50/60 rounded-2xl border border-slate-200/80 text-center text-xs font-medium text-slate-400">
                  No tests selected.
                </div>
              ) : (
                safeSelectedList.map((test) => (
                  <div
                    key={test.id}
                    className="p-3.5 rounded-2xl border border-purple-200/80 bg-purple-50/40 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <h5 className="font-extrabold text-xs text-[#0f172a]">{test.name}</h5>
                      <p className="text-[11px] font-semibold text-purple-600 mt-0.5">
                        {test.code} • {test.category}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTest(test.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Previously Placed Lab Orders for this Consultation */}
      {safeExistingOrders.length > 0 && (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Requisitioned Lab Orders
          </h5>
          <div className="space-y-2">
            {safeExistingOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between font-extrabold text-[#0f172a]">
                  <div className="flex items-center space-x-2">
                    <span>Order #{order.id?.slice(-6)?.toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700">
                      {order.priority}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                    {order.status || "ORDERED"}
                  </span>
                </div>
                <div className="text-slate-600 font-semibold">
                  Tests: {Array.isArray(order.items) ? order.items.map((i: any) => i.test?.name || i.test?.id || "Lab Test").join(", ") : "No test items"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LabOrderSection;
