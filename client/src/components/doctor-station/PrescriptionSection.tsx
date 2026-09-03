import React, { useState, useEffect } from "react";
import { Pill, Plus, Trash2, Edit2, Check, Loader2, AlertCircle } from "lucide-react";
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

const DEFAULT_MEDICINES: MedicineItem[] = [
  { id: "MED-001", name: "Dolo 650", genericName: "Paracetamol 650mg", category: "Analgesics", unit: "Tablet", unitPrice: 3.5 },
  { id: "MED-002", name: "Paracetamol 500", genericName: "Paracetamol 500mg", category: "Analgesics", unit: "Tablet", unitPrice: 2.0 },
  { id: "MED-003", name: "Atorva 10", genericName: "Atorvastatin 10mg", category: "Cardiovascular", unit: "Tablet", unitPrice: 12.0 },
  { id: "MED-004", name: "Amoxicillin 500", genericName: "Amoxicillin 500mg", category: "Antibiotics", unit: "Capsule", unitPrice: 8.5 },
  { id: "MED-005", name: "Azithromycin 500", genericName: "Azithromycin 500mg", category: "Antibiotics", unit: "Tablet", unitPrice: 24.0 },
  { id: "MED-006", name: "Metformin 500", genericName: "Metformin HCl 500mg", category: "Antidiabetic", unit: "Tablet", unitPrice: 4.0 },
  { id: "MED-007", name: "Pantoprazole 40", genericName: "Pantoprazole 40mg", category: "Gastroenterology", unit: "Tablet", unitPrice: 9.0 }
];

const FREQUENCY_OPTIONS = [
  "Twice daily (1-0-1)",
  "Once daily (1-0-0)",
  "Three times daily (1-1-1)",
  "At night (0-0-1)",
  "As required (SOS)"
];

// Persistent patient-keyed draft store across patient switches
const patientDraftMap: Record<string, DraftRxItem[]> = {};

