import React, { useState, useEffect } from "react";
import { Clock, Sun, Sunset, Moon, Eye, Phone, Plus, UserCheck, ShieldCheck, CheckCircle2, X } from "lucide-react";

export interface NurseRosterItem {
  id: string;
  name: string;
  role: string;
  ward: string;
  patientCount: number;
  mobile: string;
  shift: "morning" | "evening" | "night";
}

interface NurseScheduleSectionProps {
  onAssignStaffClick?: () => void;
}

const INITIAL_ROSTER: NurseRosterItem[] = [
  {
    id: "NUR-001",
    name: "Sister Mary",
    role: "Staff Nurse",
    ward: "General Ward Male",
    patientCount: 1,
    mobile: "+91 9876543210",
    shift: "morning"
  },
  {
    id: "NUR-002",
    name: "Bro. John",
    role: "ICU Nurse Specialist",
    ward: "ICU",
    patientCount: 0,
    mobile: "+91 9876543211",
    shift: "morning"
  },
  {
    id: "NUR-003",
    name: "Sister Anjali",
    role: "Senior Charge Nurse",
    ward: "Private Ward",
    patientCount: 1,
    mobile: "+91 9876543212",
    shift: "evening"
  },
  {
    id: "NUR-004",
    name: "Sister Kavita",
    role: "Night Duty Incharge",
    ward: "General Ward Female",
    patientCount: 0,
    mobile: "+91 9876543213",
    shift: "night"
  }
];

