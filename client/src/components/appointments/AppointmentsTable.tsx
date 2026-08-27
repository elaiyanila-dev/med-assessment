import React from "react";
import { Calendar, CheckCircle2, Clock, XCircle, UserCheck, CalendarX, RotateCcw } from "lucide-react";

interface AppointmentRow {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  patientAge?: number;
  patientGender?: string;
  patientMobile?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  type: string;
  scheduledAt: string;
  status: string;
}

interface TableProps {
  appointments: AppointmentRow[];
  userRole: string;
  onCheckIn: (id: string) => void;
  onReschedule: (id: string) => void;
  onNoShow: (id: string) => void;
  onCancel: (id: string) => void;
}

export const AppointmentsTable: React.FC<TableProps> = ({
  appointments,
  userRole,
  onCheckIn,
  onReschedule,
  onNoShow,
  onCancel
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="h-3 w-3" /> Checked-In
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="h-3 w-3" /> Scheduled
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case "NO_SHOW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CalendarX className="h-3 w-3" /> No-Show
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const canMutate = ["RECEPTIONIST", "DOCTOR", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  if (appointments.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-12 text-center">
        <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-medium text-slate-300">No Scheduled Appointments Found</h3>
        <p className="text-xs text-slate-500 mt-1">There are no appointments matching your current search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Scheduled Date & Time</th>
              <th className="py-3.5 px-4 font-semibold">Patient Details</th>
              <th className="py-3.5 px-4 font-semibold">Physician & Department</th>
              <th className="py-3.5 px-4 font-semibold">Type</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {appointments.map((a) => (
              <tr key={a.id} className="hover:bg-slate-800/40 transition-colors duration-150">
                {/* Date & Time */}
                <td className="py-4 px-4 font-mono text-xs">
                  <div className="font-bold text-slate-100">{new Date(a.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-[11px] text-purple-300">{new Date(a.scheduledAt).toLocaleDateString()}</div>
                </td>

                {/* Patient */}
                <td className="py-4 px-4">
                  <div className="font-semibold text-slate-100">{a.patientName}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {a.patientUHID} {a.patientAge && `• ${a.patientAge}y`} {a.patientGender && `• ${a.patientGender}`}
                  </div>
                </td>

                {/* Doctor */}
                <td className="py-4 px-4">
                  <div className="font-medium text-slate-200">{a.doctorName}</div>
                  <div className="text-xs text-slate-400 font-mono">{a.department}</div>
                </td>

                {/* Type */}
                <td className="py-4 px-4">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {a.type}
                  </span>
                </td>

                {/* Status */}
                <td className="py-4 px-4">
                  {getStatusBadge(a.status)}
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  {canMutate && a.status === "SCHEDULED" ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onCheckIn(a.id)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all"
                      >
                        Check-In
                      </button>
                      <button
                        onClick={() => onReschedule(a.id)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-all"
                        title="Reschedule Appointment"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onNoShow(a.id)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-all"
                        title="Mark No-Show"
                      >
                        No-Show
                      </button>
                      <button
                        onClick={() => onCancel(a.id)}
                        className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                        title="Cancel Appointment"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">No actions</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
