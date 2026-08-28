import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Activity, Bed, Stethoscope, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { DashboardStatCard } from "../components/dashboard/DashboardStatCard";
import { UpcomingAppointments, AppointmentItem } from "../components/dashboard/UpcomingAppointments";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";

interface DashboardResponseData {
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
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  return (
    <div className="px-6 md:px-9 py-8 max-w-7xl mx-auto space-y-8">
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
          className="px-5.5 py-3 bg-[#6336d3] hover:bg-[#5228be] active:bg-[#461fa8] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2.5 cursor-pointer group shrink-0"
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

export default DashboardPage;
