import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bed,
  Clock,
  Cloud,
  IndianRupee,
  Loader2,
  Microscope,
  Pill,
  RefreshCw,
  Sparkles,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { DashboardStatCard } from "../components/dashboard/DashboardStatCard";
import { UpcomingAppointments, AppointmentItem } from "../components/dashboard/UpcomingAppointments";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";

interface DashboardResponseData {
  type?: "DOCTOR" | "ADMIN";
  greeting: string;
  stats: {
    myQueue: {
      count: number;
      highPriority: number;
    };
    pendingReports: {
      count: number;
      ready: number;
    };
    ipdRounds: {
      count: number;
      pending: number;
    };
  };
  upcomingAppointments: AppointmentItem[];
  commandCenter?: {
    totalWalkIns: number;
    activeInFacility: number;
    avgWaitMinutes: number;
    estimatedRevenue: number;
    highVolume: boolean;
  };
  flowPipeline?: Array<{
    label: string;
    count: number;
    capacity: number;
    status?: "busy" | "normal";
  }>;
  arrivalTrend?: Array<{
    hour: string;
    count: number;
  }>;
  departmentLoad?: Array<{
    department: string;
    count: number;
    load: "Critical Load" | "High Load" | "Normal Load";
  }>;
  resourceStatus?: {
    doctors: {
      active: number;
      total: number;
    };
    beds: {
      occupied: number;
      total: number;
      percent: number;
    };
  };
  revenueClassification?: Array<{
    label: string;
    amount: number;
  }>;
  patientClassification?: {
    total: number;
    new: number;
    returning: number;
    newPercent: number;
    returningPercent: number;
  };
}

type CommandCenterMetricKey = {
  [Key in keyof NonNullable<DashboardResponseData["commandCenter"]>]:
    NonNullable<DashboardResponseData["commandCenter"]>[Key] extends number ? Key : never;
}[keyof NonNullable<DashboardResponseData["commandCenter"]>];

interface CommandCenterMetricCard {
  key: CommandCenterMetricKey;
  title: string;
  icon: LucideIcon;
  color: string;
  subtext: string;
  suffix?: string;
  alert?: boolean;
  money?: boolean;
}

const formatINR = (value: number) => {
  if (value >= 100000) {
    return `Rs.${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 2)}L`;
  }
  return `Rs.${value.toLocaleString("en-IN")}`;
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isReceptionist = user?.role === "RECEPTIONIST";

  const [data, setData] = useState<DashboardResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (isReceptionist) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/dashboard");
      if (response.data?.success && response.data?.data) {
        setData(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to load dashboard data");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        "Unable to fetch dashboard statistics. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isReceptionist]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isReceptionist) {
    return <ReceptionistDashboardPlaceholder />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="p-6 md:p-9 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Dashboard Loading Failed</h3>
              <p className="text-sm text-red-600 mt-0.5">{error || "Could not load data from backend"}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-xl transition-colors flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const doctorGreetingName = user?.name
    ? user.name.startsWith("Dr.")
      ? user.name
      : `Dr. ${user.name}`
    : "Dr. Sharma";

  const waitingPatientsCount = data.stats.myQueue.count;

  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || data.type === "ADMIN") {
    return <AdminCommandCenter data={data} />;
  }

  return (
    <div className="w-full px-6 md:px-12 lg:px-14 py-8 space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f172a] uppercase tracking-tight">
            Physician Dashboard
          </h1>
          <p className="text-base font-semibold text-slate-500 mt-1.5">
            Good Morning, {doctorGreetingName}. You have{" "}
            <span className="text-purple-600 font-extrabold">{waitingPatientsCount}</span> patients waiting.
          </p>
        </div>

        <button
          onClick={() => navigate("/doctor-station")}
          className="min-h-12 px-6 py-3 bg-[#6336d3] hover:bg-[#5228be] active:bg-[#461fa8] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer group shrink-0"
        >
          <Stethoscope className="w-4 h-4" />
          <span>Go to Station</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardStatCard
          title="MY QUEUE"
          count={data.stats.myQueue.count}
          secondaryInfo={`${data.stats.myQueue.highPriority} High Priority`}
          icon={<Users className="w-5 h-5" />}
          onClick={() => navigate("/doctor-station")}
          iconGradient="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600"
          badgeStyle="bg-purple-50 text-purple-700 border-purple-200/80"
        />

        <DashboardStatCard
          title="PENDING REPORTS"
          count={data.stats.pendingReports.count}
          secondaryInfo={`${data.stats.pendingReports.ready} Lab Results Ready`}
          icon={<Activity className="w-5 h-5" />}
          iconGradient="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
          badgeStyle="bg-pink-50 text-pink-700 border-pink-200/80"
        />

        <DashboardStatCard
          title="IPD ROUNDS"
          count={data.stats.ipdRounds.count}
          secondaryInfo={`${data.stats.ipdRounds.pending} Pending Visits`}
          icon={<Bed className="w-5 h-5" />}
          onClick={() => navigate("/ipd-wards")}
          iconGradient="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600"
          badgeStyle="bg-amber-50 text-amber-700 border-amber-200/80"
        />
      </div>

      {/* Upcoming Appointments Section */}
      <UpcomingAppointments appointments={data.upcomingAppointments} />
    </div>
  );
};

