import React from "react";
import { Pill, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";

interface PrescriptionItemSummary {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  prescribedQuantity: number;
  rackLocation?: string;
}

interface PrescriptionRow {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number;
  patientGender?: string;
  doctorName: string;
  status: string;
  prescribedAt: string;
  items: PrescriptionItemSummary[];
}

interface TableProps {
  prescriptions: PrescriptionRow[];
  userRole: string;
  onSelectPrescription: (prescriptionId: string) => void;
}

export const PrescriptionQueueTable: React.FC<TableProps> = ({
  prescriptions,
  userRole,
  onSelectPrescription
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DISPENSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Dispensed
          </span>
        );
      case "SENT_TO_PHARMACY":
      case "PENDING":
      case "PENDING_DISPENSE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="h-3 w-3" /> Pending Dispense
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const isPharmacistOrAdmin = ["PHARMACIST", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  if (prescriptions.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-12 text-center">
        <Pill className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-medium text-slate-300">No Pharmacy Requisitions Found</h3>
        <p className="text-xs text-slate-500 mt-1">There are no prescription requisitions matching your current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Prescription ID</th>
              <th className="py-3.5 px-4 font-semibold">Patient Information</th>
              <th className="py-3.5 px-4 font-semibold">Prescribing Physician</th>
              <th className="py-3.5 px-4 font-semibold">Medication List</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {prescriptions.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors duration-150">
                {/* ID & Date */}
                <td className="py-4 px-4 font-mono text-xs text-cyan-400 font-semibold">
                  <div>{p.id.substring(0, 12)}...</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                    {new Date(p.prescribedAt).toLocaleString()}
                  </div>
                </td>

                {/* Patient */}
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-100">{p.patientName}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {p.patientUHID} {p.patientAge && `• ${p.patientAge}y`} {p.patientGender && `• ${p.patientGender}`}
                  </div>
                </td>

                {/* Doctor */}
                <td className="py-4 px-4 font-medium text-slate-200">
                  {p.doctorName}
                </td>

                {/* Medication Items Summary */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    {p.items.map((i) => (
                      <div key={i.id} className="text-xs text-slate-300 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                        <span className="font-semibold text-slate-200">{i.medicineName}</span>
                        <span className="text-slate-400">({i.dosage})</span>
                        <span className="text-slate-500 font-mono">x{i.prescribedQuantity}</span>
                        {i.rackLocation && (
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono border border-slate-700/50">
                            {i.rackLocation}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  {getStatusBadge(p.status)}
                </td>

                {/* Action */}
                <td className="py-4 px-4 text-right">
                  <button
                    onClick={() => onSelectPrescription(p.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      isPharmacistOrAdmin && p.status !== "DISPENSED" && p.status !== "CANCELLED"
                        ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
                    }`}
                  >
                    {isPharmacistOrAdmin && p.status !== "DISPENSED" && p.status !== "CANCELLED"
                      ? "Dispense Medicines"
                      : "View Details"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
