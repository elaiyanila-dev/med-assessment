import React, { useState, useEffect } from "react";
import { X, Pill, AlertTriangle, CheckCircle2, PackageCheck } from "lucide-react";
import { api } from "../../services/api";

interface ItemDetail {
  id: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  prescribedQuantity: number;
  dispensedQuantity: number;
  remainingQuantity: number;
  unitPrice: number;
  totalPrice: number;
  rackLocation?: string;
  stockQuantity: number;
  minimumStock: number;
  medicineStatus: string;
  expiryDate: string;
  isExpired: boolean;
  isInactive: boolean;
}

interface PrescriptionDetails {
  id: string;
  patient: {
    id: string;
    name: string;
    UHID: string;
    age?: number;
    gender?: string;
    allergies?: Array<{ allergy: string; severity: string }>;
  };
  doctor: {
    name: string;
  };
  status: string;
  prescribedAt: string;
  items: ItemDetail[];
}

interface ModalProps {
  prescriptionId: string | null;
  userRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const DispensePrescriptionModal: React.FC<ModalProps> = ({
  prescriptionId,
  userRole,
  onClose,
  onSuccess
}) => {
  const [details, setDetails] = useState<PrescriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispenseQuantities, setDispenseQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!prescriptionId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/pharmacy/prescriptions/${prescriptionId}`);

        if (res.data?.success) {
          const data: PrescriptionDetails = res.data.data;
          setDetails(data);

          // Initialize default requested dispense quantities to remainingQuantity
          const initQty: Record<string, number> = {};
          (data.items || []).forEach((item) => {
            initQty[item.id] = item.remainingQuantity;
          });
          setDispenseQuantities(initQty);
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || "Failed to load prescription details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [prescriptionId]);

  if (!prescriptionId) return null;

  const handleQtyChange = (itemId: string, value: number) => {
    setDispenseQuantities((prev) => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleDispenseSubmit = async () => {
    if (!details) return;

    setSubmitting(true);
    setError(null);

    const itemsToDispense = Object.entries(dispenseQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([prescriptionItemId, quantity]) => ({
        prescriptionItemId,
        quantity
      }));

    if (itemsToDispense.length === 0) {
      setError("Please select a quantity greater than zero for at least one medication.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post(`/pharmacy/prescriptions/${details.id}/dispense`, { items: itemsToDispense });

      if (res.data?.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to process medication dispensing");
    } finally {
      setSubmitting(false);
    }
  };

  const isPharmacistOrAdmin = ["PHARMACIST", "ADMIN", "SUPER_ADMIN", "DOCTOR"].includes(userRole);
  const isCancelledOrDispensed = details?.status === "CANCELLED" || details?.status === "DISPENSED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-700 flex items-center justify-center border border-purple-200/80 shrink-0">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a] flex items-center gap-2">
                Pharmacy Medication Dispensing
                {details?.status && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80">
                    {details.status}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-mono font-bold">Prescription ID: {prescriptionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <div className="font-extrabold">Dispensing Notice</div>
                <div className="text-xs text-rose-600 font-semibold mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center animate-pulse text-slate-400 text-xs font-bold">
              Loading prescription details and inventory stock...
            </div>
          ) : details ? (
            <>
              {/* Patient Info Header Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">PATIENT NAME</span>
                  <div className="font-extrabold text-[#0f172a]">{details.patient.name}</div>
                  <div className="text-xs text-slate-500 font-mono font-bold">{details.patient.UHID}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">PRESCRIBING PHYSICIAN</span>
                  <div className="font-bold text-slate-800">{details.doctor.name}</div>
                  <div className="text-xs font-semibold text-slate-500">{new Date(details.prescribedAt).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">ALLERGIES & ALERTS</span>
                  <div className="text-xs text-slate-700 mt-0.5">
                    {details.patient.allergies && details.patient.allergies.length > 0 ? (
                      details.patient.allergies.map((a) => (
                        <span key={a.allergy} className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold mr-1 border border-rose-200">
                          {a.allergy}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 font-semibold italic">No allergies recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Medication Itemized Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                  Prescribed Medication Item Checklist
                </h4>

                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[11px] tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3.5 px-4">Medicine & Dosage</th>
                        <th className="p-3.5 px-4">Rack</th>
                        <th className="p-3.5 px-4 text-center">Prescribed</th>
                        <th className="p-3.5 px-4 text-center">Dispensed</th>
                        <th className="p-3.5 px-4 text-center">Remaining</th>
                        <th className="p-3.5 px-4 text-center">Available Stock</th>
                        <th className="p-3.5 px-4 text-right">Qty to Dispense</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(details.items || []).map((item) => {
                        const reqQty = dispenseQuantities[item.id] || 0;
                        const hasStockIssue = reqQty > item.stockQuantity;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Medicine Details */}
                            <td className="p-3.5 px-4">
                              <div className="font-extrabold text-[#0f172a]">{item.medicineName}</div>
                              <div className="text-slate-500 font-semibold">
                                {item.dosage} • {item.frequency} • {item.durationDays} days
                              </div>
                            </td>

                            {/* Rack */}
                            <td className="p-3.5 px-4 font-mono text-slate-700 font-extrabold">
                              {item.rackLocation || "A-01"}
                            </td>

                            {/* Prescribed */}
                            <td className="p-3.5 px-4 text-center font-mono font-extrabold text-slate-800">
                              {item.prescribedQuantity}
                            </td>

                            {/* Dispensed */}
                            <td className="p-3.5 px-4 text-center font-mono text-slate-500 font-bold">
                              {item.dispensedQuantity}
                            </td>

                            {/* Remaining */}
                            <td className="p-3.5 px-4 text-center font-mono font-black text-purple-700">
                              {item.remainingQuantity}
                            </td>

                            {/* Stock */}
                            <td className="p-3.5 px-4 text-center">
                              <span
                                className={`font-mono font-extrabold px-2 py-0.5 rounded-md ${
                                  hasStockIssue
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : item.stockQuantity <= item.minimumStock
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {item.stockQuantity}
                              </span>
                            </td>

                            {/* Qty to Dispense Input */}
                            <td className="p-3.5 px-4 text-right">
                              {item.remainingQuantity === 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-xs">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Fully Dispensed
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min={0}
                                  max={item.remainingQuantity}
                                  value={reqQty}
                                  disabled={!isPharmacistOrAdmin || isCancelledOrDispensed}
                                  onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 0)}
                                  className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-mono font-extrabold text-[#0f172a] focus:outline-none focus:border-purple-500 focus:bg-white"
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close Window
          </button>

          {isPharmacistOrAdmin && !isCancelledOrDispensed && (
            <button
              onClick={handleDispenseSubmit}
              disabled={submitting || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <PackageCheck className="h-4 w-4" />
              {submitting ? "Processing Dispense..." : "Confirm & Dispense Medication"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
