import React, { useState } from "react";
import { X, UserCheck, AlertTriangle } from "lucide-react";
import axios from "axios";

interface AppointmentDetail {
  id: string;
  patientName: string;
  patientUHID: string;
  doctorName: string;
  department: string;
  scheduledAt: string;
}

interface ModalProps {
  appointment: AppointmentDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckInQueueModal: React.FC<ModalProps> = ({
  appointment,
  onClose,
  onSuccess
}) => {
  const [priority, setPriority] = useState("ROUTINE");
  const [source, setSource] = useState<"CLINIC" | "REMOTE">("CLINIC");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!appointment) return null;

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/appointments/${appointment.id}/check-in`,
        { priority, source },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to check in appointment into live queue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Appointment Check-In</h2>
              <p className="text-xs text-slate-400">Convert appointment into active consultation queue entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleCheckInSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Details Card */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-4 space-y-2">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Patient</span>
              <div className="font-bold text-slate-100 text-sm">{appointment.patientName}</div>
              <div className="text-xs text-slate-400 font-mono">{appointment.patientUHID}</div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs">
              <div>
                <span className="text-slate-500">Physician:</span>
                <span className="ml-1 text-slate-200 font-medium">{appointment.doctorName}</span>
              </div>
              <div>
                <span className="text-slate-500">Scheduled:</span>
                <span className="ml-1 text-purple-300 font-mono">{new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Queue Priority */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Queue Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ROUTINE">Routine Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="EMERGENCY">Emergency Priority</option>
            </select>
          </div>

          {/* Registration Source */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Check-In Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as "CLINIC" | "REMOTE")}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="CLINIC">In-Clinic Front Desk</option>
              <option value="REMOTE">Remote Kiosk / Online</option>
            </select>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? "Checking In..." : "Confirm & Issue Queue Token"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
