import React, { useState } from "react";
import {
  Activity,
  BarChart3,
  Clock,
  Download,
  FileText,
  Filter,
  IndianRupee,
  Users
} from "lucide-react";

type AnalyticsRange = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";

const ranges: AnalyticsRange[] = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

const metrics = [
  {
    label: "Total Active Revenue",
    value: "₹0",
    helper: "↗ +12% vs last month",
    icon: IndianRupee,
    iconWrap: "bg-indigo-50 text-indigo-600",
    helperClass: "text-emerald-700"
  },
  {
    label: "Avg Length of Stay",
    value: "0 Days",
    helper: "Target: < 5 Days",
    icon: Clock,
    iconWrap: "bg-blue-50 text-blue-600",
    helperClass: "text-slate-400"
  },
  {
    label: "Bed Occupancy",
    value: "20%",
    helper: "2 / 10 Active Beds",
    icon: Activity,
    iconWrap: "bg-emerald-50 text-emerald-600",
    helperClass: "text-slate-400"
  },
  {
    label: "Active Patients",
    value: "0",
    helper: "Currently Admitted",
    icon: Users,
    iconWrap: "bg-amber-50 text-amber-600",
    helperClass: "text-slate-400"
  }
];

export const AnalyticsPage: React.FC = () => {
  const [activeRange, setActiveRange] = useState<AnalyticsRange>("Monthly");

  return (
    <div className="min-h-full bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1420px] space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              Reports & Analytics
            </h1>
            <p className="mt-1 text-base font-medium text-slate-500">
              Financial performance, occupancy trends, and operational insights.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
              {ranges.map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setActiveRange(range)}
                  className={`h-9 rounded-md px-4 text-sm font-extrabold transition-colors ${
                    activeRange === range
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-extrabold text-white shadow-md transition-colors hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.label}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase text-slate-500">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-3xl font-black leading-none text-slate-950">
                      {metric.value}
                    </p>
                    <p className={`mt-3 text-[11px] font-extrabold ${metric.helperClass}`}>
                      {metric.helper}
                    </p>
                  </div>
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${metric.iconWrap}`}>
                    <Icon className="h-7 w-7" />
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/60">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Ward Revenue Breakdown
              </h2>
              <p className="mt-1 text-base font-medium text-slate-500">
                Detailed view of current IPD revenue generation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-extrabold text-slate-700 hover:bg-slate-200"
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-50 px-3 text-sm font-extrabold text-indigo-700 hover:bg-indigo-100"
              >
                <FileText className="h-4 w-4" />
                <span>View Full Statement</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-xs font-extrabold uppercase text-slate-500">
                  <th className="px-7 py-4">Patient Details</th>
                  <th className="px-7 py-4">Bed & Ward</th>
                  <th className="px-7 py-4">Admission Date</th>
                  <th className="px-7 py-4">Duration</th>
                  <th className="px-7 py-4">Rent / Day</th>
                  <th className="px-7 py-4 text-right">Total Est. Revenue</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="flex min-h-[224px] flex-col items-center justify-center border-b border-slate-200 px-6 py-12 text-center">
            <BarChart3 className="h-10 w-10 text-slate-200" />
            <p className="mt-4 text-base font-medium text-slate-400">
              No active admission data available for analysis.
            </p>
          </div>

          <div className="flex flex-col gap-4 bg-slate-50 px-7 py-5 sm:flex-row sm:items-center sm:justify-end">
            <div className="text-right">
              <p className="text-xs font-extrabold uppercase text-slate-500">
                Total Occupancy
              </p>
              <p className="mt-1 text-lg font-black text-slate-950">2 Beds</p>
            </div>
            <div className="text-right sm:min-w-[240px]">
              <p className="text-xs font-extrabold uppercase text-slate-500">
                Projected Monthly Revenue
              </p>
              <p className="mt-1 text-lg font-black text-indigo-700">₹0</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;
