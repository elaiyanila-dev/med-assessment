import React from "react";
import { Calendar, Clock, User } from "lucide-react";

export interface AppointmentItem {
  id: string;
  patientId: string;
  patientName: string;
  patientUHID: string;
  type: string;
  scheduledAt: string;
  status: string;
}

interface UpcomingAppointmentsProps {
  appointments: AppointmentItem[];
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  appointments
}) => {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Upcoming Appointments</h2>
            <p className="text-xs text-slate-500 font-medium">Scheduled patient visits for today</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
          {appointments.length} Scheduled
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">No Upcoming Appointments</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are no appointments currently scheduled for your profile.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6">Patient Name</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Scheduled Time</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center font-semibold text-sm border border-purple-100">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{apt.patientName}</div>
                        <div className="text-xs text-slate-400 font-mono">{apt.patientUHID}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {apt.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{formatTime(apt.scheduledAt)}</span>
                      <span className="text-xs text-slate-400">({formatDate(apt.scheduledAt)})</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {apt.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed opacity-75 inline-flex items-center space-x-1"
                      title="View action disabled until consultation workflow integration"
                    >
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
