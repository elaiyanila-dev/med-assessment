import React from "react";
import { X, UserPlus, Info } from "lucide-react";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Add New OPD Patient</h3>
              <p className="text-xs text-slate-500 font-medium">Phase 4A UI Entry Point</p>
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

        {/* Form Fields Preview */}
        <div className="p-6 space-y-4 text-sm">
          <div className="bg-purple-50 border border-purple-200 text-purple-700 p-3 rounded-xl text-xs font-medium flex items-start space-x-2">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>
              This modal establishes the visual entry point for OPD patient registration. Patient creation persistence will be enabled in future phases.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Rajesh Kumar"
              disabled
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed opacity-75"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UHID / ABHA</label>
              <input
                type="text"
                placeholder="AUTO-GENERATED"
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed opacity-75"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
              <input
                type="text"
                placeholder="9876543210"
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed opacity-75"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="text"
                placeholder="35"
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed opacity-75"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <input
                type="text"
                placeholder="Male"
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed opacity-75"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <input
                type="text"
                placeholder="NORMAL"
                disabled
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-500 cursor-not-allowed opacity-75"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled
            className="px-4 py-2 bg-purple-600 text-white font-semibold text-xs rounded-xl opacity-60 cursor-not-allowed"
          >
            Add Patient
          </button>
        </div>
      </div>
    </div>
  );
};
