import React, { useState } from "react";
import { X, Stethoscope, Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";

interface WardRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: {
    id: string;
    patientId: string;
    patientName: string;
    patientUHID: string;
    bedNumber: string;
    ward: string;
    bedId?: string;
  } | null;
  bedId?: string;
  onSaved: () => void;
}

export const WardRoundModal: React.FC<WardRoundModalProps> = ({
  isOpen,
  onClose,
  admission,
  bedId,
  onSaved
}) => {
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !admission) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/ipd/ward-rounds", {
        patientId: admission.patientId,
        bedId: bedId || admission.bedId || admission.id,
        notes: notes || "Physician completed IPD ward round evaluation."
      });

      if (response.data?.success) {
        onSaved();
        onClose();
        setNotes("");
      } else {
        throw new Error(response.data?.error?.message || "Failed to record ward round");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        "Error submitting ward round log."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Log Physician Ward Round</h3>
              <p className="text-xs text-slate-500 font-mono font-medium">
                {admission.patientName} ({admission.patientUHID}) • Bed {admission.bedNumber} ({admission.ward})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              Ward Round Clinical Notes & Progress Summary
            </label>
            <textarea
              rows={4}
              placeholder="Enter clinical observations, progress update, treatment adjustments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-purple-600 focus:bg-white transition-all shadow-xs"
            ></textarea>
          </div>

          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 -mx-6 -mb-6 mt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Complete Ward Round</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
