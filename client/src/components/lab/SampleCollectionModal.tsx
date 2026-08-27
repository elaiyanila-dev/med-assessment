import React, { useState } from "react";
import { X, TestTube, Loader2, Check } from "lucide-react";
import { api } from "../../services/api";

interface ModalProps {
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const SampleCollectionModal: React.FC<ModalProps> = ({
  order,
  onClose,
  onSuccess
}) => {
  const defaultSampleId = `SMP-${Math.floor(100000 + Math.random() * 900000)}`;
  const defaultAccessionId = `ACC-${Math.floor(100000 + Math.random() * 900000)}`;

  const [sampleId, setSampleId] = useState(defaultSampleId);
  const [accessionId, setAccessionId] = useState(defaultAccessionId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await api.post(`/laboratory/orders/${order.id}/collect`, {
        sampleId,
        accessionId
      });

      if (response.data?.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(response.data?.error?.message || "Failed to collect sample");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Sample collection failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
            <TestTube className="w-4 h-4 text-amber-500" />
            <span>Collect Specimen Sample</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
            <div className="font-bold text-slate-800">{order.patientName}</div>
            <div className="text-slate-500 font-mono">
              UHID: {order.patientUHID} • Order #{order.id.slice(-6).toUpperCase()}
            </div>
            <div className="text-purple-700 font-semibold mt-1">
              Tests: {order.items.map((i: any) => i.testName).join(", ")}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Sample Barcode / Specimen ID</label>
            <input
              type="text"
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Accession Number</label>
            <input
              type="text"
              value={accessionId}
              onChange={(e) => setAccessionId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono font-bold text-slate-800"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm Collection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
