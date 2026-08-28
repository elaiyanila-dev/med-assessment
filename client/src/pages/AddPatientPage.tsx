import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "../services/api";

export const AddPatientPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [department, setDepartment] = useState("General Medicine");

  // UI Status State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.post("/patients", {
        name,
        gender,
        mobile,
        email: email || undefined,
        age: age ? Number(age) : undefined,
        bloodGroup: bloodGroup || undefined,
        address: address || undefined,
        priority,
        department
      });

      if (res.data?.success) {
        setSuccessMsg(`Patient profile "${name}" successfully registered! Redirecting to queue...`);
        setTimeout(() => {
          navigate("/patient-queue");
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to create new patient record");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-9 max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/patient-queue"
          className="inline-flex items-center space-x-2 text-xs font-extrabold text-slate-500 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Patient Queue</span>
        </Link>
      </div>

      {/* Page Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0f172a] tracking-tight">
              Add New Patient
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Create a new Master Patient Index (MPI) record and queue profile.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/patient-queue")}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer self-start md:self-auto"
        >
          Cancel
        </button>
      </div>

      {/* Notification Banners */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Registration Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">
              Patient Demographic Information
            </h2>
            <p className="text-xs font-medium text-slate-400">
              Fields marked with an asterisk (*) are mandatory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Rajesh Kumar"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Mobile Contact */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Mobile Contact *
              </label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                placeholder="e.g. 9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Age (years)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="e.g. 35"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Blood Group
              </label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="e.g. O+"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Priority</option>
                <option value="EMERGENCY">Emergency Priority</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="General Medicine"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Full Residential Address */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Residential Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="Full residential address details"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/patient-queue")}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Creating Patient..." : "Create Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
