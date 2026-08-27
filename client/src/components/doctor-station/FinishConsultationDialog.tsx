import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { api } from "../../services/api";

interface FinishConsultationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  queueId?: string | null;
  patientName: string;
  onFinishedSuccess: () => void;
}

export const FinishConsultationDialog: React.FC<FinishConsultationDialogProps> = ({
  isOpen,
  onClose,
  consultationId,
  queueId,
  patientName,
  onFinishedSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await api.post(`/consultations/${consultationId}/finish`, {
        queueId: queueId || undefined
      });

      if (response.data?.success) {
        onFinishedSuccess();
      } else {
        throw new Error(response.data?.error?.message || "Failed to finish consultation");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Error finishing consultation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Finish Consultation</h3>
              <p className="text-xs text-slate-500 font-medium">Complete OPD Visit for {patientName}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Are you sure you want to mark this OPD consultation as <strong>COMPLETED</strong>?
          </p>

          <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
            <li>Clinical notes, vitals, prescriptions, and lab orders will be finalized.</li>
            <li>Queue status will be updated to <strong>COMPLETED</strong>.</li>
            <li>The patient will be removed from your active waiting OPD queue.</li>
            <li>Audit log & timeline events will be generated.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinish}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Completing Visit...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Complete Visit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