export const NurseScheduleSection: React.FC<NurseScheduleSectionProps> = ({ onAssignStaffClick }) => {
  const [selectedShift, setSelectedShift] = useState<"morning" | "evening" | "night">("evening");
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [roster, setRoster] = useState<NurseRosterItem[]>(INITIAL_ROSTER);

  const [viewNurse, setViewNurse] = useState<NurseRosterItem | null>(null);
  const [callNurse, setCallNurse] = useState<NurseRosterItem | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);

  // New staff form state
  const [newNurseName, setNewNurseName] = useState("");
  const [newNurseWard, setNewNurseWard] = useState("General Ward Male");
  const [newNurseShift, setNewNurseShift] = useState<"morning" | "evening" | "night">("morning");

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current live shift automatically from current hour
  const getCurrentSystemShift = (): "morning" | "evening" | "night" => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 16) return "morning";
    if (hour >= 16 && hour < 23) return "evening";
    return "night";
  };

  const liveShift = getCurrentSystemShift();

  const handleAddNurse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNurseName.trim()) return;

    const newItem: NurseRosterItem = {
      id: `NUR-${Date.now()}`,
      name: newNurseName.trim(),
      role: "Staff Nurse",
      ward: newNurseWard,
      patientCount: 0,
      mobile: "+91 9876500000",
      shift: newNurseShift
    };

    setRoster((prev) => [...prev, newItem]);
    setNewNurseName("");
    setIsAssignModalOpen(false);
  };

  const morningNurses = roster.filter((n) => n.shift === "morning");
  const eveningNurses = roster.filter((n) => n.shift === "evening");
  const nightNurses = roster.filter((n) => n.shift === "night");

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Real-time Roster Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-black text-[#0f172a] tracking-tight">Real-time Roster</h2>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block" title="Live Duty Tracking" />
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Current System Time: {currentTime}</span>
          </p>
        </div>

        {/* Shift Selector Buttons & Assign Staff Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setSelectedShift("morning")}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedShift === "morning"
                  ? "bg-purple-100 text-purple-700 font-extrabold border border-purple-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 font-bold"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Morning</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedShift("evening")}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedShift === "evening"
                  ? "bg-purple-100 text-purple-700 font-extrabold border border-purple-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 font-bold"
              }`}
            >
              <Sunset className="w-3.5 h-3.5 text-orange-500" />
              <span>Evening</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedShift("night")}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedShift === "night"
                  ? "bg-purple-100 text-purple-700 font-extrabold border border-purple-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 font-bold"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Night</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Assign Staff</span>
          </button>
        </div>
      </div>

      {/* THREE HORIZONTAL SHIFT CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* CARD 1: MORNING SHIFT */}
        <div
          className={`bg-white rounded-2xl border p-5 space-y-4 shadow-2xs transition-all flex flex-col justify-between ${
            selectedShift === "morning" || liveShift === "morning"
              ? "border-purple-300 bg-purple-50/20 shadow-xs ring-1 ring-purple-200"
              : "border-slate-200/80"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0f172a]">Morning Shift</h3>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">08:00 - 16:00</span>
                </div>
              </div>

              {liveShift === "morning" && (
                <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                  LIVE
                </span>
              )}
            </div>

            {/* Morning Nurses List */}
            <div className="space-y-3">
              {morningNurses.map((nurse) => (
                <div
                  key={nurse.id}
                  className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-white transition-all shadow-2xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-xs shrink-0 border border-purple-200">
                      {nurse.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-[#0f172a] truncate">{nurse.name}</h4>
                      <p className="text-[11px] font-semibold text-slate-500 truncate">{nurse.ward}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-extrabold whitespace-nowrap">
                      {nurse.patientCount} Patients
                    </span>

                    <button
                      type="button"
                      onClick={() => setViewNurse(nurse)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCallNurse(nurse)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Call Nurse"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: EVENING SHIFT (LIVE HIGHLIGHTED) */}
        <div
          className={`bg-white rounded-2xl border p-5 space-y-4 shadow-2xs transition-all flex flex-col justify-between ${
            selectedShift === "evening" || liveShift === "evening"
              ? "border-purple-400 bg-purple-50/40 shadow-xs ring-2 ring-purple-300/80"
              : "border-slate-200/80"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-200">
                  <Sunset className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0f172a]">Evening Shift</h3>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">16:00 - 23:00</span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse shadow-2xs">
                LIVE
              </span>
            </div>

            {/* Evening Nurses List */}
            <div className="space-y-3">
              {eveningNurses.map((nurse) => (
                <div
                  key={nurse.id}
                  className="p-3.5 bg-white rounded-xl border border-purple-200/80 flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs">
                      {nurse.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-[#0f172a] truncate">{nurse.name}</h4>
                      <p className="text-[11px] font-semibold text-slate-500 truncate">{nurse.ward}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-full text-[10px] font-extrabold whitespace-nowrap">
                      {nurse.patientCount} Patients
                    </span>

                    <button
                      type="button"
                      onClick={() => setViewNurse(nurse)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCallNurse(nurse)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Call Nurse"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: NIGHT SHIFT */}
        <div
          className={`bg-white rounded-2xl border p-5 space-y-4 shadow-2xs transition-all flex flex-col justify-between ${
            selectedShift === "night" || liveShift === "night"
              ? "border-purple-300 bg-purple-50/20 shadow-xs ring-1 ring-purple-200"
              : "border-slate-200/80"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[#0f172a]">Night Shift</h3>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">23:00 - 08:00</span>
                </div>
              </div>

              {liveShift === "night" && (
                <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider animate-pulse">
                  LIVE
                </span>
              )}
            </div>

            {/* Night Nurses List */}
            <div className="space-y-3">
              {nightNurses.map((nurse) => (
                <div
                  key={nurse.id}
                  className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-white transition-all shadow-2xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-xs shrink-0 border border-indigo-200">
                      {nurse.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-[#0f172a] truncate">{nurse.name}</h4>
                      <p className="text-[11px] font-semibold text-slate-500 truncate">{nurse.ward}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-extrabold whitespace-nowrap">
                      {nurse.patientCount} Patients
                    </span>

                    <button
                      type="button"
                      onClick={() => setViewNurse(nurse)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCallNurse(nurse)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Call Nurse"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Nurse Assignment Details Modal */}
      {viewNurse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden space-y-4">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-[#0f172a]">Nurse Duty Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewNurse(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-1">
                <p className="font-extrabold text-sm text-purple-950">{viewNurse.name}</p>
                <p className="text-purple-700 font-semibold">{viewNurse.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700 font-semibold">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Assigned Ward</span>
                  <span className="font-bold text-slate-900">{viewNurse.ward}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Active Patients</span>
                  <span className="font-bold text-purple-700">{viewNurse.patientCount}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Contact Mobile</span>
                <span className="font-mono font-bold text-slate-800">{viewNurse.mobile}</span>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewNurse(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Call Nurse Prompt Modal */}
      {callNurse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f172a]">Contact Nurse</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Initiating priority audio call to {callNurse.name} ({callNurse.ward})
              </p>
              <p className="font-mono text-sm font-extrabold text-emerald-700 mt-2">{callNurse.mobile}</p>
            </div>

            <button
              type="button"
              onClick={() => setCallNurse(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer"
            >
              End Call / Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Modal 3: Assign Staff Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-[#0f172a]">Assign Nurse to Shift Roster</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNurse} className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Nurse Staff Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sister Reshma"
                  value={newNurseName}
                  onChange={(e) => setNewNurseName(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Ward Assignment</label>
                <select
                  value={newNurseWard}
                  onChange={(e) => setNewNurseWard(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="General Ward Male">General Ward Male</option>
                  <option value="General Ward Female">General Ward Female</option>
                  <option value="Private Ward">Private Ward</option>
                  <option value="ICU">ICU</option>
                  <option value="Emergency Ward">Emergency Ward</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Duty Shift</label>
                <select
                  value={newNurseShift}
                  onChange={(e: any) => setNewNurseShift(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="morning">Morning (08:00 - 16:00)</option>
                  <option value="evening">Evening (16:00 - 23:00)</option>
                  <option value="night">Night (23:00 - 08:00)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl cursor-pointer"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseScheduleSection;
