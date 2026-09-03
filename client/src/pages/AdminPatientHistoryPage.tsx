import React, { useMemo, useState } from "react";
import {
  Activity,
  BadgeAlert,
  Bed,
  Building2,
  CheckCircle2,
  Download,
  FileText,
  History,
  Search,
  Stethoscope,
  TrendingUp,
  UserRound
} from "lucide-react";

type PatientStatus = "ON HOLD" | "DISCHARGED" | "VITALS DONE" | "CHECKED IN" | "WAITING";

type PatientRecord = {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  mobile: string;
  abha: string;
  status: PatientStatus;
  events: number;
  allergy?: string;
  department: string;
  vitals: {
    bp: string;
    spo2: string;
    temp: string;
    weight: string;
  };
};

type TimelineItem = {
  id: string;
  kind: "activity" | "consultation" | "lab" | "admission" | "vitals" | "discharge";
  title: string;
  actor: string;
  department: string;
  date: string;
  time: string;
  description: string;
  details?: string;
};

const patients: PatientRecord[] = [
  {
    id: "rahul",
    name: "Rahul Verma",
    age: 34,
    gender: "Male",
    mobile: "9876543210",
    abha: "ABHA-1234",
    status: "DISCHARGED",
    events: 16,
    allergy: "Penicillin",
    department: "General Medicine",
    vitals: { bp: "120/80", spo2: "98", temp: "98.6", weight: "65" }
  },
  {
    id: "priya",
    name: "Priya Sharma",
    age: 28,
    gender: "Female",
    mobile: "9123456780",
    abha: "ABHA-5678",
    status: "DISCHARGED",
    events: 5,
    department: "Gynecology",
    vitals: { bp: "116/74", spo2: "99", temp: "98.4", weight: "54" }
  },
  {
    id: "vikram",
    name: "Vikram Singh",
    age: 50,
    gender: "Male",
    mobile: "7766554433",
    abha: "ABHA-7890",
    status: "DISCHARGED",
    events: 8,
    department: "Emergency",
    vitals: { bp: "138/90", spo2: "96", temp: "99.1", weight: "78" }
  },
  {
    id: "amit",
    name: "Amit Patel",
    age: 41,
    gender: "Male",
    mobile: "9988776655",
    abha: "ABHA-2345",
    status: "DISCHARGED",
    events: 3,
    department: "Endocrinology",
    vitals: { bp: "126/82", spo2: "97", temp: "98.2", weight: "71" }
  },
  {
    id: "sujata",
    name: "Sujata Rao",
    age: 62,
    gender: "Female",
    mobile: "8877665544",
    abha: "ABHA-3456",
    status: "DISCHARGED",
    events: 5,
    department: "Orthopedics",
    vitals: { bp: "122/78", spo2: "98", temp: "98.6", weight: "60" }
  },
  {
    id: "ananya",
    name: "Ananya Iyer",
    age: 37,
    gender: "Female",
    mobile: "9001112233",
    abha: "ABHA-4567",
    status: "DISCHARGED",
    events: 4,
    department: "Dermatology",
    vitals: { bp: "118/76", spo2: "99", temp: "98.5", weight: "58" }
  }
];

const timelineItems: TimelineItem[] = [
  {
    id: "held",
    kind: "activity",
    title: "Activity",
    actor: "System",
    department: "General Medicine",
    date: "9/1/2026",
    time: "12:13 PM",
    description: "Consultation Paused/Held"
  },
  {
    id: "started",
    kind: "activity",
    title: "Activity",
    actor: "System",
    department: "General Medicine",
    date: "9/1/2026",
    time: "12:12 PM",
    description: "Consultation Started"
  },
  {
    id: "discharge",
    kind: "discharge",
    title: "Discharge",
    actor: "Dr. Sharma",
    department: "General Medicine",
    date: "10/15/2023",
    time: "08:00 PM",
    description: "Patient discharged. Vitals stable. Prescribed home meds.",
    details: "instructions: Rest for 2 days. Follow up in 1 week."
  },
  {
    id: "consult",
    kind: "consultation",
    title: "Consultation",
    actor: "Dr. Sharma",
    department: "General Medicine",
    date: "10/12/2023",
    time: "09:45 AM",
    description: "Chief complaint: high fever and chills. Started symptomatic care."
  },
  {
    id: "lab",
    kind: "lab",
    title: "Lab Report",
    actor: "Pathology",
    department: "Laboratory",
    date: "10/12/2023",
    time: "02:10 PM",
    description: "CBC reviewed. Mild leukocytosis noted."
  }
];

const filters = ["All", "Consultation", "Lab Report", "Admission", "Vitals", "Activity"] as const;

