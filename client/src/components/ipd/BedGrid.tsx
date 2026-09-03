import React from "react";
import { Bed as BedIcon, Sparkles, Wrench, MoreVertical, Stethoscope, ArrowRightLeft, UserMinus, Plus } from "lucide-react";

export interface BedItem {
  id: string;
  bedNumber: string;
  ward: string;
  wardCode: string;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
  dailyRate: number;
  equipment: string[];
  nurseName?: string | null;
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
  onOpenWardRound?: (admission: any) => void;
  onOpenDischarge?: (admission: any) => void;
  onOpenAssign?: (bed: BedItem) => void;
  onMarkReady?: (bed: BedItem) => void;
}

export const BedGrid: React.FC<BedGridProps> = ({
  beds,
  selectedWard,
  onSelectBed,
  onOpenWardRound,
  onOpenDischarge,
  onOpenAssign,
  onMarkReady
}) => {
  const bedsList = beds && Array.isArray(beds) ? beds : [];
  const cleanSelected = (selectedWard || "").trim().toLowerCase();
  const isAll = !cleanSelected || cleanSelected === "all";

  const filteredBeds = isAll
    ? bedsList
    : bedsList.filter((b) => {
        if (!b) return false;
        const bedWard = (b.ward || "").trim().toLowerCase();
        const bedCode = (b.wardCode || "").trim().toLowerCase();

        // Exact equality check
        return bedWard === cleanSelected || bedCode === cleanSelected;
      });

  const getBorderStripClass = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "border-l-4 border-l-emerald-500";
      case "OCCUPIED":
        return "border-l-4 border-l-blue-600";
      case "CLEANING":
        return "border-l-4 border-l-amber-500";
      case "MAINTENANCE":
        return "border-l-4 border-l-slate-400";
      default:
        return "border-l-4 border-l-slate-300";
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "OCCUPIED":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "CLEANING":
        return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "MAINTENANCE":
        return "bg-slate-100 text-slate-700 border-slate-200/80";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200/80";
    }
  };

  if (filteredBeds.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
        <BedIcon className="w-8 h-8 text-purple-600 mx-auto" />
        <p className="text-sm font-extrabold text-slate-700">No beds matching ward filter "{selectedWard || "All"}"</p>
        <p className="text-xs text-slate-400">Select "All" to view all beds across all hospital wards.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredBeds.map((bed) => {
        const borderStrip = getBorderStripClass(bed.status);
        const badgeClass = getBadgeClass(bed.status);

        return (
          <div
            key={bed.id}
            onClick={() => onSelectBed(bed)}
            className={`bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-sm transition-all space-y-3 flex flex-col justify-between cursor-pointer ${borderStrip}`}
          >
            {/* Header: Bed Number & Status Badge */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-sm text-[#0f172a] tracking-tight">
                  {bed.bedNumber}
                </span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
                  {bed.status}
                </span>
              </div>

              {/* Sub-header: Ward Name & Rate */}
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <span className="truncate">{bed.ward || bed.wardCode || "GENERAL WARD MALE"}</span>
                <span className="font-mono font-extrabold text-slate-600 lowercase">₹{bed.dailyRate}/day</span>
              </div>
            </div>

            {/* Middle Content Area Based on Status */}
            {bed.status === "AVAILABLE" && (
              <div className="py-3 text-center space-y-1 bg-emerald-50/40 rounded-xl border border-emerald-100/60">
                <div className="w-9 h-9 rounded-full bg-emerald-100/70 text-emerald-600 flex items-center justify-center mx-auto">
                  <BedIcon className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-extrabold text-emerald-700">Available</p>
              </div>
            )}

            {bed.status === "OCCUPIED" && (
              <div className="space-y-2">
                {/* Patient Profile Box */}
                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                        {bed.patient?.name ? bed.patient.name.charAt(0).toUpperCase() : "P"}
                      </div>
                      <span className="font-extrabold text-xs text-[#0f172a] truncate">
                        {bed.patient?.name || "Rahul Verma"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-extrabold text-blue-700 bg-white px-1.5 py-0.5 rounded-md border border-blue-200/80 shrink-0">
                      {bed.patient?.UHID || "ABHA-1234"}
                    </span>
                  </div>

                  <div className="text-[10px] font-semibold text-slate-500 pl-8">
                    {bed.patient?.age ? `${bed.patient.age}y` : "34y"} / {bed.patient?.gender || "Male"}
                  </div>
                </div>

                {/* Nurse Assignment Row */}
                <div className="flex items-center justify-between text-[10px] px-1 font-semibold text-slate-500">
                  <span className="uppercase text-[9px] font-extrabold text-slate-400">NURSE</span>
                  <span className="text-slate-700 font-bold">{bed.nurseName || "Unassigned"}</span>
                </div>
              </div>
            )}

            {bed.status === "CLEANING" && (
              <div className="py-3 text-center space-y-1 bg-amber-50/40 rounded-xl border border-amber-100/60">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-extrabold text-amber-700">Housekeeping in progress</p>
              </div>
            )}

            {bed.status === "MAINTENANCE" && (
              <div className="py-3 text-center space-y-1 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
                  <Wrench className="w-4.5 h-4.5" />
                </div>
                <p className="text-xs font-extrabold text-slate-600">Under Service</p>
              </div>
            )}

            {/* Bottom Actions Based on Status */}
            <div className="pt-1.5 border-t border-slate-100">
              {bed.status === "AVAILABLE" && (
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenAssign) onOpenAssign(bed);
                    }}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Patient</span>
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {bed.status === "OCCUPIED" && (
                <div className="space-y-1">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenWardRound && bed.activeAdmission) {
                          onOpenWardRound(bed.activeAdmission);
                        }
                      }}
                      className="py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Rounds</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Transfer</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenDischarge && bed.activeAdmission) {
                        onOpenDischarge(bed.activeAdmission);
                      }
                    }}
                    className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Discharge</span>
                  </button>
                </div>
              )}

              {bed.status === "CLEANING" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onMarkReady) onMarkReady(bed);
                  }}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Mark Ready</span>
                </button>
              )}

              {bed.status === "MAINTENANCE" && (
                <div className="w-full py-1.5 bg-slate-100 text-slate-400 font-extrabold text-xs rounded-xl text-center cursor-not-allowed">
                  Service In Progress
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BedGrid;
