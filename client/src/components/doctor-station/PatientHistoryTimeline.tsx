import React, { useState, useEffect } from "react";
import { Activity, Download, ChevronDown, ChevronUp, Clock, FileSpreadsheet, CheckCircle2, FileText, Stethoscope, Bed, UserCheck, HeartPulse } from "lucide-react";

export type EventType =
  | "lab_order"
  | "discharge"
  | "lab_report"
  | "procedure"
  | "admission"
  | "consultation"
  | "vitals_check";

export interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  actor: string;
  timestamp: string;
  description: string;
}

interface PatientHistoryTimelineProps {
  patientId?: string | null;
  patientName?: string;
  patientUHID?: string;
  timeline?: any[];
  existingLabOrders?: any[];
  existingPrescriptions?: any[];
}

const DEFAULT_TIMELINE_EVENTS: Record<string, TimelineEvent[]> = {
  "PAT-001": [
    {
      id: "EVT-101",
      type: "lab_order",
      title: "Lab Order",
      actor: "Dr. Sharma",
      timestamp: "2026-08-26T18:29:00Z",
      description: "Ordered: KFT"
    },
    {
      id: "EVT-102",
      type: "lab_order",
      title: "Lab Order",
      actor: "Dr. Sharma",
      timestamp: "2026-08-26T18:28:00Z",
      description: "Ordered: TSH"
    },
    {
      id: "EVT-103",
      type: "lab_order",
      title: "Lab Order",
      actor: "Dr. Sharma",
      timestamp: "2026-08-26T18:26:00Z",
      description: "Ordered: CBC"
    },
    {
      id: "EVT-104",
      type: "discharge",
      title: "Discharge",
      actor: "Dr. Sharma",
      timestamp: "2023-10-15T20:00:00Z",
      description: "Patient discharged. Vitals stable. Prescribed home meds."
    },
    {
      id: "EVT-105",
      type: "lab_report",
      title: "Lab Report",
      actor: "Lab Tech",
      timestamp: "2023-10-14T15:30:00Z",
      description: "Blood Test Results: WBC Normal, Platelets 1.5L. Malaria Negative."
    },
    {
      id: "EVT-106",
      type: "procedure",
      title: "Procedure",
      actor: "Sister Mary",
      timestamp: "2023-10-13T23:30:00Z",
      description: "Evening Rounds: BP 118/78. Diet tolerated well."
    },
    {
      id: "EVT-107",
      type: "procedure",
      title: "Procedure",
      actor: "Dr. Verma",
      timestamp: "2023-10-13T14:30:00Z",
      description: "Morning Rounds: Fever subsided. Chest clear on auscultation."
    },
    {
      id: "EVT-108",
      type: "admission",
      title: "Admission",
      actor: "Dr. Sharma",
      timestamp: "2023-10-12T16:30:00Z",
      description: "Admitted to General Ward Male, Bed G-102. IV fluids started."
    },
    {
      id: "EVT-109",
      type: "consultation",
      title: "Consultation",
      actor: "Dr. Sharma",
      timestamp: "2023-10-12T15:45:00Z",
      description: "Diagnosed with Viral Fever & Dehydration. Recommended Admission."
    },
    {
      id: "EVT-110",
      type: "vitals_check",
      title: "Vitals Check",
      actor: "Nurse Anjali",
      timestamp: "2023-10-12T15:15:00Z",
      description: "Initial Triage Vitals recorded: BP 120/80 mmHg, SpO2 98%, Temp 98.6°F, Weight 65 kg."
    }
  ]
};

