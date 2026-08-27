import React, { useState, useEffect } from "react";
import { X, Calendar, UserPlus, AlertTriangle } from "lucide-react";
import axios from "axios";

interface ModalProps {
  mode: "BOOK" | "REGISTER_AND_BOOK";
  onClose: () => void;
  onSuccess: () => void;
}

interface PatientOption {
  id: string;
  name: string;
  UHID: string;
  mobile: string;
}

interface DoctorOption {
  id: string;
  name: string;
  department?: string;
}

export const NewAppointmentModal: React.FC<ModalProps> = ({
  mode,
  onClose,
  onSuccess
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing Patient Search
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);

  // Doctors list
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [department, setDepartment] = useState("General Medicine");
  const [type, setType] = useState("ROUTINE");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    return nextHour.toISOString().slice(0, 16);
  });

  // New Patient Form Fields
  const [regName, setRegName] = useState("");
  const [regGender, setRegGender] = useState("Male");
  const [regMobile, setRegMobile] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regAge, setRegAge] = useState<number | "">("");
  const [regBloodGroup, setRegBloodGroup] = useState("");

  useEffect(() => {
    // Fetch Doctors list
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/queue", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success && res.data.data.doctors) {
          setDoctors(res.data.data.doctors);
          if (res.data.data.doctors.length > 0) {
            setSelectedDoctorId(res.data.data.doctors[0].id);
            if (res.data.data.doctors[0].department) {
              setDepartment(res.data.data.doctors[0].department);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load doctors list", err);
      }
    };

    fetchDoctors();
  }, []);

  // Search Patients
  useEffect(() => {
    if (!patientSearch || patientSearch.trim().length < 2 || mode !== "BOOK") {
      setPatientResults([]);
      return;
    }

    const searchPatients = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/history?search=${encodeURIComponent(patientSearch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setPatientResults(res.data.data);
        }
      } catch (err) {
        console.error("Patient search error", err);
      }
    };

    const timeout = setTimeout(searchPatients, 300);
    return () => clearTimeout(timeout);
  }, [patientSearch, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      if (mode === "BOOK") {
        if (!selectedPatient) {
          setError("Please search and select a patient");
          setSubmitting(false);
          return;
        }

        const res = await axios.post(
          "/api/appointments",
          {
            patientId: selectedPatient.id,
            doctorId: selectedDoctorId,
            department,
            type,
            scheduledAt: new Date(scheduledAt).toISOString()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.success) {
          onSuccess();
          onClose();
        }
      } else {
        // mode === "REGISTER_AND_BOOK"
        if (!regName || !regMobile) {
          setError("Patient full name and mobile number are required");
          setSubmitting(false);
          return;
        }

        const res = await axios.post(
          "/api/appointments/register-and-book",
          {
            name: regName,
            gender: regGender,
            mobile: regMobile,
            email: regEmail || undefined,
            age: regAge ? Number(regAge) : undefined,
            bloodGroup: regBloodGroup || undefined,
            doctorId: selectedDoctorId,
            department,
            type,
            scheduledAt: new Date(scheduledAt).toISOString()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.success) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to process appointment booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              {mode === "BOOK" ? <Calendar className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {mode === "BOOK" ? "Book New Appointment" : "Register Patient & Book Appointment"}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === "BOOK" ? "Schedule a consultation for an existing registered patient" : "Register a new OPD patient and assign an appointment slot"}
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Booking Failure</div>
                <div className="text-xs text-rose-300/90 mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {/* Mode BOOK: Patient Search */}
          {mode === "BOOK" ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Registered Patient *
              </label>
              {selectedPatient ? (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-100">{selectedPatient.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{selectedPatient.UHID} • Mobile: {selectedPatient.mobile}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by Patient Name, UHID, or Mobile..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {patientResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-800">
                      {patientResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatientResults([]);
                            setPatientSearch("");
                          }}
                          className="w-full text-left p-2.5 hover:bg-slate-800 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-100 text-xs">{p.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{p.UHID}</div>
                          </div>
                          <span className="text-[11px] font-mono text-purple-400">{p.mobile}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Mode REGISTER_AND_BOOK: New Patient Fields */
            <div className="space-y-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">New Patient Demographics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Mobile Number *</label>
                  <input
                    type="text"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    required
                    placeholder="9876543210"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Gender *</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Age</label>
                  <input
                    type="number"
                    value={regAge}
                    onChange={(e) => setRegAge(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="e.g. 42"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Blood Group</label>
                  <input
                    type="text"
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    placeholder="e.g. O+"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Doctor & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Assigned Physician *
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  const doc = doctors.find((d) => d.id === e.target.value);
                  if (doc?.department) setDepartment(doc.department);
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.department ? `(${d.department})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Department *
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Type & Scheduled Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Appointment Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="ROUTINE">Routine Consultation</option>
                <option value="FOLLOW_UP">Follow-Up Visit</option>
                <option value="EMERGENCY">Emergency Priority</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Footer Submit Button */}
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
              {submitting ? "Booking Appointment..." : "Confirm & Book Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
