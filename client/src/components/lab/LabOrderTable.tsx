import React from "react";
import {
  TestTube,
  Cpu,
  FileEdit,
  Eye,
  Clock,
  UserCheck
} from "lucide-react";

interface LabOrderTableProps {
  orders: any[];
  userRole?: string;
  onCollectSample: (order: any) => void;
  onProcessOrder: (order: any) => void;
  onEnterResults: (order: any) => void;
  onViewDetails: (order: any) => void;
}

export const LabOrderTable: React.FC<LabOrderTableProps> = ({
  orders,
  userRole,
  onCollectSample,
  onProcessOrder,
  onEnterResults,
  onViewDetails
}) => {
  const isLabStaff = userRole === "LAB_TECHNICIAN" || userRole === "PATHOLOGIST" || userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <TestTube className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <h4 className="text-sm font-bold text-slate-700">No Laboratory Orders Found</h4>
        <p className="text-xs text-slate-400 mt-1">
          There are no laboratory requisitions matching your filter or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Order ID & Date</th>
              <th className="py-3 px-4">Patient Demographics</th>
              <th className="py-3 px-4">Requested Tests</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {orders.map((order) => {
              const testNames = order.items.map((i: any) => i.testName).join(", ");
              const status = order.status;

              return (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Order ID & Date */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 font-mono">
                      #{order.id.slice(-6).toUpperCase()}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(order.orderTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {order.sampleId && (
                      <div className="text-[10px] font-mono text-purple-700 font-bold mt-0.5">
                        Sample: {order.sampleId}
                      </div>
                    )}
                  </td>

                  {/* Patient Demographics */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{order.patientName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {order.patientUHID} • {order.patientAge}y/{order.patientGender}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <UserCheck className="w-3 h-3" />
                      <span>Dr. {order.doctorName}</span>
                    </div>
                  </td>

                  {/* Requested Tests */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 line-clamp-1">{testNames}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {order.items.length} item(s) requested
                    </div>
                  </td>

                  {/* Priority Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.priority === "STAT"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-purple-100 text-purple-700 border border-purple-200"
                      }`}
                    >
                      {order.priority}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        status === "ORDERED"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : status === "COLLECTED"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : status === "PROCESSING"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : status === "RESULT_READY"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : status === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border-rose-200 shadow-xs animate-pulse"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {status === "ORDERED" && isLabStaff && (
                      <button
                        onClick={() => onCollectSample(order)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <TestTube className="w-3.5 h-3.5" />
                        <span>Collect Sample</span>
                      </button>
                    )}

                    {status === "COLLECTED" && isLabStaff && (
                      <button
                        onClick={() => onProcessOrder(order)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>Start Processing</span>
                      </button>
                    )}

                    {status === "PROCESSING" && isLabStaff && (
                      <button
                        onClick={() => onEnterResults(order)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Enter Results</span>
                      </button>
                    )}

                    {(status === "RESULT_READY" || status === "CRITICAL" || status === "RELEASED" || !isLabStaff) && (
                      <button
                        onClick={() => onViewDetails(order)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-600" />
                        <span>View Report</span>
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