const ReceptionistDashboardPlaceholder: React.FC = () => {
  return (
    <div className="flex h-full min-h-[520px] items-start justify-center bg-[#f8fafc] pt-30">
      <p className="text-base font-medium text-slate-400">
        Dashboard not configured for this role.
      </p>
    </div>
  );
};

const metricCards: CommandCenterMetricCard[] = [
  {
    key: "totalWalkIns",
    title: "Total Walk-ins",
    icon: Users,
    color: "from-indigo-500 to-violet-600",
    subtext: "+24% vs Avg Daily"
  },
  {
    key: "activeInFacility",
    title: "Active In-Facility",
    icon: Activity,
    color: "from-violet-500 to-purple-600",
    subtext: "Current Crowd Load"
  },
  {
    key: "avgWaitMinutes",
    title: "Avg Wait Time",
    icon: Clock,
    color: "from-orange-500 to-red-500",
    subtext: "Target: <45 min",
    suffix: " min",
    alert: true
  },
  {
    key: "estimatedRevenue",
    title: "Est. Revenue",
    icon: IndianRupee,
    color: "from-emerald-500 to-teal-600",
    subtext: "Live billing estimate",
    money: true
  }
] as const;

const pipelineIcons = [UserPlus, Activity, Stethoscope, Microscope, Pill];
const pipelineColors = ["bg-emerald-500", "bg-emerald-500", "bg-red-500", "bg-emerald-500", "bg-emerald-500"];
const revenueColors = ["bg-blue-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"];

const adminDemoDashboardData = {
  commandCenter: {
    totalWalkIns: 312,
    activeInFacility: 145,
    avgWaitMinutes: 55,
    estimatedRevenue: 245000,
    highVolume: true
  },
  flowPipeline: [
    { label: "Registration", count: 312, capacity: 78 },
    { label: "Vitals / Triage", count: 285, capacity: 81 },
    { label: "Dr. Consult", count: 190, capacity: 95, status: "busy" as const },
    { label: "Diagnostics", count: 85, capacity: 57 },
    { label: "Pharmacy", count: 120, capacity: 80 }
  ],
  arrivalTrend: [
    { hour: "08:00", count: 15 },
    { hour: "09:00", count: 45 },
    { hour: "10:00", count: 92 },
    { hour: "11:00", count: 78 },
    { hour: "12:00", count: 54 },
    { hour: "13:00", count: 30 },
    { hour: "14:00", count: 42 },
    { hour: "15:00", count: 25 }
  ],
  departmentLoad: [
    { department: "Gen Med", count: 145, load: "Critical Load" as const },
    { department: "Pediatrics", count: 65, load: "High Load" as const },
    { department: "Ortho", count: 45, load: "Normal Load" as const },
    { department: "ENT", count: 30, load: "Normal Load" as const },
    { department: "Gynae", count: 27, load: "Normal Load" as const }
  ],
  resourceStatus: {
    doctors: { active: 12, total: 15 },
    beds: { occupied: 98, total: 100, percent: 98 }
  },
  revenueClassification: [
    { label: "OPD Consult", amount: 90000 },
    { label: "IPD Charges", amount: 65000 },
    { label: "Pharmacy", amount: 52000 },
    { label: "Laboratory", amount: 38000 }
  ],
  patientClassification: {
    total: 312,
    new: 218,
    returning: 94,
    newPercent: 70,
    returningPercent: 30
  }
};

