import React from "react";
import { Bed as BedIcon, User } from "lucide-react";

export interface BedItem {
  id: string;
  bedNumber: string;
  ward: string;
  wardCode: string;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
  dailyRate: number;
  equipment: string[];
  patient?: {
    id: string;
    name: string;
    UHID: string;
    age?: number | null;
    gender: string;
    mobile: string;
  } | null;
  activeAdmission?: {
    id: string;
    doctorName: string;
    admittedAt: string;
    reason: string;
  } | null;
}

interface BedGridProps {
  beds: BedItem[];
  selectedWard?: string | null;
  onSelectBed: (bed: BedItem) => void;
}

export const BedGrid: React.FC<BedGridProps> = ({ beds, selectedWard, onSelectBed }) => {
  const filteredBeds = selectedWard
    ? beds.filter((b) => b.ward === selectedWard)
    : beds;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-500";
      case "OCCUPIED":
        return "bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-500";
      case "CLEANING":
      case "MAINTENANCE":
        return "bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-400";
      default:
        return "bg-slate-50 border-slate-200 text-slate-800";
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "OCCUPIED":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-200 text-slate-700 border-slate-300";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <BedIcon className="w-5 h-5 text-purple-600" />
          <h3 className="font-extrabold text-base text-slate-800">
            Bed Occupancy Grid {selectedWard ? `— ${selectedWard}` : ""}
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {filteredBeds.length} Total Bed(s)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredBeds.map((bed) => {
          const style = getStatusStyle(bed.status);
          const badgeStyle = getBadgeStyle(bed.status);

          return (
            <div
              key={bed.id}
              onClick={() => onSelectBed(bed)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs ${style}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-sm tracking-tight">
                  {bed.bedNumber}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                  {bed.status}
                </span>
              </div>

              {bed.status === "OCCUPIED" && bed.patient ? (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 font-bold text-xs truncate">
                    <User className="w-3 h-3 text-amber-700 shrink-0" />
                    <span className="truncate">{bed.patient.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-amber-800/80 truncate">
                    {bed.patient.UHID}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] font-semibold text-slate-400 italic">
                  {bed.status === "AVAILABLE" ? "Vacant Bed" : "Under Service"}
                </div>
              )}

              <div className="text-[10px] font-mono text-slate-500 border-t border-slate-200/60 pt-1.5 flex justify-between">
                <span>{bed.wardCode}</span>
                <span>₹{bed.dailyRate}/day</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
