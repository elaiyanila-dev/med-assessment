import React, { useState } from "react";
import { AlertCircle, Bell, Check } from "lucide-react";

export interface CriticalResultItem {
  id: string;
  patientName: string;
  patientUHID: string;
  tests: string;
  criticalValue: string;
  timestamp: string;
}

interface CriticalResultsTableProps {
  results?: CriticalResultItem[];
}

export const CriticalResultsTable: React.FC<CriticalResultsTableProps> = ({
  results = [
    {
      id: "CRIT-001",
      patientName: "Patient 75",
      patientUHID: "MED-20075",
      tests: "CRP, URINE-R, CRP",
      criticalValue: "20.6 units",
      timestamp: "2:33:43 PM"
    },
    {
      id: "CRIT-002",
      patientName: "Patient 146",
      patientUHID: "MED-20146",
      tests: "LIPID, KFT, LIPID",
      criticalValue: "N/A",
      timestamp: "11:53:41 AM"
    },
    {
      id: "CRIT-003",
      patientName: "Patient 43",
      patientUHID: "MED-20043",
      tests: "KFT, CBC",
      criticalValue: "N/A",
      timestamp: "10:58:14 AM"
    },
    {
      id: "CRIT-004",
      patientName: "Patient 79",
      patientUHID: "MED-20079",
      tests: "LIPID",
      criticalValue: "N/A",
      timestamp: "9:52:40 AM"
    },
    {
      id: "CRIT-005",
      patientName: "Patient 95",
      patientUHID: "MED-20095",
      tests: "DENGUE, DENGUE",
      criticalValue: "67.5 units",
      timestamp: "8:28:30 AM"
    },
    {
      id: "CRIT-006",
      patientName: "Patient 88",
      patientUHID: "MED-20088",
      tests: "CBC, CRP",
      criticalValue: "49.7 units",
      timestamp: "8:26:18 AM"
    },
    {
      id: "CRIT-007",
      patientName: "Patient 87",
      patientUHID: "MED-20087",
      tests: "URINE-R, DENGUE, HBA1C",
      criticalValue: "85.4 units",
      timestamp: "4:42:57 AM"
    }
  ]
}) => {
  const [notifiedIds, setNotifiedIds] = useState<Record<string, boolean>>({});

  const handleNotify = (item: CriticalResultItem) => {
    setNotifiedIds((prev) => ({ ...prev, [item.id]: true }));
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden">
      {/* Table Red Header Banner */}
      <div className="p-4 bg-rose-50/90 border-b border-rose-100 flex items-center space-x-2.5">
        <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-600" />
        </div>
        <h3 className="font-black text-base text-rose-900 tracking-tight">
          Critical Results (Action Required)
        </h3>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
              <th className="py-3.5 px-5">PATIENT</th>
              <th className="py-3.5 px-5">TEST</th>
              <th className="py-3.5 px-5">CRITICAL VALUE</th>
              <th className="py-3.5 px-5">TIME</th>
              <th className="py-3.5 px-5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {results.map((row) => {
              const isNotified = notifiedIds[row.id];
              const isValueCritical = row.criticalValue !== "N/A";

              return (
                <tr key={row.id} className="hover:bg-rose-50/20 transition-colors">
                  {/* PATIENT */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-200">
                        {row.patientName.replace("Patient ", "P")}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900">{row.patientName}</div>
                        <div className="text-[11px] font-mono font-bold text-slate-400">
                          {row.patientUHID}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* TEST */}
                  <td className="py-3.5 px-5 font-semibold text-slate-700">
                    {row.tests}
                  </td>

                  {/* CRITICAL VALUE */}
                  <td className="py-3.5 px-5 font-mono font-extrabold">
                    {isValueCritical ? (
                      <span className="text-rose-600 font-black">{row.criticalValue}</span>
                    ) : (
                      <span className="text-slate-400">{row.criticalValue}</span>
                    )}
                  </td>

                  {/* TIME */}
                  <td className="py-3.5 px-5 font-mono text-slate-500 font-semibold">
                    {row.timestamp}
                  </td>

                  {/* ACTION */}
                  <td className="py-3.5 px-5 text-right">
                    {isNotified ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Notified</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleNotify(row)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200/80 transition-all flex items-center space-x-1.5 ml-auto cursor-pointer shadow-2xs"
                      >
                        <Bell className="w-3.5 h-3.5 text-rose-600" />
                        <span>Notify Doctor</span>
                      </button>
                    )}
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
