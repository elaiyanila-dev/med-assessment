import React, { useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  FileClock,
  FlaskConical,
  HeartPulse,
  Link2,
  Mic,
  Pause,
  Phone,
  Pill,
  Play,
  Search,
  Sparkles,
  Stethoscope,
  UserRound,
  Video
} from "lucide-react";

type Patient = {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  abha: string;
  complaint: string;
  priority?: "EMERG";
  remote?: boolean;
  phone: string;
  avatar: string;
  allergies?: string;
  vitals: {
    bp: string;
    spo2: string;
    temp: string;
    weight: string;
  };
};

const patients: Patient[] = [
  {
    id: "vikram",
    name: "Vikram Singh",
    age: 50,
    gender: "M",
    abha: "ABHA-7890",
    complaint: "Chest Pain",
    priority: "EMERG",
    phone: "9876543198",
    avatar: "VS",
    vitals: { bp: "138/90", spo2: "96", temp: "99.1", weight: "78" }
  },
  {
    id: "priya",
    name: "Priya Sharma",
    age: 28,
    gender: "F",
    abha: "ABHA-5678",
    complaint: "Severe Abdominal Pain",
    remote: true,
    phone: "9876543180",
    avatar: "PS",
    vitals: { bp: "116/74", spo2: "99", temp: "98.4", weight: "54" }
  },
  {
    id: "rahul",
    name: "Rahul Verma",
    age: 34,
    gender: "M",
    abha: "ABHA-1234",
    complaint: "High Fever & Chills",
    phone: "9876543210",
    avatar: "RV",
    allergies: "Penicillin",
    vitals: { bp: "120/80", spo2: "98", temp: "98.6", weight: "65" }
  },
  {
    id: "amit",
    name: "Amit Patel",
    age: 65,
    gender: "M",
    abha: "ABHA-9012",
    complaint: "Diabetes Follow-up",
    phone: "9876543155",
    avatar: "AP",
    vitals: { bp: "126/82", spo2: "97", temp: "98.2", weight: "71" }
  },
  {
    id: "sujata",
    name: "Sujata Rao",
    age: 62,
    gender: "F",
    abha: "ABHA-3456",
    complaint: "Joint Pain",
    phone: "9876543122",
    avatar: "SR",
    vitals: { bp: "122/78", spo2: "98", temp: "98.6", weight: "60" }
  }
];

const tabs = [
  { id: "note", label: "Consultation Note", icon: Stethoscope },
  { id: "prescription", label: "Prescription", icon: Link2 },
  { id: "labs", label: "Lab Orders", icon: FlaskConical },
  { id: "history", label: "Patient History", icon: FileClock }
] as const;

const soapTabs = ["SUBJECTIVE", "OBJECTIVE", "ASSESSMENT", "PLAN"] as const;

