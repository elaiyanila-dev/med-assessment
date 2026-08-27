import React from "react";
import { UserCheck, Stethoscope, Pill, ChevronRight } from "lucide-react";

export interface AdmittedPatientItem {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number | null;
  patientGender: string;
  bedNumber: string;
  ward: string;
  doctorName: string;
  admittedAt: string;
  reason: string;
  status: string;
}

interface AdmittedPatientListProps {
  admissions: AdmittedPatientItem[];
  onSelectAdmission: (admission: AdmittedPatientItem) => void;
  onOpenWardRound: (admission: AdmittedPatientItem) => void;
  onOpenIndent: (admission: AdmittedPatientItem) => void;
}

export const AdmittedPatientList: React.FC<AdmittedPatientListProps> = ({
  admissions,
  onSelectAdmission,
  onOpenWardRound,
  onOpenIndent
}) => {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <UserCheck className="w-5 h-5 text-purple-600" />
          <h3 className="font-extrabold text-base text-slate-800">Active Inpatient Admissions</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {admissions.length} Admitted Patient(s)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4">Bed & Ward</th>
              <th className="py-3 px-4">Patient Information</th>
              <th className="py-3 px-4">Attending Physician</th>
              <th className="py-3 px-4">Admitted On</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {admissions.map((adm) => (
              <tr key={adm.id} className="hover:bg-purple-50/50 transition-colors group">
                <td className="py-3.5 px-4">
                  <div className="font-mono font-extrabold text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block">
                    Bed {adm.bedNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">{adm.ward}</div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-bold text-xs text-slate-900">{adm.patientName}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {adm.patientUHID} • {adm.patientAge ? `${adm.patientAge}y` : ""} {adm.patientGender}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-xs text-slate-800">{adm.doctorName}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                    {adm.reason}
                  </div>
                </td>

                <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                  {formatDate(adm.admittedAt)}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => onOpenWardRound(adm)}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Conduct Ward Round"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Round</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenIndent(adm)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                      title="IPD Medicine Requisition"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Indent</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectAdmission(adm)}
                      className="p-1.5 text-slate-400 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
