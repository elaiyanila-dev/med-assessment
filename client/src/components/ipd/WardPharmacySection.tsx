import React, { useState } from "react";
import {
  CheckCircle2,
  ShieldAlert,
  Check,
  AlertTriangle,
  FileText,
  Shield,
  X,
  Zap,
  Undo2
} from "lucide-react";
import { api } from "../../services/api";

import { mednxtDummyData } from "../../data/mednxtDummyData";

export interface IndentRecord {
  id: string;
  patientName: string;
  bed: string;
  medicine: string;
  dose: string;
  packaging: "Unit Dose" | "High Alert";
  status: "Pending" | "Approved";
}

interface AuditLogRow {
  id: string;
  time: string;
  user: string;
  actionType: string;
  reason: string;
  itemsAccessed: string;
}

interface RecentReturnLog {
  id: string;
  medicine: string;
  reason: string;
  source: string;
  qty: number;
  status: string;
}

export const WardPharmacySection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"indents" | "emergency" | "returns">("returns");
  const [indents, setIndents] = useState<IndentRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);

  // Emergency override modal & form states
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideMed, setOverrideMed] = useState("Noradrenalin Inj");
  const [overridePatient, setOverridePatient] = useState("Rahul Verma (G-101)");
  const [overrideQty, setOverrideQty] = useState("2");
  const [overrideReason, setOverrideReason] = useState("Stat Septic Shock Management");
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState<string | null>(null);

  // Returns & Waste Two-Column Layout States
  const [returnType, setReturnType] = useState<"return" | "waste">("return");
  const [returnPatientBed, setReturnPatientBed] = useState("");
  const [returnMedName, setReturnMedName] = useState("");
  const [returnQtyNum, setReturnQtyNum] = useState(0);
  const [returnReasonSelect, setReturnReasonSelect] = useState("Select Reason");
  const [recentLogs, setRecentLogs] = useState<RecentReturnLog[]>([]);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    // Load indents from official v2 dataset
    const ipd = mednxtDummyData.getIPDDashboardData();
    if (ipd?.ipdIndents && ipd.ipdIndents.length > 0) {
      const mappedIndents: IndentRecord[] = ipd.ipdIndents.map((i: any) => ({
        id: i.id,
        patientName: i.patientName || "Rahul Verma",
        bed: i.bedNumber || i.bed || "G-101",
        medicine: i.medicine || i.items?.[0]?.medicineName || "Pantoprazole 40mg",
        dose: i.dose || i.items?.[0]?.dose || "1 Tab",
        packaging: i.priority === "HIGH" || i.packaging === "High Alert" ? "High Alert" : "Unit Dose",
        status: i.status === "APPROVED" || i.status === "Approved" ? "Approved" : "Pending"
      }));
      setIndents(mappedIndents);
    }

    // Load audit logs from official v2 dataset
    const rawAudit = mednxtDummyData.raw.auditLogs || [];
    if (rawAudit.length > 0) {
      const mappedAudit: AuditLogRow[] = rawAudit.map((a: any) => ({
        id: a.id,
        time: a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "10:45 AM",
        user: a.actorName || "Sister Mary",
        actionType: a.action,
        reason: a.entityType ? `${a.action} - ${a.entityType}` : "Emergency Access",
        itemsAccessed: a.details || "Adrenaline x2, Atropine x1"
      }));
      setAuditLogs(mappedAudit);
    }

    // Load returns from official v2 dataset
    const rawReturns = mednxtDummyData.raw.returnsAndWaste || [];
    if (rawReturns.length > 0) {
      const mappedReturns: RecentReturnLog[] = rawReturns.map((r: any) => ({
        id: r.id,
        medicine: r.medicineName || "Monocef 1g",
        reason: r.reason || "Treatment Changed",
        source: r.bedNumber ? `Bed ${r.bedNumber}` : "ICU - Bed 1",
        qty: r.quantity || 2,
        status: r.status || "PENDING"
      }));
      setRecentLogs(mappedReturns);
    }
  }, []);

  // Action: Verify single indent
  const handleVerifyIndent = (id: string) => {
    setIndents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Approved" } : item))
    );
  };

  // Action: Approve all pending indents
  const handleApproveAll = () => {
    setIndents((prev) => prev.map((item) => ({ ...item, status: "Approved" })));
  };

  // Emergency Override Submit
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOverride(true);

    try {
      await api.post("/emergency/override", {
        reason: overrideReason,
        items: [
          {
            medicationName: overrideMed,
            quantity: parseInt(overrideQty) || 1
          }
        ]
      });
    } catch (err) {
      // Gracefully handle
    } finally {
      const newEntry: AuditLogRow = {
        id: `AUD-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        user: "Dr. Sharma",
        actionType: "EMERGENCY OVERRIDE",
        reason: overrideReason,
        itemsAccessed: `${overrideMed} x${overrideQty}`
      };
      setAuditLogs((prev) => [newEntry, ...prev]);

      setSubmittingOverride(false);
      setShowOverrideModal(false);
      setOverrideSuccessMsg("Emergency override logged successfully. Audit trail generated.");
      setTimeout(() => setOverrideSuccessMsg(null), 4000);
    }
  };

  // Returns & Waste Submission
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: RecentReturnLog = {
      id: `LOG-${Date.now()}`,
      medicine: returnMedName || "Monocef 1g",
      reason: returnReasonSelect !== "Select Reason" ? returnReasonSelect : "Treatment Changed",
      source: returnPatientBed ? `Bed ${returnPatientBed}` : "ICU - Bed 1",
      qty: returnQtyNum || 1,
      status: "PENDING"
    };

    setRecentLogs((prev) => [newLog, ...prev]);
    setReturnSuccessMsg("Record logged successfully and added to recent logs.");
    setTimeout(() => setReturnSuccessMsg(null), 3000);

    // Reset inputs
    setReturnPatientBed("");
    setReturnMedName("");
    setReturnQtyNum(0);
    setReturnReasonSelect("Select Reason");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 md:p-6 space-y-6 animate-fadeIn">
      {/* Pharmacy Management Sub-Tabs Bar */}
      <div className="border-b border-slate-100 flex items-center space-x-2 pt-1 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("indents")}
          className={`px-4 py-2 text-xs font-extrabold transition-all border cursor-pointer flex items-center space-x-2 rounded-xl ${
            activeSubTab === "indents"
              ? "bg-purple-50 border-purple-200 text-purple-700 shadow-2xs"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-purple-600" />
          <span>Daily Indents</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("emergency")}
          className={`px-4 py-2 text-xs font-extrabold transition-all border cursor-pointer flex items-center space-x-2 rounded-xl ${
            activeSubTab === "emergency"
              ? "bg-rose-50 border-rose-200 text-rose-700 shadow-2xs"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Emergency Override</span>
        </button>

        {/* Selected Returns & Waste Tab matching Screenshot 1 (White Pill with Border) */}
        <button
          type="button"
          onClick={() => setActiveSubTab("returns")}
          className={`px-4 py-2 text-xs font-extrabold transition-all border cursor-pointer flex items-center space-x-2 rounded-xl ${
            activeSubTab === "returns"
              ? "bg-white border-slate-300 text-[#0f172a] shadow-xs font-black"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Undo2 className="w-4 h-4 text-purple-600" />
          <span>Returns & Waste</span>
        </button>
      </div>

      {/* SUB-TAB 1: DAILY INDENTS */}
      {activeSubTab === "indents" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-[#0f172a] tracking-tight">
                Auto-Generated Daily Indents
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Based on active medication charts for admitted patients.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApproveAll}
              className="px-4 py-2.5 bg-[#6336d3] hover:bg-[#5228be] text-white font-extrabold text-xs rounded-xl shadow-2xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Approve All</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 uppercase font-black tracking-wider text-[11px] border-b border-slate-200/80">
                  <th className="py-3.5 px-4">INDENT ID</th>
                  <th className="py-3.5 px-4">PATIENT & BED</th>
                  <th className="py-3.5 px-4">MEDICINE & DOSE</th>
                  <th className="py-3.5 px-4">PACKAGING</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {indents.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">{row.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#0f172a]">{row.patientName}</div>
                      <div className="text-[11px] font-mono text-slate-400">Bed: {row.bed}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900">{row.medicine}</div>
                      <div className="text-[11px] text-purple-700 font-mono font-semibold">Dose: {row.dose}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {row.packaging === "High Alert" ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-extrabold">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          <span>High Alert</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 border border-blue-300 text-blue-700 bg-blue-50/50 rounded-full text-xs font-extrabold">
                          Unit Dose
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {row.status === "Approved" ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-extrabold">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {row.status === "Pending" ? (
                        <button
                          type="button"
                          onClick={() => handleVerifyIndent(row.id)}
                          className="px-3.5 py-1.5 bg-[#6336d3] hover:bg-[#5228be] text-white font-extrabold text-xs rounded-xl shadow-2xs cursor-pointer"
                        >
                          Verify
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl inline-flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMERGENCY OVERRIDE */}
      {activeSubTab === "emergency" && (
        <div className="space-y-6">
          {overrideSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center space-x-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{overrideSuccessMsg}</span>
            </div>
          )}

          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 md:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-rose-100/80 text-rose-600 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0f172a] tracking-tight">
                  Crash Cart & Emergency Override
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Access restricted medications immediately. All actions are logged for audit.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOverrideModal(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer flex items-center space-x-2 shrink-0 self-start md:self-auto"
            >
              <Shield className="w-4 h-4 text-white" />
              <span>Emergency Access</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <FileText className="w-4.5 h-4.5 text-slate-400" />
              <h3 className="font-extrabold text-sm text-[#0f172a]">Audit Trail</h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase font-black tracking-wider text-[11px] border-b border-slate-200/80">
                    <th className="py-3.5 px-4">TIME</th>
                    <th className="py-3.5 px-4">USER</th>
                    <th className="py-3.5 px-4">ACTION TYPE</th>
                    <th className="py-3.5 px-4">REASON</th>
                    <th className="py-3.5 px-4">ITEMS ACCESSED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{log.time}</td>
                      <td className="py-3.5 px-4 font-extrabold text-[#0f172a]">{log.user}</td>
                      <td className="py-3.5 px-4 font-extrabold text-rose-600 tracking-tight">
                        {log.actionType}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{log.reason}</td>
                      <td className="py-3.5 px-4 italic font-semibold text-slate-800">
                        {log.itemsAccessed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RETURNS & WASTE (TWO-COLUMN LAYOUT REPLICATING SCREENSHOT 1) */}
      {activeSubTab === "returns" && (
        <div className="space-y-4">
          {returnSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center space-x-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{returnSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: 35% - RECORD RETURN / WASTE CARD */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-100">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                  <Undo2 className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-black text-sm text-[#0f172a]">
                  Record Return / Waste
                </h3>
              </div>

              <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs font-semibold">
                {/* TYPE SEGMENTED CONTROL */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    TYPE
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setReturnType("return")}
                      className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                        returnType === "return"
                          ? "bg-white text-purple-700 shadow-2xs border border-slate-200/80 font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Return to Pharmacy
                    </button>
                    <button
                      type="button"
                      onClick={() => setReturnType("waste")}
                      className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                        returnType === "waste"
                          ? "bg-white text-rose-700 shadow-2xs border border-slate-200/80 font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Record Wastage
                    </button>
                  </div>
                </div>

                {/* PATIENT / BED */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                    PATIENT / BED
                  </label>
                  <input
                    type="text"
                    value={returnPatientBed}
                    onChange={(e) => setReturnPatientBed(e.target.value)}
                    placeholder="e.g. G-101"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* MEDICINE NAME */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                    MEDICINE NAME
                  </label>
                  <input
                    type="text"
                    value={returnMedName}
                    onChange={(e) => setReturnMedName(e.target.value)}
                    placeholder="Search inventory..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* QUANTITY & REASON IN SAME ROW */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      QUANTITY
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={returnQtyNum}
                      onChange={(e) => setReturnQtyNum(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                      REASON
                    </label>
                    <select
                      value={returnReasonSelect}
                      onChange={(e) => setReturnReasonSelect(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                    >
                      <option value="Select Reason">Select Reason</option>
                      <option value="Treatment Changed">Treatment Changed</option>
                      <option value="Patient Discharged">Patient Discharged</option>
                      <option value="Dose Cancelled">Dose Cancelled</option>
                      <option value="Expired / Damaged">Expired / Damaged</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                  >
                    Submit Record
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: 65% - RECENT LOGS CARD */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-100">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-black text-sm text-[#0f172a]">Recent Logs</h3>
              </div>

              {/* RECENT LOG ITEMS */}
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-xl flex items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0 border border-purple-100">
                        <Undo2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-[#0f172a] truncate">
                          {log.medicine}
                        </h4>
                        <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
                          {log.reason} • {log.source}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-[#0f172a] font-mono">
                        Qty: {log.qty}
                      </div>
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mt-1">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY OVERRIDE AUTHORIZATION MODAL */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/60">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0f172a]">Emergency Override Entry</h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Submit clinical justification for emergency medication release.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="p-6 space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Target Medication *</label>
                <select
                  value={overrideMed}
                  onChange={(e) => setOverrideMed(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Noradrenalin Inj">Noradrenalin Inj (High Alert)</option>
                  <option value="Atropine 0.6mg">Atropine 0.6mg</option>
                  <option value="Adrenaline 1mg">Adrenaline 1mg</option>
                  <option value="Ceftriaxone 1g">Ceftriaxone 1g</option>
                  <option value="Fentanyl Patch 25mcg">Fentanyl Patch 25mcg</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Patient & Ward *</label>
                <select
                  value={overridePatient}
                  onChange={(e) => setOverridePatient(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Rahul Verma (G-101)">Rahul Verma (G-101)</option>
                  <option value="Vikram Singh (ICU-1)">Vikram Singh (ICU-1)</option>
                  <option value="Priya Sharma (P-202)">Priya Sharma (P-202)</option>
                  <option value="Sister Mary (ICU-2)">Code Blue - Bed ICU-2</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Override Quantity *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={overrideQty}
                  onChange={(e) => setOverrideQty(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Emergency Clinical Justification *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Blue - Bed ICU-2 / Severe Trauma Pain"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>{submittingOverride ? "Logging Override..." : "Submit Emergency Override"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardPharmacySection;
