import React, { useState } from "react";
import { Stethoscope, UserPlus, Clock, MoreVertical, FileText, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface DoctorStationHeaderProps {
  onOpenAddPatient: () => void;
  onOpenHistory: () => void;
  onViewFullHistory?: () => void;
}

export const DoctorStationHeader: React.FC<DoctorStationHeaderProps> = ({
  onOpenAddPatient,
  onOpenHistory,
  onViewFullHistory
}) => {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const doctorName = user?.name
    ? user.name.startsWith("Dr.")
      ? user.name
      : `Dr. ${user.name}`
    : "Dr. Rohan Sharma";

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
          <Stethoscope className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Doctor Station</h1>
            <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
              {doctorName}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Physician OPD Consultation Workspace
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 relative">
        {/* Add Patient Button */}
        <button
          type="button"
          onClick={onOpenAddPatient}
          className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl border border-purple-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Patient</span>
        </button>

        {/* History / Clock Icon Button */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          title="Patient History Timeline"
        >
          <Clock className="w-4 h-4" />
        </button>

        {/* Three-Dot Menu Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Station Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  if (onViewFullHistory) {
                    onViewFullHistory();
                  } else {
                    onOpenHistory();
                  }
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center space-x-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Patient File</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center space-x-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Station Preferences</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