function statusClass(status: PatientStatus) {
  if (status === "DISCHARGED") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "WAITING") return "bg-amber-50 text-amber-800 border-amber-200";
  if (status === "CHECKED IN") return "bg-sky-50 text-sky-800 border-sky-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function eventIcon(kind: TimelineItem["kind"]) {
  if (kind === "consultation") return <Stethoscope className="h-4 w-4" />;
  if (kind === "lab") return <FileText className="h-4 w-4" />;
  if (kind === "admission") return <Bed className="h-4 w-4" />;
  if (kind === "vitals") return <Activity className="h-4 w-4" />;
  if (kind === "discharge") return <CheckCircle2 className="h-4 w-4" />;
  return <CheckCircle2 className="h-4 w-4" />;
}

interface AdminPatientHistoryPageProps {
  initialSelectedPatientId?: string | null;
}

export const AdminPatientHistoryPage: React.FC<AdminPatientHistoryPageProps> = ({
  initialSelectedPatientId = null
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialSelectedPatientId);
  const [activeTab, setActiveTab] = useState<"timeline" | "vitals">("timeline");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("All");

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) || null;

  const filteredPatients = useMemo(() => {
    const value = searchQuery.trim().toLowerCase();
    if (!value) return patients;

    return patients.filter((patient) =>
      [patient.name, patient.abha, patient.mobile, patient.status]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [searchQuery]);

  const filteredTimeline = timelineItems.filter((item) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Lab Report") return item.kind === "lab";
    return item.kind === activeFilter.toLowerCase();
  });

  return (
    <div className="h-full min-h-[calc(100vh-72px)] overflow-hidden bg-slate-50 text-slate-800">
      <div
        className={`grid h-full min-h-[calc(100vh-72px)] grid-cols-1 ${
          selectedPatient
            ? "lg:grid-cols-[426px_minmax(0,1fr)_354px]"
            : "lg:grid-cols-[426px_minmax(0,1fr)]"
        }`}
      >
        <aside className="min-h-0 border-r border-slate-200 bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="mb-5 flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Patient Records</h1>
              </div>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search Name, UHID or Mobile..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-base font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredPatients.map((patient) => {
                const isSelected = selectedPatientId === patient.id;
                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(patient.id);
                      setActiveTab("timeline");
                    }}
                    className={`w-full border-b border-slate-100 px-5 py-5 text-left transition ${
                      isSelected ? "bg-indigo-50/70" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h2 className={`truncate text-base font-black ${isSelected ? "text-indigo-800" : "text-slate-800"}`}>
                        {patient.name}
                      </h2>
                      <span className="rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        {patient.abha}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-base font-medium text-slate-500">
                      <span>{patient.age} Yrs</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{patient.gender}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{patient.mobile}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass(patient.status)}`}>
                        {patient.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <History className="h-3.5 w-3.5" />
                        {patient.events}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="min-w-0 overflow-y-auto bg-slate-50">
          {!selectedPatient ? (
            <div className="flex min-h-full items-center justify-center px-6 py-12 text-center">
              <div>
                <div className="mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full border border-slate-200 bg-white text-indigo-200 shadow-md">
                  <History className="h-16 w-16" />
                </div>
                <h2 className="text-2xl font-black text-slate-700">Select a Patient</h2>
                <p className="mx-auto mt-3 max-w-lg text-base font-medium leading-7 text-slate-500">
                  Search and select a patient from the left panel to view their complete medical history, timeline, and reports.
                </p>
              </div>
            </div>
          ) : (
            <div className="min-h-full px-6 py-7">
              <header className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-center gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700 shadow-inner">
                      <UserRound className="h-7 w-7" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="truncate text-2xl font-black tracking-tight text-slate-900">
                          {selectedPatient.name}
                        </h2>
                        <span className="rounded bg-purple-50 px-2.5 py-1 text-sm font-black text-purple-700">
                          {selectedPatient.abha}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-sm font-black text-slate-600">
                          {selectedPatient.age} Y / {selectedPatient.gender}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="inline-flex items-center gap-1 text-sm font-black text-slate-600">
                          <Building2 className="h-4 w-4" />
                          {selectedPatient.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedPatient.allergy && (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2 text-sm font-black text-rose-600">
                      <BadgeAlert className="h-4 w-4" />
                      {selectedPatient.allergy}
                    </div>
                  )}
                </div>
              </header>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6">
                  <nav className="flex h-full items-end gap-7">
                    <button
                      type="button"
                      onClick={() => setActiveTab("timeline")}
                      className={`flex h-full items-center gap-2 border-b-2 text-sm font-black transition ${
                        activeTab === "timeline"
                          ? "border-indigo-600 text-indigo-700"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Activity className="h-4 w-4" />
                      Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("vitals")}
                      className={`flex h-full items-center gap-2 border-b-2 text-sm font-black transition ${
                        activeTab === "vitals"
                          ? "border-indigo-600 text-indigo-700"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Vitals Trend
                    </button>
                  </nav>
                </div>

                {activeTab === "timeline" ? (
                  <section className="px-6 py-6">
                    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      <div className="flex flex-wrap justify-end gap-2">
                        {filters.map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={`h-9 rounded-lg border px-4 text-sm font-black transition ${
                              activeFilter === filter
                                ? "border-purple-200 bg-purple-100 text-purple-700"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900">Patient Timeline</h3>
                          <p className="text-sm font-semibold text-slate-400">
                            Comprehensive activity log from registration to discharge
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-purple-700 px-5 text-sm font-black text-white shadow-md transition hover:bg-purple-800"
                      >
                        <Download className="h-4 w-4" />
                        Export Report
                      </button>
                    </div>

                    <div className="relative pl-11">
                      <div className="absolute bottom-0 left-4 top-0 w-px bg-slate-200" />
                      <div className="space-y-6">
                        {filteredTimeline.map((item) => {
                          const isDischarge = item.kind === "discharge";
                          return (
                            <article key={item.id} className="relative">
                              <div
                                className={`absolute -left-[52px] top-4 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white ${
                                  isDischarge
                                    ? "border-emerald-300 text-emerald-600"
                                    : "border-purple-400 text-purple-600"
                                }`}
                              >
                                {eventIcon(item.kind)}
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <h3 className="text-lg font-black text-slate-900">
                                      {item.title}
                                      {isDischarge && <CheckCircle2 className="ml-2 inline h-4 w-4 text-emerald-500" />}
                                      {item.actor !== "System" && (
                                        <span className="ml-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-blue-700">
                                          {item.actor}
                                        </span>
                                      )}
                                    </h3>
                                    <div className="mt-3 text-sm font-semibold text-slate-400">
                                      {item.date} at {item.time}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800">
                                  {item.description}
                                </div>
                                {item.details && (
                                  <div className="mt-3 rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-600">
                                    {item.details}
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="space-y-6 px-6 py-6">
                    <TrendCard
                      title="Blood Pressure Trend"
                      accent="text-rose-500"
                      yLabels={["180", "150", "120", "90", "60"]}
                      points={[
                        { color: "border-rose-500", left: "50%", top: "48%" },
                        { color: "border-blue-500", left: "50%", top: "68%" }
                      ]}
                    />
                    <TrendCard
                      title="Temperature Trend"
                      accent="text-orange-500"
                      yLabels={["105", "103", "101", "99"]}
                      points={[{ color: "border-orange-500", left: "50%", top: "54%" }]}
                    />
                  </section>
                )}
              </section>
            </div>
          )}
        </main>

        {selectedPatient && (
          <aside className="min-h-0 overflow-y-auto border-l border-slate-200 bg-white">
            <div className="space-y-6 p-6">
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                  Vitals Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["BP (MMHG)", selectedPatient.vitals.bp, "text-slate-900"],
                    ["SPO2 (%)", selectedPatient.vitals.spo2, "text-emerald-600"],
                    ["TEMP (F)", selectedPatient.vitals.temp, "text-purple-700"],
                    ["WEIGHT (KG)", selectedPatient.vitals.weight, "text-slate-900"]
                  ].map(([label, value, tone]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-[11px] font-black uppercase text-slate-400">{label}</div>
                      <div className={`mt-2 text-base font-black ${tone}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-purple-100 bg-purple-50/60 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white">
                    <Activity className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-purple-950">MedNxt AI</h3>
                    <p className="text-xs font-semibold text-purple-700">Clinical decision support</p>
                  </div>
                </div>
                <p className="text-sm font-semibold leading-6 text-slate-700">
                  Analyze notes for differential diagnosis & drug suggestions.
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 text-sm font-black text-white transition hover:bg-purple-700"
                >
                  <Activity className="h-4 w-4" />
                  [ Analyze Case ]
                </button>
              </section>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

function TrendCard({
  title,
  accent,
  yLabels,
  points
}: {
  title: string;
  accent: string;
  yLabels: string[];
  points: Array<{ color: string; left: string; top: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-black text-slate-900">
        <TrendingUp className={`h-4 w-4 ${accent}`} />
        {title}
      </h3>
      <div className="relative h-72">
        <div className="absolute left-0 top-0 flex h-full w-16 flex-col justify-between text-right text-sm font-medium text-slate-500">
          {yLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="absolute inset-y-0 left-20 right-0">
          {yLabels.map((label) => (
            <div key={label} className="h-1/5 border-t border-dashed border-slate-200" />
          ))}
          {points.map((point, index) => (
            <span
              key={`${point.left}-${point.top}-${index}`}
              className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white ${point.color}`}
              style={{ left: point.left, top: point.top }}
            />
          ))}
          <span className="absolute left-1/2 top-[78%] -translate-x-1/2 text-sm font-medium text-slate-500">
            10/12/2023
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminPatientHistoryPage;
