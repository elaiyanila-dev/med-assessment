import React, { useState } from "react";
import { X, ShieldAlert, AlertTriangle } from "lucide-react";
import axios from "axios";

interface ModalProps {
  patientId: string | null;
  patientName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManageAllergiesModal: React.FC<ModalProps> = ({
  patientId,
  patientName,
  onClose,
  onSuccess
}) => {
  const [allergen, setAllergen] = useState("");
  const [severity, setSeverity] = useState("MODERATE");
  const [reaction, setReaction] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!patientId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/patients/${patientId}/allergies`,
        {
          allergen,
          severity,
          reaction: reaction || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to add allergy safety alert");
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
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Add Allergy Safety Alert</h2>
              <p className="text-xs text-slate-400">{patientName ? `Patient: ${patientName}` : "New Clinical Safety Alert"}</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Allergen Substance Name *
            </label>
            <input
              type="text"
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              required
              placeholder="e.g. Penicillin, Peanuts, Latex"
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Severity Level
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="MILD">Mild (Skin rash, localized itch)</option>
              <option value="MODERATE">Moderate (Urticaria, gastrointestinal distress)</option>
              <option value="SEVERE">Severe / Critical (Anaphylaxis risk)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Reaction Details
            </label>
            <input
              type="text"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="e.g. Facial swelling, difficulty breathing"
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-400 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Add Allergy Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
