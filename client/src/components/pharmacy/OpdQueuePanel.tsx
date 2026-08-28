import React from "react";
import { Search, Clock, Pill, CheckCircle2 } from "lucide-react";

export interface PrescriptionQueueItem {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number;
  patientGender?: string;
  doctorName: string;
  status: string;
  prescribedAt: string;
  items: Array<{
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    prescribedQuantity: number;
    rackLocation?: string;
  }>;
}

interface OpdQueuePanelProps {
  prescriptions: PrescriptionQueueItem[];
  selectedId: string | null;
  onSelectPatient: (prescription: PrescriptionQueueItem) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const OpdQueuePanel: React.FC<OpdQueuePanelProps> = ({
  prescriptions = [],
  selectedId,
  onSelectPatient,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4 flex flex-col h-full min-h-[500px]">
      {/* Search Input matching FIRST IMAGE: "Scan or Search Queue..." */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Scan or Search Queue..."
          className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
        />
      </div>

      {/* Queue Patient Cards List */}
      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {prescriptions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Pill className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-extrabold text-[#0f172a]">No OPD Prescriptions Found</div>
            <div className="text-[11px] font-semibold text-slate-400">Try adjusting your search criteria</div>
          </div>
        ) : (
          prescriptions.map((p) => {
            const isSelected = selectedId === p.id;
            const isPending = p.status !== "DISPENSED" && p.status !== "CANCELLED";
            const itemCount = (p.items || []).length;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPatient(p)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected
                    ? "bg-purple-50/60 border-purple-300 shadow-xs ring-1 ring-purple-400/30"
                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center border border-purple-200 shrink-0">
                      {p.patientName.replace("Patient ", "P").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0f172a] line-clamp-1">
                        {p.patientName}
                      </h4>
                      <p className="text-[11px] font-mono font-bold text-slate-400 mt-0.5">
                        {p.patientUHID} • {p.doctorName.replace("Dr. Rohan Sharma", "Dr. Sharma")}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge: WAITING or DISPENSED */}
                  {isPending ? (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[10px] font-black uppercase shrink-0">
                      WAITING
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-[10px] font-black uppercase shrink-0 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>DISPENSED</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center space-x-1 text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{p.prescribedAt ? new Date(p.prescribedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono font-bold">
                    {itemCount} {itemCount === 1 ? "Item" : "Items"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
