import React, { useState } from "react";
import { X, RotateCcw, AlertTriangle } from "lucide-react";
import axios from "axios";

interface AppointmentDetail {
  id: string;
  patientName: string;
  patientUHID: string;
  doctorName: string;
  scheduledAt: string;
}

interface ModalProps {
  appointment: AppointmentDetail | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RescheduleAppointmentModal: React.FC<ModalProps> = ({
  appointment,
  onClose,
  onSuccess
}) => {
  const [newScheduledAt, setNewScheduledAt] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!appointment) return null;

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `/api/appointments/${appointment.id}/reschedule`,
        {
          scheduledAt: new Date(newScheduledAt).toISOString(),
          reason: reason || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to reschedule appointment slot");
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
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Reschedule Appointment</h2>
              <p className="text-xs text-slate-400">Select a new date and time slot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Details Card */}
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
                <span className="text-slate-500">Current Slot:</span>
                <span className="ml-1 text-purple-300 font-mono">{new Date(appointment.scheduledAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* New Scheduled Time */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              New Date & Time Slot *
            </label>
            <input
              type="datetime-local"
              value={newScheduledAt}
              onChange={(e) => setNewScheduledAt(e.target.value)}
              required
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Reschedule Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Patient requested time change"
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? "Rescheduling..." : "Confirm Reschedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
