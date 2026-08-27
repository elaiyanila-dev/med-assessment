import React, { useState, useEffect } from "react";
import { X, Pill, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";

interface IPDIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: {
    id: string;
    patientId: string;
    patientName: string;
    patientUHID: string;
    bedNumber: string;
    ward: string;
    bedId?: string;
  } | null;
  bedId?: string;
  onSaved: () => void;
}

export const IPDIndentModal: React.FC<IPDIndentModalProps> = ({
  isOpen,
  onClose,
  admission,
  bedId,
  onSaved
}) => {
  const [priority, setPriority] = useState<"ROUTINE" | "STAT">("ROUTINE");
  const [items, setItems] = useState<Array<{ medicineId: string; medicineName: string; dose: string; quantity: number }>>([]);

  const [medicineSearch, setMedicineSearch] = useState<string>("");
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isLoadingMeds, setIsLoadingMeds] = useState<boolean>(false);

  const [selectedMed, setSelectedMed] = useState<any | null>(null);
  const [dose, setDose] = useState<string>("1 vial");
  const [quantity, setQuantity] = useState<number>(2);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchMeds = async () => {
      setIsLoadingMeds(true);
      try {
        const response = await api.get("/ipd/medicines", {
          params: { search: medicineSearch }
        });
        if (response.data?.success) {
          setMedicines(response.data.data);
        }
      } catch {
        // Non-blocking
      } finally {
        setIsLoadingMeds(false);
      }
    };

    const timer = setTimeout(fetchMeds, 300);
    return () => clearTimeout(timer);
  }, [medicineSearch, isOpen]);

  if (!isOpen || !admission) return null;

  const handleAddItem = () => {
    if (!selectedMed) return;
    setItems((prev) => [
      ...prev,
      {
        medicineId: selectedMed.id,
        medicineName: selectedMed.name,
        dose,
        quantity
      }
    ]);
    setSelectedMed(null);
    setMedicineSearch("");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Please add at least one medicine item to the IPD indent.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/ipd/indents", {
        patientId: admission.patientId,
        bedId: bedId || admission.bedId || admission.id,
        ward: admission.ward,
        priority,
        items: items.map((i) => ({
          medicineId: i.medicineId,
          dose: i.dose,
          quantity: i.quantity,
          packaging: "STRIP"
        }))
      });

      if (response.data?.success) {
        onSaved();
        onClose();
        setItems([]);
      } else {
        throw new Error(response.data?.error?.message || "Failed to submit IPD indent");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        "Error submitting IPD medicine requisition."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">IPD Medicine Requisition Indent</h3>
              <p className="text-xs text-slate-500 font-mono font-medium">
                {admission.patientName} ({admission.patientUHID}) • Bed {admission.bedNumber} ({admission.ward})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Priority */}
          <div className="flex items-center space-x-4">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Priority:</label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPriority("ROUTINE")}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  priority === "ROUTINE"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                ROUTINE
              </button>
              <button
                type="button"
                onClick={() => setPriority("STAT")}
                className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                  priority === "STAT"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                STAT (Urgent)
              </button>
            </div>
          </div>

          {/* Medicine Search & Selection Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Add Inpatient Medicine Item
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search medicine catalog..."
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600"
              />
              {isLoadingMeds && (
                <Loader2 className="w-4 h-4 text-purple-600 animate-spin absolute right-3 top-2.5" />
              )}

              {medicines.length > 0 && medicineSearch && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 max-h-40 overflow-y-auto z-20">
                  {medicines.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMed(m);
                        setMedicineSearch(m.name);
                        setMedicines([]);
                      }}
                      className="px-3 py-1.5 hover:bg-purple-50 cursor-pointer font-semibold text-slate-800"
                    >
                      {m.name} <span className="text-[10px] text-slate-400 font-mono">({m.genericName})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedMed && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  placeholder="Dose (e.g. 1 vial)"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  className="w-1/2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-1/4 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            )}
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                Requisition Items ({items.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {items.map((it, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{it.medicineName}</div>
                      <div className="text-[11px] text-slate-500">
                        Dose: {it.dose} | Qty: {it.quantity}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 -mx-6 -mb-6 mt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || items.length === 0}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Submit IPD Indent</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