export const AdminDoctorStationPage: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState("rahul");
  const [selectedTab, setSelectedTab] = useState<(typeof tabs)[number]["id"]>("note");
  const [selectedSoapTab, setSelectedSoapTab] = useState<(typeof soapTabs)[number]>("SUBJECTIVE");
  const [queueMode, setQueueMode] = useState<"ALL" | "CLINIC" | "REMOTE">("CLINIC");
  const [isClinicalPanelOpen, setIsClinicalPanelOpen] = useState(true);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [query, setQuery] = useState("");

  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) || patients[2];

  const filteredPatients = patients.filter((patient) => {
    if (queueMode === "CLINIC" && patient.remote) return false;
    if (queueMode === "REMOTE" && !patient.remote) return false;

    const value = query.trim().toLowerCase();
    if (!value) return true;
    return (
      patient.name.toLowerCase().includes(value) ||
      patient.abha.toLowerCase().includes(value) ||
      patient.complaint.toLowerCase().includes(value)
    );
  });

  const queuePatients = isSessionStarted
    ? [
        selectedPatient,
        ...filteredPatients.filter((patient) => patient.id !== selectedPatient.id)
      ]
    : filteredPatients;

  return (
    <div className="h-full min-h-[calc(100vh-72px)] overflow-hidden bg-white text-slate-800">
      <div
        className={`grid h-full min-h-[calc(100vh-72px)] grid-cols-1 transition-all ${
          isClinicalPanelOpen
            ? "xl:grid-cols-[356px_minmax(0,1fr)_376px]"
            : "xl:grid-cols-[356px_minmax(0,1fr)]"
        }`}
      >
        <aside className="min-h-0 border-r border-slate-200 bg-white">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-extrabold text-slate-900">OPD Queue</h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                  {filteredPatients.length}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-3 rounded-lg bg-slate-100 p-1 text-[11px] font-extrabold text-slate-500">
                {(["ALL", "CLINIC", "REMOTE"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setQueueMode(mode)}
                    className={`flex items-center justify-center gap-1 rounded-md py-2 transition ${
                      queueMode === mode ? "bg-white text-slate-800 shadow-sm" : "hover:text-slate-700"
                    }`}
                  >
                    {mode === "REMOTE" && <Video className="h-3 w-3" />}
                    {mode === "REMOTE" ? "Remote" : mode}
                  </button>
                ))}
              </div>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter patient..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {queuePatients.map((patient) => {
                const isActive = patient.id === selectedPatient.id;
                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`w-full border-b border-slate-100 px-5 py-5 text-left transition ${
                      isActive ? "bg-sky-50/70" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className={`text-base font-extrabold ${isActive ? "text-sky-900" : "text-slate-800"}`}>
                      {patient.name}
                      {patient.remote && <Video className="ml-1 inline h-3 w-3 text-indigo-500" />}
                      {isSessionStarted && isActive && (
                        <span className="float-right mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        {patient.gender}/{patient.age}
                      </span>
                      <span className="h-5 w-px bg-slate-200" />
                      <span>{patient.abha}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {patient.priority && (
                        <span className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-extrabold text-rose-600">
                          EMERG
                        </span>
                      )}
                      <span className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">
                        {patient.complaint}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="min-w-0 border-r border-slate-200 bg-white">
          <div className="flex min-h-full flex-col">
            <header className="flex flex-col gap-4 border-b border-slate-200 px-7 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-sky-100 text-base font-black text-slate-700 shadow-inner">
                  {selectedPatient.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-2xl font-black leading-tight text-slate-800">
                      {selectedPatient.name}
                    </h1>
                    {selectedPatient.allergies && (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-600">
                        Allergies: {selectedPatient.allergies}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-base font-semibold text-slate-500">
                    <span className="rounded bg-slate-100 px-2 py-1 text-sm text-slate-500">
                      {selectedPatient.abha}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>{selectedPatient.phone}</span>
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {isSessionStarted ? (
                  <>
                    <button
                      type="button"
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-5 text-base font-extrabold text-amber-700 transition hover:bg-amber-100"
                    >
                      <Pause className="h-4 w-4 fill-current" />
                      Hold
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSessionStarted(false)}
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 text-base font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Finish
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSessionStarted(true);
                      setIsClinicalPanelOpen(false);
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-sky-500 px-6 text-base font-extrabold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Start Session
                  </button>
                )}
                <span className="h-8 w-px bg-slate-200" />
                <button
                  type="button"
                  title="Toggle Clinical Panel"
                  aria-label="Toggle clinical panel"
                  onClick={() => setIsClinicalPanelOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100"
                >
                  {isClinicalPanelOpen ? (
                    <ChevronsRight className="h-5 w-5" />
                  ) : (
                    <ChevronsLeft className="h-5 w-5" />
                  )}
                </button>
              </div>
            </header>

            <nav className="flex gap-8 overflow-x-auto border-b border-slate-200 px-7">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex h-16 shrink-0 items-center gap-2 border-b-2 text-base font-extrabold transition ${
                      isActive
                        ? "border-sky-500 text-sky-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex-1 bg-white px-7 py-7">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-4 bg-slate-50">
                  {soapTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedSoapTab(tab)}
                      className={`relative h-12 text-sm font-black tracking-wide transition ${
                        selectedSoapTab === tab
                          ? "border-b-2 border-sky-500 bg-white text-sky-700"
                          : "text-slate-500 hover:bg-white"
                      }`}
                    >
                      {tab === "OBJECTIVE" && (
                        <span className="absolute left-1/2 top-3 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="min-h-[532px] p-7">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800">Chief Complaints & History</h3>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Mic className="h-4 w-4 text-slate-500" />
                      Dictate
                    </button>
                  </div>

                  {selectedTab === "note" ? (
                    <textarea
                      className="h-[92px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-5 text-base font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      placeholder="Patient reports..."
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sky-600">
                        {selectedTab === "prescription" && <Pill className="h-5 w-5" />}
                        {selectedTab === "labs" && <FlaskConical className="h-5 w-5" />}
                        {selectedTab === "history" && <FileClock className="h-5 w-5" />}
                      </div>
                      <p className="text-sm font-bold text-slate-500">
                        {tabs.find((tab) => tab.id === selectedTab)?.label} workspace
                      </p>
                    </div>
                  )}
                </div>

                <footer className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-9 py-5">
                  <button type="button" className="text-base font-extrabold text-slate-400">
                    Previous
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-7 text-base font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </footer>
              </div>
            </div>
          </div>
        </section>

        {isClinicalPanelOpen && (
        <aside className="bg-white">
          <div className="space-y-5 p-5">
            <section>
              <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                Vitals Summary
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["BP (MMHG)", selectedPatient.vitals.bp],
                  ["SPO2 (%)", selectedPatient.vitals.spo2],
                  ["TEMP (F)", selectedPatient.vitals.temp],
                  ["WEIGHT (KG)", selectedPatient.vitals.weight]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[11px] font-black uppercase text-slate-400">{label}</div>
                    <div className="mt-2 text-2xl font-black text-slate-800">{value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-xl shadow-purple-900/20">
              <div className="mb-4 flex items-center gap-3">
                <Sparkles className="h-6 w-6" />
                <h3 className="text-lg font-black">MedNxt AI</h3>
              </div>
              <p className="text-sm font-medium leading-6 text-purple-50">
                Analyze notes for differential diagnosis & drug suggestions.
              </p>
              <button
                type="button"
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 text-base font-black text-white/60"
              >
                <Activity className="h-5 w-5" />
                Analyze Case
              </button>
            </section>
          </div>
        </aside>
        )}
      </div>
    </div>
  );
};

export default AdminDoctorStationPage;
