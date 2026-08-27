import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  fullPage?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullPage = false,
  message = "Loading MedNxt Hospitals..."
}) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-700 animate-spin" />
          <p className="text-sm font-medium text-slate-700">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 space-x-2 text-slate-500">
      <Loader2 className="w-5 h-5 text-purple-700 animate-spin" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
