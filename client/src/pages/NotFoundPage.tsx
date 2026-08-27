import React from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowLeft } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xs border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
          <p className="text-sm text-slate-500 mt-1">
            The requested module page could not be located or you may not have access to view it.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
