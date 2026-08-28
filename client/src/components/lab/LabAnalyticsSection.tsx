import React from "react";
import { Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface SamplesDataPoint {
  time: string;
  value: number;
}

interface DeptLoadItem {
  name: string;
  count: number;
  percentage: number;
}

interface AnalyticsProps {
  samplesData?: SamplesDataPoint[];
  departmentLoad?: DeptLoadItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-lg space-y-1 text-xs select-none">
        <p className="font-extrabold text-slate-800 text-xs border-b border-slate-100 pb-1">
          {label}
        </p>
        <p className="font-semibold text-slate-600">
          samples : <span className="font-black text-purple-600 text-sm">{val}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const LabAnalyticsSection: React.FC<AnalyticsProps> = ({
  samplesData = [],
  departmentLoad = [
    { name: "Hematology", count: 18, percentage: 40 },
    { name: "Biochem", count: 31, percentage: 75 },
    { name: "Microbio", count: 9, percentage: 25 },
    { name: "Serology", count: 7, percentage: 20 }
  ]
}) => {
  // Ensure we have a valid array of 6 time buckets
  const safeData = React.useMemo(() => {
    if (Array.isArray(samplesData) && samplesData.length > 0) {
      return samplesData;
    }
    // Fallback 6 hourly buckets ending at current hour
    const now = new Date();
    const currentHour = now.getHours();
    const fallback: SamplesDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const h = (currentHour - i + 24) % 24;
      fallback.push({
        time: `${String(h).padStart(2, "0")}:00`,
        value: 0
      });
    }
    return fallback;
  }, [samplesData]);

  const totalSamples = React.useMemo(() => {
    return safeData.reduce((sum, d) => sum + d.value, 0);
  }, [safeData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT CARD: Interactive Recharts Samples Received Line Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#0f172a] flex items-center space-x-2">
            <Activity className="w-4 h-4 text-purple-600" />
            <span>Samples Received (Last 6 Hours)</span>
          </h3>
          <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/80">
            Total: {totalSamples}
          </span>
        </div>

        {/* Recharts Responsive Container */}
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={safeData}
              margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#7c3aed", strokeWidth: 1.5, strokeDasharray: "3 3" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ r: 5, fill: "#7c3aed", stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 8, fill: "#6336d3", stroke: "#ffffff", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RIGHT CARD: Department Load Horizontal Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm text-[#0f172a]">
            Department Load
          </h3>
        </div>

        {/* Horizontal Bars */}
        <div className="space-y-4 pt-2">
          {departmentLoad.map((item, index) => {
            const barColors = [
              "bg-purple-600",
              "bg-[#6336d3]",
              "bg-indigo-600",
              "bg-purple-500"
            ];
            const color = barColors[index % barColors.length];

            return (
              <div key={item.name} className="flex items-center space-x-4 text-xs font-extrabold">
                <span className="text-[#0f172a] w-24 shrink-0">{item.name}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