const AdminCommandCenter: React.FC<{ data: DashboardResponseData }> = ({ data }) => {
  const [isAuditVisible, setIsAuditVisible] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  const apiCommand = data.commandCenter || {
    totalWalkIns: 0,
    activeInFacility: 0,
    avgWaitMinutes: 0,
    estimatedRevenue: 0,
    highVolume: false
  };
  const shouldUseDemoData =
    apiCommand.totalWalkIns === 0 &&
    apiCommand.activeInFacility === 0 &&
    apiCommand.estimatedRevenue === 0 &&
    !(data.flowPipeline?.length || data.arrivalTrend?.length || data.departmentLoad?.length);
  const demo = shouldUseDemoData ? adminDemoDashboardData : null;
  const command = demo?.commandCenter || apiCommand;
  const flow = demo?.flowPipeline || data.flowPipeline || [];
  const trend = demo?.arrivalTrend || data.arrivalTrend || [];
  const departments = demo?.departmentLoad || data.departmentLoad || [];
  const resources = demo?.resourceStatus || data.resourceStatus || {
    doctors: { active: 0, total: 0 },
    beds: { occupied: 0, total: 0, percent: 0 }
  };
  const revenue = demo?.revenueClassification || data.revenueClassification || [];
  const classification = demo?.patientClassification || data.patientClassification || {
    total: 0,
    new: 0,
    returning: 0,
    newPercent: 0,
    returningPercent: 0
  };
  const maxRevenue = Math.max(...revenue.map((item) => item.amount), 1);
  const highestDepartment = departments.reduce<(typeof departments)[number] | null>(
    (highest, item) => (!highest || item.count > highest.count ? item : highest),
    null
  );
  const busiestPipelineStep = flow.reduce<(typeof flow)[number] | null>(
    (busiest, item) => (!busiest || item.capacity > busiest.capacity ? item : busiest),
    null
  );

  const handleTrafficAudit = () => {
    if (isAuditing) {
      return;
    }

    setIsAuditVisible(false);
    setIsAuditing(true);
    window.setTimeout(() => {
      setIsAuditing(false);
      setIsAuditVisible(true);
    }, 900);
  };

  return (
    <div className="px-6 md:px-9 py-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight">
              Command Center
            </h1>
            {command.highVolume && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-extrabold text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                High Volume Alert
              </span>
            )}
          </div>
          <p className="mt-1.5 text-base font-semibold text-slate-500">
            Real-time monitoring of <span className="font-extrabold text-slate-800">{command.totalWalkIns}</span> active patient journeys.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-slate-500">
              <Cloud className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-slate-900">27.9C <span className="font-semibold text-slate-500">| Rainy</span></p>
              <p className="text-[11px] font-semibold text-slate-400">Humidity: 55%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700 shadow-sm">
            <Clock className="h-4 w-4 text-violet-600" />
            Avg TAT: {command.avgWaitMinutes}m
          </div>
          <button
            type="button"
            onClick={handleTrafficAudit}
            disabled={isAuditing}
            className="flex min-w-[216px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-lg disabled:cursor-wait disabled:hover:translate-y-0"
            aria-live="polite"
          >
            {isAuditing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Analyzing Traffic...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span>AI Traffic Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isAuditVisible && (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-violet-700 to-purple-900 p-6 text-white shadow-xl shadow-violet-900/20">
          <h2 className="flex items-center gap-2 text-lg font-black text-yellow-300">
            <Sparkles className="h-5 w-5" />
            AI Operational Insights
          </h2>
          <div className="mt-5 rounded-xl border border-white/15 bg-white/10 p-5 shadow-inner backdrop-blur-sm">
            <p className="text-sm font-semibold text-violet-50">
              Here is a 3-bullet point summary of the operational insights:
            </p>
            <ul className="mt-6 space-y-2 text-sm font-medium leading-7 text-white md:text-base">
              <li>
                <span className="font-black text-yellow-100">Operational Bottlenecks:</span>{" "}
                Critical average wait time of {command.avgWaitMinutes} mins is being driven by{" "}
                {highestDepartment ? `${highestDepartment.department} (${highestDepartment.count} patients)` : "peak OPD traffic"}
                {busiestPipelineStep ? ` and ${busiestPipelineStep.label} running at ${busiestPipelineStep.capacity}% capacity` : ""}.
              </li>
              <li>
                <span className="font-black text-yellow-100">Revenue Opportunities:</span>{" "}
                Estimated revenue of {formatINR(command.estimatedRevenue)} indicates strong demand that can be improved by resolving high-volume queues and increasing patient throughput.
              </li>
              <li>
                <span className="font-black text-yellow-100">Staffing Optimization:</span>{" "}
                Active in-facility load of {command.activeInFacility} patients suggests immediate review of front desk, triage, and doctor-station coverage for the next peak window.
              </li>
            </ul>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const rawValue = command[card.key];
          const value = card.money ? formatINR(rawValue) : `${rawValue}${card.suffix || ""}`;

          return (
            <div
              key={card.key}
              className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm ${
                card.alert && command.avgWaitMinutes > 45 ? "border-red-200 ring-1 ring-red-100" : "border-slate-200"
              }`}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-md`}>
                <Icon className="h-6 w-6" />
              </span>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-wide text-slate-500">{card.title}</p>
              <p className={`mt-2 text-3xl font-black ${card.alert && command.avgWaitMinutes > 45 ? "text-red-600" : "text-slate-900"}`}>
                {value}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-400">{card.subtext}</p>
              <div className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-slate-50" />
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-950">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            Patient Flow Pipeline
          </h2>
          <span className="text-xs font-extrabold uppercase text-slate-400">Real-time Distribution</span>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-5">
          {flow.map((item, index) => {
            const Icon = pipelineIcons[index] || Activity;
            const color = pipelineColors[index] || "bg-emerald-500";

            return (
              <div key={item.label} className="text-center">
                <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-violet-600 shadow-sm">
                  <Icon className="h-7 w-7" />
                  {item.status === "busy" && (
                    <span className="absolute -top-3 -right-6 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">
                      BUSY
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm font-extrabold text-slate-900">{item.label}</p>
                <p className={item.status === "busy" ? "mt-1 text-2xl font-black text-red-600" : "mt-1 text-2xl font-black text-slate-950"}>
                  {item.count}
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${item.capacity}%` }} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{item.capacity}% Capacity</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-950">Patient Arrival Trend</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">Hourly footfall analysis for today. Peak identified at 10:00 AM.</p>
          <SimpleArrivalTrendChart trend={trend} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-950">Department Load</h2>
          <div className="mt-5 space-y-5">
            {departments.map((item) => {
              const percent = Math.min(100, Math.round((item.count / Math.max(command.totalWalkIns, 1)) * 100));
              const color = item.load === "Critical Load" ? "bg-red-500" : item.load === "High Load" ? "bg-amber-500" : "bg-blue-500";

              return (
                <div key={item.department}>
                  <div className="flex items-center justify-between text-sm font-extrabold text-slate-900">
                    <span>{item.department}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[11px] font-semibold text-slate-400">{item.load}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-7 border-t border-slate-100 pt-5">
            <h3 className="text-xs font-extrabold uppercase text-slate-500">Resource Status</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Doctors</p>
                <p className="mt-1 text-xl font-black text-slate-950">
                  {resources.doctors.active}<span className="text-sm font-semibold text-slate-400">/{resources.doctors.total}</span>
                </p>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-extrabold text-red-600">Beds (IPD)</p>
                <p className="mt-1 text-xl font-black text-red-600">{resources.beds.percent}% <span className="text-sm font-semibold">Full</span></p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-950">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                Revenue Classification
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">Income distribution across major hospital units.</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-extrabold uppercase text-slate-400">Total Est.</p>
              <p className="text-2xl font-black text-slate-950">{formatINR(command.estimatedRevenue)}</p>
            </div>
          </div>

          <div className="mt-7 space-y-5">
            {revenue.map((item, index) => (
              <div key={item.label} className="grid grid-cols-[110px_1fr] items-center gap-4">
                <span className="text-sm font-bold text-slate-500">{item.label}</span>
                <div className="h-8 rounded-md bg-slate-50">
                  <div
                    className={`h-full rounded-md ${revenueColors[index] || "bg-slate-500"}`}
                    style={{ width: `${Math.max(6, (item.amount / maxRevenue) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-950">
            <RefreshCw className="h-5 w-5 text-violet-600" />
            Patient Classification
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">Ratio of new registrations vs follow-ups.</p>
          <div className="mt-7 flex justify-center">
            <div className="flex h-44 w-44 items-center justify-center rounded-full border-[18px] border-violet-500 bg-white shadow-inner">
              <div className="text-center">
                <p className="text-3xl font-black text-slate-950">{classification.total}</p>
                <p className="text-xs font-extrabold uppercase text-slate-400">Total</p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 text-center">
              <p className="text-[11px] font-extrabold uppercase text-violet-500">New</p>
              <p className="text-2xl font-black text-violet-600">{classification.newPercent}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-[11px] font-extrabold uppercase text-slate-500">Returning</p>
              <p className="text-2xl font-black text-slate-600">{classification.returningPercent}%</p>
            </div>
          </div>
        </section>
      </div>

      <button className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-500/30">
        <Sparkles className="h-7 w-7" />
      </button>
    </div>
  );
};

const SimpleArrivalTrendChart: React.FC<{ trend: Array<{ hour: string; count: number }> }> = ({ trend }) => {
  const width = 900;
  const height = 280;
  const paddingX = 36;
  const paddingY = 26;
  const maxCount = Math.max(...trend.map((item) => item.count), 1);
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;
  const points = trend.map((item, index) => {
    const x = paddingX + (index / Math.max(trend.length - 1, 1)) * chartWidth;
    const y = paddingY + chartHeight - (item.count / maxCount) * chartHeight;
    return { ...item, x, y };
  });
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${paddingX},${height - paddingY} ${linePoints} ${width - paddingX},${height - paddingY}`;
  const guideValues = [100, 75, 50, 25, 0];

  return (
    <div className="mt-7">
      <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-[330px] w-full overflow-visible" role="img" aria-label="Patient arrival trend line chart">
        <defs>
          <linearGradient id="arrivalTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {guideValues.map((value) => {
          const y = paddingY + chartHeight - (value / 100) * chartHeight;
          return (
            <g key={value}>
              <line x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />
              <text x={paddingX - 8} y={y + 4} textAnchor="end" className="fill-slate-500 text-xs font-semibold">
                {value}
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} fill="url(#arrivalTrendFill)" />
        <polyline points={linePoints} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point) => (
          <text key={point.hour} x={point.x} y={height + 10} textAnchor="middle" className="fill-slate-500 text-xs font-semibold">
            {point.hour}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default DashboardPage;