export const PatientHistoryTimeline: React.FC<PatientHistoryTimelineProps> = ({
  patientId,
  patientName = "Patient",
  patientUHID = "ABHA-1234",
  timeline: _timeline = [],
  existingLabOrders = [],
  existingPrescriptions = []
}) => {
  const pid = patientId || "PAT-001";

  // Base timeline events for this patient
  const baseEvents: TimelineEvent[] =
    DEFAULT_TIMELINE_EVENTS[pid] || DEFAULT_TIMELINE_EVENTS["PAT-001"];

  // Dynamically map existingLabOrders to timeline events
  const dynamicLabEvents: TimelineEvent[] = (existingLabOrders || []).map((order: any, idx: number) => {
    const testNames = Array.isArray(order.items)
      ? order.items.map((i: any) => i.test?.name || i.test?.code || "Lab Test").join(", ")
      : "Lab Test";
    return {
      id: `DYN-LAB-${order.id || idx}`,
      type: "lab_order" as EventType,
      title: "Lab Order",
      actor: "Dr. Sharma",
      timestamp: order.createdAt || new Date().toISOString(),
      description: `Ordered: ${testNames}`
    };
  });

  // Dynamically map existingPrescriptions to timeline events
  const dynamicRxEvents: TimelineEvent[] = (existingPrescriptions || []).map((rx: any, idx: number) => {
    const medNames = Array.isArray(rx.items)
      ? rx.items.map((i: any) => i.medicine?.name || i.medicineName || "Medication").join(", ")
      : "Medication";
    return {
      id: `DYN-RX-${rx.id || idx}`,
      type: "procedure" as EventType,
      title: "Prescription Issued",
      actor: "Dr. Sharma",
      timestamp: rx.createdAt || new Date().toISOString(),
      description: `Issued e-Rx: ${medNames}`
    };
  });

  // Combine & deduplicate all events
  const allEventsMap = new Map<string, TimelineEvent>();
  [...dynamicLabEvents, ...dynamicRxEvents, ...baseEvents].forEach((evt) => {
    allEventsMap.set(evt.id, evt);
  });

  const mergedEvents = Array.from(allEventsMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // LEVEL 2 Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Reset category filter when selected patient changes
  useEffect(() => {
    setSelectedCategory("all");
  }, [patientId]);

  // Filter events based on selected category
  const filteredEvents = mergedEvents.filter((evt) => {
    if (selectedCategory === "all") return true;
    const typeStr = (evt.type || "").toLowerCase();
    const titleStr = (evt.title || "").toLowerCase();

    if (selectedCategory === "consultation") {
      return typeStr.includes("consultation") || titleStr.includes("consultation");
    }
    if (selectedCategory === "lab_report") {
      return typeStr.includes("lab") || titleStr.includes("lab");
    }
    if (selectedCategory === "admission") {
      return typeStr.includes("admission") || typeStr.includes("discharge") || titleStr.includes("admission") || titleStr.includes("discharge");
    }
    if (selectedCategory === "vitals") {
      return typeStr.includes("vitals") || titleStr.includes("vitals");
    }
    if (selectedCategory === "activity") {
      return typeStr.includes("procedure") || typeStr.includes("activity") || typeStr.includes("prescription") || titleStr.includes("procedure") || titleStr.includes("prescription");
    }
    return true;
  });

  // Expand/collapse state
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours.toString().padStart(2, "0");
      return `${month}/${day}/${year} at ${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return isoString;
    }
  };

  const getEventBadgeClass = (type: EventType) => {
    switch (type) {
      case "lab_order":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "discharge":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "lab_report":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "procedure":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "admission":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "consultation":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "vitals_check":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case "lab_order":
        return <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />;
      case "discharge":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "lab_report":
        return <FileText className="w-3.5 h-3.5 text-cyan-600" />;
      case "procedure":
        return <Stethoscope className="w-3.5 h-3.5 text-sky-600" />;
      case "admission":
        return <Bed className="w-3.5 h-3.5 text-amber-600" />;
      case "consultation":
        return <UserCheck className="w-3.5 h-3.5 text-purple-600" />;
      case "vitals_check":
        return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Export Report Handler
  const handleExportReport = () => {
    const reportHeader = `====================================================\nMEDNXT HOSPITALS - PATIENT CLINICAL TIMELINE REPORT\n====================================================\nPatient Name: ${patientName}\nABHA Number : ${patientUHID}\nExport Date : ${new Date().toLocaleString()}\nTotal Events: ${filteredEvents.length}\n====================================================\n\n`;

    const reportBody = filteredEvents
      .map(
        (e, idx) =>
          `[${idx + 1}] ${e.title.toUpperCase()} (${formatDate(e.timestamp)})\nActor       : ${e.actor}\nDescription : ${e.description}\n----------------------------------------------------`
      )
      .join("\n\n");

    const fullContent = reportHeader + reportBody;
    const blob = new Blob([fullContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Patient_Timeline_Report_${patientUHID || "PATIENT"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* LEVEL 2: EVENT FILTER BUTTONS ROW */}
      <div className="flex items-center justify-end border border-slate-200/80 bg-white rounded-2xl p-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "consultation", label: "Consultation" },
            { id: "lab_report", label: "Lab Report" },
            { id: "admission", label: "Admission" },
            { id: "vitals", label: "Vitals" },
            { id: "activity", label: "Activity" }
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-purple-100 text-purple-700 font-extrabold border border-purple-200 shadow-2xs"
                    : "bg-white hover:bg-slate-50 text-slate-600 font-bold border border-slate-200/80"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Patient Timeline Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shrink-0">
            <Activity className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="font-black text-lg text-[#0f172a] tracking-tight">
              Patient Timeline
            </h3>
            <p className="text-xs font-semibold text-slate-400">
              Comprehensive activity log from registration to discharge
            </p>
          </div>
        </div>

        {/* Export Report Action Button */}
        <button
          type="button"
          onClick={handleExportReport}
          className="px-4 py-2.5 bg-[#6336d3] hover:bg-[#5228be] active:bg-[#461fa8] text-white font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center space-x-2 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Inline Timeline Content Area */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-center text-xs font-semibold text-slate-400">
          No historical events recorded for this patient under "{selectedCategory}".
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 border-l-2 border-slate-200 ml-3 py-1">
          {filteredEvents.map((evt) => {
            const isCollapsed = collapsedIds.has(evt.id);
            const badgeClass = getEventBadgeClass(evt.type);
            const icon = getEventIcon(evt.type);

            return (
              <div key={evt.id} className="relative group">
                {/* Node Dot */}
                <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-purple-500 shadow-2xs flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                  {icon}
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-all space-y-2.5">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <h4 className="font-black text-sm text-[#0f172a]">{evt.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badgeClass}`}>
                        {evt.actor}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCollapse(evt.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={isCollapsed ? "Expand" : "Collapse"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Timestamp Row */}
                  <div className="flex items-center space-x-1.5 text-slate-400 font-semibold text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(evt.timestamp)}</span>
                  </div>

                  {/* Expandable Content Box */}
                  {!isCollapsed && (
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 text-xs font-semibold text-slate-800 leading-relaxed">
                      {evt.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientHistoryTimeline;