export const PrescriptionSection: React.FC<PrescriptionSectionProps> = ({
  consultationId,
  existingPrescriptions = [],
  onPrescriptionCreated
}) => {
  const [medicinesCatalog, setMedicinesCatalog] = useState<MedicineItem[]>(DEFAULT_MEDICINES);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Form Controlled State
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineItem | null>(DEFAULT_MEDICINES[0]);
  const [dosage, setDosage] = useState<string>("1 tablet");
  const [frequency, setFrequency] = useState<string>("Twice daily (1-0-1)");
  const [durationDays, setDurationDays] = useState<number>(5);
  const [quantity, setQuantity] = useState<number>(10);

  const [draftItems, setDraftItems] = useState<DraftRxItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync / restore patient-specific draft items whenever patient or consultationId changes
  useEffect(() => {
    const key = consultationId || "DEFAULT";
    const restored = patientDraftMap[key] || [];
    setDraftItems(restored);
    setSuccessMsg(null);
    setErrorMsg(null);
    setSelectedMedicine(DEFAULT_MEDICINES[0]);
    setDosage("1 tablet");
    setFrequency("Twice daily (1-0-1)");
    setDurationDays(5);
    setQuantity(10);
    setSearchQuery("");
  }, [consultationId]);

  // Fetch / filter medicines catalog as search query changes
  useEffect(() => {
    let isMounted = true;
    const fetchMeds = async () => {
      try {
        const response = await api.get("/consultations/medicines", {
          params: { search: searchQuery }
        });
        if (isMounted && response.data?.success && Array.isArray(response.data.data)) {
          const fetched = response.data.data.length > 0 ? response.data.data : DEFAULT_MEDICINES;
          setMedicinesCatalog(fetched);
          if (fetched.length > 0 && (!selectedMedicine || !fetched.some((m: any) => m.id === selectedMedicine.id))) {
            setSelectedMedicine(fetched[0]);
          }
        }
      } catch {
        if (isMounted) {
          // Fallback to local filtering
          const query = searchQuery.toLowerCase().trim();
          const matches = query
            ? DEFAULT_MEDICINES.filter(
                (m) =>
                  m.name.toLowerCase().includes(query) ||
                  m.genericName.toLowerCase().includes(query)
              )
            : DEFAULT_MEDICINES;
          setMedicinesCatalog(matches.length > 0 ? matches : DEFAULT_MEDICINES);
        }
      }
    };
    fetchMeds();
    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedMedicine]);

  // Auto-calculate suggested quantity based on frequency & duration
  const updateSuggestedQty = (freq: string, days: number) => {
    let dailyMultiplier = 2;
    if (freq.includes("1-0-0") || freq.includes("0-0-1")) dailyMultiplier = 1;
    else if (freq.includes("1-1-1")) dailyMultiplier = 3;
    else if (freq.includes("SOS")) dailyMultiplier = 1;

    setQuantity(dailyMultiplier * (days || 1));
  };

  const handleFrequencyChange = (newFreq: string) => {
    setFrequency(newFreq);
    updateSuggestedQty(newFreq, durationDays);
  };

  const handleDurationChange = (daysVal: number) => {
    const validDays = Math.max(1, daysVal || 1);
    setDurationDays(validDays);
    updateSuggestedQty(frequency, validDays);
  };

  const handleAddDraftItem = () => {
    setErrorMsg(null);

    if (!selectedMedicine) {
      setErrorMsg("Please select a medicine.");
      return;
    }

    if (!dosage || !dosage.trim()) {
      setErrorMsg("Please enter a dosage.");
      return;
    }

    if (!durationDays || durationDays < 1) {
      setErrorMsg("Please enter a valid positive duration (days).");
      return;
    }

    if (!quantity || quantity < 1) {
      setErrorMsg("Please enter a valid positive quantity.");
      return;
    }

    const newItem: DraftRxItem = {
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.name,
      dosage: dosage.trim(),
      frequency,
      durationDays,
      quantity
    };

    setDraftItems((prev) => {
      const currentList = Array.isArray(prev) ? prev : [];
      // Replace existing item if already in list, otherwise append
      const filtered = currentList.filter((i) => i.medicineId !== selectedMedicine.id);
      const updated = [...filtered, newItem];
      const key = consultationId || "DEFAULT";
      patientDraftMap[key] = updated;
      return updated;
    });

    setSuccessMsg(`Added ${selectedMedicine.name} to prescription list.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleEditDraftItem = (index: number) => {
    const safeList = Array.isArray(draftItems) ? draftItems : [];
    const itemToEdit = safeList[index];
    if (!itemToEdit) return;

    const med = medicinesCatalog.find((m) => m.id === itemToEdit.medicineId) || {
      id: itemToEdit.medicineId,
      name: itemToEdit.medicineName,
      genericName: itemToEdit.medicineName,
      category: "General",
      unit: "Tablet",
      unitPrice: 5
    };

    setSelectedMedicine(med);
    setDosage(itemToEdit.dosage);
    setFrequency(itemToEdit.frequency);
    setDurationDays(itemToEdit.durationDays);
    setQuantity(itemToEdit.quantity);

    // Remove from active draft list so re-adding acts as update
    setDraftItems((prev) => {
      const updated = (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index);
      const key = consultationId || "DEFAULT";
      patientDraftMap[key] = updated;
      return updated;
    });
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems((prev) => {
      const updated = (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index);
      const key = consultationId || "DEFAULT";
      patientDraftMap[key] = updated;
      return updated;
    });
  };

  const handleSubmitPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeList = Array.isArray(draftItems) ? draftItems : [];
    if (safeList.length === 0) {
      setErrorMsg("Please add at least one medication to the prescription.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        items: safeList.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          durationDays: item.durationDays,
          quantity: item.quantity
        }))
      };

      const response = await api.post(`/consultations/${consultationId}/prescriptions`, payload);
      if (response.data?.success) {
        setSuccessMsg("Prescription issued & sent to pharmacy successfully.");
        setDraftItems([]);
        const key = consultationId || "DEFAULT";
        delete patientDraftMap[key];
        onPrescriptionCreated(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to issue prescription");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Error issuing prescription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeDraftList = Array.isArray(draftItems) ? draftItems : [];
  const safeExistingRx = Array.isArray(existingPrescriptions) ? existingPrescriptions : [];

  return (
    <div className="space-y-5">
      {/* Header & Status Notices */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
            <Pill className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="font-black text-base text-[#0f172a] tracking-tight">
              Electronic Prescription (e-Rx)
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Issue medications directly to outpatient pharmacy queue
            </p>
          </div>
        </div>

        {/* Notices */}
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
      </div>

      {/* Medication Entry Form Card */}
      <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/80 space-y-4">
        {/* ROW 1: Drug Search/Select, Dosage, Frequency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* COLUMN 1: Select Drug / Medicine */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              SELECT DRUG / MEDICINE
            </label>
            <input
              type="text"
              placeholder="Search drug..."
              value={searchQuery}
              onChange={(e) => {
                const q = e.target.value;
                setSearchQuery(q);
                const query = q.toLowerCase().trim();
                const matches = query
                  ? DEFAULT_MEDICINES.filter(
                      (m) =>
                        m.name.toLowerCase().includes(query) ||
                        m.genericName.toLowerCase().includes(query)
                    )
                  : DEFAULT_MEDICINES;
                setMedicinesCatalog(matches.length > 0 ? matches : DEFAULT_MEDICINES);
                if (matches.length > 0) {
                  setSelectedMedicine(matches[0]);
                }
              }}
              className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all mb-1"
            />
            <select
              value={selectedMedicine?.id || ""}
              onChange={(e) => {
                const found =
                  medicinesCatalog.find((m) => m.id === e.target.value) ||
                  DEFAULT_MEDICINES.find((m) => m.id === e.target.value);
                if (found) setSelectedMedicine(found);
              }}
              className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-extrabold text-[#0f172a] focus:outline-none focus:border-purple-500 transition-all"
            >
              {medicinesCatalog.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.genericName})
                </option>
              ))}
            </select>
          </div>

          {/* COLUMN 2: Dosage */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              DOSAGE
            </label>
            <input
              type="text"
              placeholder="e.g. 1 tablet"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* COLUMN 3: Frequency */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              FREQUENCY
            </label>
            <select
              value={frequency}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-extrabold text-[#0f172a] focus:outline-none focus:border-purple-500 transition-all"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 2: Duration, Total Quantity, Add Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* COLUMN 1: Duration (Days) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              DURATION (DAYS)
            </label>
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-mono font-extrabold text-[#0f172a] focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* COLUMN 2: Total Quantity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700">
              TOTAL QUANTITY
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-mono font-extrabold text-[#0f172a] focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* COLUMN 3: Add to Prescription Button */}
          <div>
            <button
              type="button"
              onClick={handleAddDraftItem}
              className="w-full px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl border border-purple-200/80 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add to Prescription</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prescription Medication List Table */}
      <div className="space-y-2.5">
        <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
          PRESCRIPTION MEDICATION LIST
        </h4>

        {safeDraftList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs text-slate-400 font-semibold text-xs">
            No medications added.
          </div>
        ) : (
          <form onSubmit={handleSubmitPrescription} className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-extrabold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Medication</th>
                    <th className="px-4 py-3.5">Dosage</th>
                    <th className="px-4 py-3.5">Frequency</th>
                    <th className="px-4 py-3.5">Duration</th>
                    <th className="px-4 py-3.5">Qty</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-semibold">
                  {safeDraftList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-extrabold text-[#0f172a]">{item.medicineName}</td>
                      <td className="px-4 py-3.5 text-slate-700">{item.dosage}</td>
                      <td className="px-4 py-3.5 text-slate-700">{item.frequency}</td>
                      <td className="px-4 py-3.5 text-slate-700 font-mono">{item.durationDays} days</td>
                      <td className="px-4 py-3.5 font-mono font-extrabold text-purple-700">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditDraftItem(idx)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftItem(idx)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Issue & Send Button */}
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5.5 py-2.5 bg-[#6336d3] hover:bg-[#5228be] active:bg-[#461fa8] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Issuing Prescription...</span>
                  </>
                ) : (
                  <span>Issue & Send to Pharmacy ({safeDraftList.length})</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Previously Issued Prescriptions */}
      {safeExistingRx.length > 0 && (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          <h5 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Issued Electronic Prescriptions
          </h5>
          <div className="space-y-2">
            {safeExistingRx.map((rx) => (
              <div
                key={rx.id}
                className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-1.5 text-xs"
              >
                <div className="flex justify-between items-center font-extrabold text-[#0f172a]">
                  <span>Prescription #{rx.id?.slice(-6)?.toUpperCase()}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                    {rx.status || "DISPENSED"}
                  </span>
                </div>
                <div className="text-slate-600 font-semibold">
                  {Array.isArray(rx.items)
                    ? rx.items.map((i: any) => `${i.medicine?.name || i.medicineName || "Medication"} (${i.dosage}, ${i.frequency})`).join("; ")
                    : "No items listed"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionSection;
