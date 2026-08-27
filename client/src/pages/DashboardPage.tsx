import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Stethoscope, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";
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
    );
  }

  const doctorGreetingName = user?.name
    ? user.name.startsWith("Dr.")
      ? user.name
      : `Dr. ${user.name}`
    : data.greeting;

  const displayGreeting = `Good Morning, ${doctorGreetingName}.`;

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Physician Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{displayGreeting}</p>
        </div>

        <button
          onClick={() => navigate("/doctor-station")}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-sm rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center space-x-2 cursor-pointer group"
        >
          <span>Go to Station</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardStatCard
          title="My Queue"
          count={data.stats.myQueue.count}
          secondaryInfo={`${data.stats.myQueue.highPriority} High Priority`}
          icon={<Users className="w-5 h-5" />}
          onClick={() => navigate("/patient-queue")}
          badgeVariant="purple"
        />

        <DashboardStatCard
          title="Pending Reports"
          count={data.stats.pendingReports.count}
          secondaryInfo={`${data.stats.pendingReports.ready} Lab Results Ready`}
          icon={<FileText className="w-5 h-5" />}
          badgeVariant="indigo"
        />

        <DashboardStatCard
          title="IPD Rounds"
          count={data.stats.ipdRounds.count}
          secondaryInfo={`${data.stats.ipdRounds.pending} Pending Visits`}
          icon={<Stethoscope className="w-5 h-5" />}
          onClick={() => navigate("/ipd-wards")}
          badgeVariant="purple"
        />
      </div>

      {/* Upcoming Appointments Section */}
      <UpcomingAppointments appointments={data.upcomingAppointments} />
    </div>
  );
};

export default DashboardPage;
