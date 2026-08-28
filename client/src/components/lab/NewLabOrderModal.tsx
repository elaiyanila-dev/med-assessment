import React, { useState, useEffect } from "react";
import { Plus, X, User, Check, AlertCircle } from "lucide-react";
import { api } from "../../services/api";

import { mednxtDummyData } from "../../data/mednxtDummyData";

interface NewLabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TestItem {
  id: string;
  name: string;
  code: string;
  category: string;
}

export const NewLabOrderModal: React.FC<NewLabOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [availableTests, setAvailableTests] = useState<TestItem[]>([]);
  const [isStat, setIsStat] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load lab tests from official v2 dataset
      const rawTests = mednxtDummyData.raw.labTests || [];
      if (rawTests.length > 0) {
        setAvailableTests(
          rawTests.map((t: any) => ({
            id: t.id,
            name: t.name,
            code: t.code,
            category: t.department || "General"
          }))
        );
      }
      // Fetch patients list for dropdown
      api.get("/patients")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data?.data)) {
            setPatients(res.data.data);
            if (res.data.data.length > 0) {
              setSelectedPatientId(res.data.data[0].id);
            }
          }
        })
        .catch(() => {
          // Fallback patients if API unavailable
          setPatients([
            { id: "PAT-001", name: "Rahul Verma", UHID: "UHID-2026-001" },
            { id: "PAT-002", name: "Priya Sharma", UHID: "UHID-2026-002" },
            { id: "PAT-003", name: "Vikram Singh", UHID: "UHID-2026-003" }
          ]);
          setSelectedPatientId("PAT-001");
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTestSelection = (id: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorMsg("Please select a patient.");
      return;
    }
    if (selectedTestIds.length === 0) {
      setErrorMsg("Please select at least one laboratory test.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.post("/laboratory/orders", {
        patientId: selectedPatientId,
        priority: isStat ? "STAT" : "ROUTINE",
        testIds: selectedTestIds
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      // Fallback try /lab-orders if /laboratory/orders is different
      try {
        await api.post("/lab-orders", {
          patientId: selectedPatientId,
          priority: isStat ? "STAT" : "ROUTINE",
          testIds: selectedTestIds
        });
        onSuccess();
        onClose();
      } catch (err2: any) {
        setErrorMsg(err2.response?.data?.error?.message || "Failed to create lab order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Boolean(selectedPatientId) && selectedTestIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* MODAL HEADER (Dark Navy matching Screenshot 1) */}
        <div className="bg-[#0f172a] text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Plus className="w-5 h-5 text-white" />
            <h2 className="text-lg font-black tracking-tight text-white">
              New Lab Order
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-5 text-xs font-semibold">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. PATIENT SECTION */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              PATIENT
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 text-xs font-bold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer appearance-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.UHID || p.id})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
          </div>

          {/* 2. SELECT TESTS SECTION */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              SELECT TESTS
            </label>

            <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
              {availableTests.map((test) => {
                const isSelected = selectedTestIds.includes(test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => toggleTestSelection(test.id)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-purple-50/60 font-bold"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-extrabold text-[#0f172a]">
                        {test.name}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        {test.code} • {test.category}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. MARK AS STAT CHECKBOX */}
          <div className="pt-1">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isStat}
                onChange={(e) => setIsStat(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-[#0f172a]">
                Mark as STAT (Urgent)
              </span>
            </label>
          </div>

          {/* MODAL FOOTER */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-5 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Creating..." : "Create Order"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLabOrderModal;
