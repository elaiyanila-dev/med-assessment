import React from "react";
import { X, User, FlaskConical, Clock } from "lucide-react";

interface LabOrderDetailsModalProps {
  order: any;
  onClose: () => void;
}

export const LabOrderDetailsModal: React.FC<LabOrderDetailsModalProps> = ({
  order,
  onClose
}) => {
  if (!order) return null;

  // Extract patient details dynamically
  const patientName = order.patientName || order.patient?.name || "Patient";
  const patientAge = order.patientAge || order.patient?.age || 28;
  const patientGender = order.patientGender || order.patient?.gender || "Female";
  const patientUHID = order.patientUHID || order.patient?.uhid || order.patientId || "ABHA-5678";
  const doctorName = order.doctorName || order.doctor?.name || "Dr. Sharma";

  // Formatted order time
  const orderTimeDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const fullOrderTimeStr = orderTimeDate.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const timeOnlyOrderedStr = orderTimeDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  // Formatted collected time
  const collectedTimeDate = order.collectedAt ? new Date(order.collectedAt) : null;
  const timeOnlyCollectedStr = collectedTimeDate
    ? collectedTimeDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      })
    : null;

  // Extract tests list
  const testsList = order.items && order.items.length > 0
    ? order.items.map((item: any) => ({
        name: item.testName || item.test?.name || "Complete Blood Count",
        dept: item.department || item.test?.department || "Hematology",
        price: item.price || item.test?.price || 450,
        tat: item.tat || item.test?.tat || "2h"
      }))
    : [
        {
          name: "Complete Blood Count",
          dept: "Hematology",
          price: 450,
          tat: "2h"
        }
      ];

  const statusUpper = (order.status || "COLLECTED").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col my-auto select-none">
        {/* DARK NAVY HEADER SECTION */}
        <div className="bg-[#0f172a] text-white p-5 md:p-6 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
              Order Details #{order.id}
            </h2>
            <div className="text-xs font-bold text-slate-300 mt-1 flex items-center space-x-2">
              <span className="text-purple-400 font-extrabold uppercase">{statusUpper}</span>
              <span>•</span>
              <span>{fullOrderTimeStr}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* PATIENT INFORMATION CARD */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200/80 shrink-0">
                <User className="w-6 h-6 text-purple-700" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  PATIENT NAME
                </div>
                <div className="text-base font-black text-[#0f172a] tracking-tight">
                  {patientName}
                </div>
                <div className="text-xs font-bold text-slate-600 flex items-center space-x-2">
                  <span>{patientAge} Yrs / {patientGender}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-500">{patientUHID}</span>
                </div>
              </div>
            </div>

            <div className="sm:text-right bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                PRESCRIBED BY
              </div>
              <div className="text-xs font-extrabold text-[#0f172a] mt-0.5">
                {doctorName}
              </div>
            </div>
          </div>

          {/* TESTS REQUESTED */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <FlaskConical className="w-4 h-4 text-purple-600" />
              <span>TESTS REQUESTED</span>
            </div>

            <div className="space-y-2.5">
              {testsList.map((testItem: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between shadow-2xs hover:border-purple-200 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-black text-sm text-[#0f172a]">
                      {testItem.name}
                    </div>
                    <span className="inline-block px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-extrabold rounded-md border border-purple-200/80">
                      {testItem.dept}
                    </span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-sm font-black text-[#0f172a]">
                      ₹{testItem.price}
                    </div>
                    <div className="text-xs font-bold text-slate-500">
                      TAT: {testItem.tat}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ORDER TIMELINE */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs font-semibold text-slate-500 gap-2">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Ordered: <strong className="text-slate-800">{timeOnlyOrderedStr}</strong></span>
            </div>

            {timeOnlyCollectedStr && (
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Collected: <strong className="text-slate-800">{timeOnlyCollectedStr}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* LIGHT-GRAY FOOTER */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 rounded-b-3xl flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
