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
          data.items.forEach((item) => {
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

  const isPharmacistOrAdmin = ["PHARMACIST", "ADMIN", "SUPER_ADMIN"].includes(userRole);
  const isCancelledOrDispensed = details?.status === "CANCELLED" || details?.status === "DISPENSED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Pharmacy Medication Dispensing
                {details?.status && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {details.status}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono">Prescription ID: {prescriptionId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Dispensing Error</div>
                <div className="text-xs text-rose-300/90 mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center animate-pulse text-slate-400 text-sm">
              Loading prescription details and inventory stock...
            </div>
          ) : details ? (
            <>
              {/* Patient Info Header Card */}
              <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Patient Name</span>
                  <div className="font-bold text-slate-100">{details.patient.name}</div>
                  <div className="text-xs text-slate-400 font-mono">{details.patient.UHID}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Prescribing Physician</span>
                  <div className="font-medium text-slate-200">{details.doctor.name}</div>
                  <div className="text-xs text-slate-400">{new Date(details.prescribedAt).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">Allergies & Alerts</span>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {details.patient.allergies && details.patient.allergies.length > 0 ? (
                      details.patient.allergies.map((a) => (
                        <span key={a.allergy} className="inline-block px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] mr-1 border border-rose-500/30">
                          {a.allergy}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">No allergies recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Medication Itemized Checklist */}
              <div>
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                  Prescribed Medication Item Checklist
                </h4>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Medicine & Dosage</th>
                        <th className="p-3">Rack</th>
                        <th className="p-3 text-center">Prescribed</th>
                        <th className="p-3 text-center">Dispensed</th>
                        <th className="p-3 text-center">Remaining</th>
                        <th className="p-3 text-center">Available Stock</th>
                        <th className="p-3 text-right">Qty to Dispense</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {details.items.map((item) => {
                        const reqQty = dispenseQuantities[item.id] || 0;
                        const hasStockIssue = reqQty > item.stockQuantity;

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            {/* Medicine Details */}
                            <td className="p-3">
                              <div className="font-bold text-slate-100">{item.medicineName}</div>
                              <div className="text-slate-400 font-sans">
                                {item.dosage} • {item.frequency} • {item.durationDays} days
                              </div>
                              {item.isExpired && (
                                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold">
                                  EXPIRED ({new Date(item.expiryDate).toLocaleDateString()})
                                </span>
                              )}
                              {item.isInactive && (
                                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-semibold">
                                  INACTIVE
                                </span>
                              )}
                            </td>

                            {/* Rack */}
                            <td className="p-3 font-mono text-slate-300 font-semibold">
                              {item.rackLocation || "N/A"}
                            </td>

                            {/* Prescribed */}
                            <td className="p-3 text-center font-mono font-semibold text-slate-200">
                              {item.prescribedQuantity}
                            </td>

                            {/* Dispensed */}
                            <td className="p-3 text-center font-mono text-slate-400">
                              {item.dispensedQuantity}
                            </td>

                            {/* Remaining */}
                            <td className="p-3 text-center font-mono font-bold text-cyan-400">
                              {item.remainingQuantity}
                            </td>

                            {/* Stock */}
                            <td className="p-3 text-center">
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded ${
                                  hasStockIssue
                                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                    : item.stockQuantity <= item.minimumStock
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}
                              >
                                {item.stockQuantity}
                              </span>
                            </td>

                            {/* Qty to Dispense Input */}
                            <td className="p-3 text-right">
                              {item.remainingQuantity === 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
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
                                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Close Window
          </button>

          {isPharmacistOrAdmin && !isCancelledOrDispensed && (
            <button
              onClick={handleDispenseSubmit}
              disabled={submitting || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
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
