import React, { useState, useEffect } from "react";
import { Pill, CheckCircle2, AlertTriangle, PackageCheck, X } from "lucide-react";
import { api } from "../../services/api";

interface PatientDispenseWorkspaceProps {
  prescriptionId: string;
  userRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PatientDispenseWorkspace: React.FC<PatientDispenseWorkspaceProps> = ({
  prescriptionId,
  userRole,
  onClose,
  onSuccess
}) => {
  const [details, setDetails] = useState<any>(null);
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
          const data = res.data.data;
          setDetails(data);

          const initQty: Record<string, number> = {};
          (data.items || []).forEach((item: any) => {
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
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to process medication dispensing");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center space-y-2 animate-pulse">
          <Pill className="w-8 h-8 text-purple-600 mx-auto" />
          <div className="text-xs font-bold text-slate-500">Loading prescription workspace...</div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center text-rose-600 text-xs font-bold">
          Failed to load patient prescription details.
        </div>
      </div>
    );
  }

  const isPending = details.status !== "DISPENSED" && details.status !== "CANCELLED";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-5 h-full min-h-[500px] flex flex-col justify-between">
      <div className="space-y-5">
        {/* Workspace Title & Close */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f172a] flex items-center gap-2">
                Dispensing Workflow
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/80">
                  {details.status}
                </span>
              </h3>
              <p className="text-xs font-mono font-bold text-slate-400">Rx ID: {details.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Summary Header Box */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">PATIENT NAME</span>
            <div className="font-extrabold text-[#0f172a] text-sm mt-0.5">{details.patient?.name}</div>
            <div className="text-xs text-slate-500 font-mono font-bold">{details.patient?.UHID}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">PRESCRIBING PHYSICIAN</span>
            <div className="font-bold text-slate-800 text-sm mt-0.5">{details.doctor?.name}</div>
            <div className="text-xs font-semibold text-slate-500">{new Date(details.prescribedAt).toLocaleString()}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">ALLERGIES & ALERTS</span>
            <div className="text-xs text-slate-700 mt-1">
              {details.patient?.allergies && details.patient.allergies.length > 0 ? (
                details.patient.allergies.map((a: any) => (
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

        {/* Medication Item Checklist Table */}
        <div className="space-y-2.5">
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
                  <th className="p-3.5 px-4 text-center">Stock</th>
                  <th className="p-3.5 px-4 text-right">Qty to Dispense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(details.items || []).map((item: any) => {
                  const reqQty = dispenseQuantities[item.id] || 0;
                  const hasStockIssue = reqQty > item.stockQuantity;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 px-4">
                        <div className="font-extrabold text-[#0f172a]">{item.medicineName}</div>
                        <div className="text-slate-500 font-semibold">
                          {item.dosage} • {item.frequency}
                        </div>
                      </td>

                      <td className="p-3.5 px-4 font-mono text-slate-700 font-extrabold">
                        {item.rackLocation || "A-01"}
                      </td>

                      <td className="p-3.5 px-4 text-center font-mono font-extrabold text-slate-800">
                        {item.prescribedQuantity}
                      </td>

                      <td className="p-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-extrabold px-2 py-0.5 rounded-md ${
                            hasStockIssue
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {item.stockQuantity}
                        </span>
                      </td>

                      <td className="p-3.5 px-4 text-right">
                        {!isPending ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Dispensed
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={item.remainingQuantity}
                            value={reqQty}
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
      </div>

      {/* Action Footer */}
      {isPending && (
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleDispenseSubmit}
            disabled={submitting}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <PackageCheck className="h-4 w-4" />
            <span>{submitting ? "Processing..." : "Confirm & Dispense Medication"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
