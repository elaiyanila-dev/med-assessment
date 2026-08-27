import React, { useState, useEffect } from "react";
import { Pill, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { api } from "../../services/api";

interface MedicineItem {
  id: string;
  name: string;
  genericName: string;
  category: string;
  unit: string;
  unitPrice: number;
}

interface DraftRxItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
}

interface PrescriptionSectionProps {
  consultationId: string;
  existingPrescriptions?: any[];
  onPrescriptionCreated: (prescription: any) => void;
}

export const PrescriptionSection: React.FC<PrescriptionSectionProps> = ({
  consultationId,
  existingPrescriptions = [],
  onPrescriptionCreated
}) => {
  const [medicinesCatalog, setMedicinesCatalog] = useState<MedicineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form State
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineItem | null>(null);
  const [dosage, setDosage] = useState<string>("1 tablet");
  const [frequency, setFrequency] = useState<string>("Twice daily (1-0-1)");
  const [durationDays, setDurationDays] = useState<number>(5);
  const [quantity, setQuantity] = useState<number>(10);

  const [draftItems, setDraftItems] = useState<DraftRxItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMeds = async () => {
      try {
        const response = await api.get("/consultations/medicines", {
          params: { search: searchQuery }
        });
        if (isMounted && response.data?.success) {
          setMedicinesCatalog(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedMedicine((prev) => prev || response.data.data[0]);
          }
        }
      } catch {
        if (isMounted) setErrorMsg("Failed to load medicine database");
      }
    };
    fetchMeds();
    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  const handleAddDraftItem = () => {
    if (!selectedMedicine) return;

    // Avoid duplicate medicine in draft
    if (draftItems.some((i) => i.medicineId === selectedMedicine.id)) {
      setErrorMsg("Medicine already added to prescription draft");
      return;
    }

    const newItem: DraftRxItem = {
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.name,
      dosage,
      frequency,
      durationDays,
      quantity
    };

    setDraftItems([...draftItems, newItem]);
    setErrorMsg(null);
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems(draftItems.filter((_, i) => i !== index));
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftItems.length === 0) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        items: draftItems.map((item) => ({
          medicineId: item.medicineId,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          quantity: item.quantity
        }))
      };

      const response = await api.post(`/consultations/${consultationId}/prescriptions`, payload);
      if (response.data?.success) {
        setSuccessMsg("Prescription issued & sent to pharmacy!");
        setDraftItems([]);
        onPrescriptionCreated(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to create prescription");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Error issuing prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
          <Pill className="w-4 h-4 text-purple-600" />
          <span>Electronic Prescription (e-Rx)</span>
        </div>
        {successMsg && (
          <span className="text-xs font-bold text-emerald-600 flex items-center">
            <Check className="w-3.5 h-3.5 mr-1" /> {successMsg}
          </span>
        )}
        {errorMsg && <span className="text-xs font-bold text-rose-600">{errorMsg}</span>}
      </div>

      {/* Add Medicine Control */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Medicine Search & Dropdown */}
          <div className="md:col-span-1 space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Select Drug / Medicine</label>
            <input
              type="text"
              placeholder="Search drug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600 transition-all mb-1"
            />
            <select
              value={selectedMedicine?.id || ""}
              onChange={(e) => {
                const found = medicinesCatalog.find((m) => m.id === e.target.value);
                if (found) setSelectedMedicine(found);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600 transition-all"
            >
              {medicinesCatalog.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.genericName})
                </option>
              ))}
            </select>
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600 transition-all"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Days)</label>
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Total Quantity</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600 transition-all"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={handleAddDraftItem}
              className="w-full px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Prescription</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prescription Draft Table */}
      {draftItems.length > 0 && (
        <form onSubmit={handleSubmitPrescription} className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2.5">Medicine</th>
                  <th className="px-4 py-2.5">Dosage</th>
                  <th className="px-4 py-2.5">Frequency</th>
                  <th className="px-4 py-2.5">Duration</th>
                  <th className="px-4 py-2.5">Qty</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {draftItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-purple-900">{item.medicineName}</td>
                    <td className="px-4 py-2.5">{item.dosage}</td>
                    <td className="px-4 py-2.5">{item.frequency}</td>
                    <td className="px-4 py-2.5">{item.durationDays} days</td>
                    <td className="px-4 py-2.5 font-bold">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Issuing Prescription...</span>
                </>
              ) : (
                <span>Issue & Send to Pharmacy ({draftItems.length})</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Existing Prescriptions */}
      {existingPrescriptions.length > 0 && (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Issued Electronic Prescriptions
          </h5>
          <div className="space-y-2">
            {existingPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1 text-xs"
              >
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>Prescription #{rx.id.slice(-6).toUpperCase()}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                    {rx.status}
                  </span>
                </div>
                <div className="text-slate-600 font-medium">
                  {rx.items?.map((i: any) => `${i.medicine?.name || "Medicine"} (${i.dosage}, ${i.frequency})`).join("; ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
