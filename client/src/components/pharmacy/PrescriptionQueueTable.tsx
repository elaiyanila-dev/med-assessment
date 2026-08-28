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
  prescriptions = [],
  userRole,
  onSelectPrescription
}) => {
  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DISPENSED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <CheckCircle2 className="h-3.5 w-3.5" /> Dispensed
          </span>
        );
      case "SENT_TO_PHARMACY":
      case "PENDING":
      case "PENDING_DISPENSE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
            <Clock className="h-3.5 w-3.5" /> Pending Dispense
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
            <XCircle className="h-3.5 w-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const isPharmacistOrAdmin = ["PHARMACIST", "ADMIN", "SUPER_ADMIN", "DOCTOR"].includes(userRole);

  if (safePrescriptions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <Pill className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-[#0f172a]">No Pharmacy Requisitions Found</h3>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          There are no prescription requisitions matching your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-3.5 px-5">PRESCRIPTION ID</th>
              <th className="py-3.5 px-5">PATIENT INFORMATION</th>
              <th className="py-3.5 px-5">PRESCRIBING PHYSICIAN</th>
              <th className="py-3.5 px-5">MEDICATION LIST</th>
              <th className="py-3.5 px-5">STATUS</th>
              <th className="py-3.5 px-5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {safePrescriptions.map((p) => {
              const isPending = p.status !== "DISPENSED" && p.status !== "CANCELLED";

              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* PRESCRIPTION ID */}
                  <td className="py-3.5 px-5">
                    <div className="font-mono font-extrabold text-purple-700">
                      {p.id}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {p.prescribedAt ? new Date(p.prescribedAt).toLocaleString() : "N/A"}
                    </div>
                  </td>

                  {/* PATIENT INFORMATION */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 font-black text-xs flex items-center justify-center border border-purple-100 shrink-0">
                        {p.patientName.replace("Patient ", "P").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-[#0f172a]">{p.patientName}</div>
                        <div className="text-[11px] font-mono font-bold text-slate-400">
                          {p.patientUHID} {p.patientAge && `• ${p.patientAge}y`} {p.patientGender && `• ${p.patientGender}`}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* PRESCRIBING PHYSICIAN */}
                  <td className="py-3.5 px-5 font-bold text-slate-800">
                    {p.doctorName}
                  </td>

                  {/* MEDICATION LIST */}
                  <td className="py-3.5 px-5">
                    <div className="space-y-1">
                      {(p.items || []).map((i, idx) => (
                        <div key={i.id || idx} className="text-xs text-slate-700 flex items-center space-x-1.5 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                          <span className="font-extrabold text-[#0f172a]">{i.medicineName}</span>
                          <span className="text-slate-500 font-normal">({i.dosage})</span>
                          <span className="text-slate-500 font-mono font-bold">x{i.prescribedQuantity}</span>
                          {i.rackLocation && (
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-600 font-mono border border-slate-200">
                              Rack {i.rackLocation}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="py-3.5 px-5">
                    {getStatusBadge(p.status)}
                  </td>

                  {/* ACTIONS */}
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => onSelectPrescription(p.id)}
                      className={`inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs ${
                        isPending && isPharmacistOrAdmin
                          ? "bg-[#0f172a] hover:bg-[#1e293b] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                      }`}
                    >
                      <span>{isPending && isPharmacistOrAdmin ? "Dispense Medicines" : "View Details"}</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
