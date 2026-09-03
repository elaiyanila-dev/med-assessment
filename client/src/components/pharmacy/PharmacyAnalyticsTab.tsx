import React, { useState } from "react";
import {
  RotateCcw,
  AlertTriangle,
  CalendarX,
  Clock,
  FileCheck,
  Coins,
  ChevronDown,
  UserCheck,
  ShieldAlert
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  BarChart,
  PieChart,
  Pie,
  Cell,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface PharmacyAnalyticsProps {
  metrics?: any;
  medicines?: any[];
  prescriptions?: any[];
  returns?: any[];
}

export const PharmacyAnalyticsTab: React.FC<PharmacyAnalyticsProps> = ({
  metrics: _metrics = {},
  medicines = [],
  prescriptions = [],
  returns: _returns = []
}) => {
  const [period, setPeriod] = useState<"Today" | "7 Days" | "30 Days">("7 Days");

  // Calculate dynamic Total Inventory Value = Σ(stock × unitPrice)
  const totalInventoryVal = (medicines || []).reduce((acc: number, med: any) => {
    const stock = med.stock ?? med.stockQuantity ?? 0;
    const price = med.unitPrice || 0;
    return acc + stock * price;
  }, 0);

  const formattedInventoryVal =
    totalInventoryVal >= 100000
      ? `₹${(totalInventoryVal / 100000).toFixed(1)}L`
      : totalInventoryVal > 0
      ? `₹${(totalInventoryVal / 1000).toFixed(1)}k`
      : `₹23.9k`;

  // Count stock-outs (stock <= 0)
  const stockOutsCount = (medicines || []).filter(
    (med: any) => (med.stock ?? med.stockQuantity ?? 0) <= 0
  ).length;

  // Count scripts processed
  const scriptsCount = prescriptions.length > 0 ? prescriptions.length : 3;

  // Chart data based on selected period
  const turnoverData =
    period === "Today"
      ? [
          { time: "08:00", turnover: 2.1, expiryLoss: 2000 },
          { time: "11:00", turnover: 4.8, expiryLoss: 1500 },
          { time: "14:00", turnover: 5.2, expiryLoss: 800 },
          { time: "17:00", turnover: 3.9, expiryLoss: 3000 },
          { time: "20:00", turnover: 5.8, expiryLoss: 1200 }
        ]
      : period === "30 Days"
      ? [
          { time: "W1", turnover: 3.9, expiryLoss: 18000 },
          { time: "W2", turnover: 4.6, expiryLoss: 12500 },
          { time: "W3", turnover: 5.2, expiryLoss: 9000 },
          { time: "W4", turnover: 5.8, expiryLoss: 4500 }
        ]
      : [
          { time: "Mon", turnover: 4.2, expiryLoss: 12000 },
          { time: "Tue", turnover: 4.5, expiryLoss: 8500 },
          { time: "Wed", turnover: 3.8, expiryLoss: 15000 },
          { time: "Thu", turnover: 5.1, expiryLoss: 5000 },
          { time: "Fri", turnover: 4.9, expiryLoss: 7500 },
          { time: "Sat", turnover: 5.5, expiryLoss: 4500 }
        ];

  const tatData =
    period === "Today"
      ? [
          { time: "08:00", tat: 10 },
          { time: "11:00", tat: 38 },
          { time: "14:00", tat: 25 },
          { time: "17:00", tat: 40 },
          { time: "20:00", tat: 14 }
        ]
      : period === "30 Days"
      ? [
          { time: "W1", tat: 28 },
          { time: "W2", tat: 22 },
          { time: "W3", tat: 19 },
          { time: "W4", tat: 16 }
        ]
      : [
          { time: "08:00", tat: 12 },
          { time: "10:00", tat: 45 },
          { time: "12:00", tat: 32 },
          { time: "14:00", tat: 22 },
          { time: "16:00", tat: 35 },
          { time: "18:00", tat: 15 }
        ];

  // Section 4 Data: Pharmacist Productivity
  const productivityData = [
    { name: "Rajesh", score: 92 },
    { name: "Sunita", score: 84 },
    { name: "Vikram", score: 70 },
    { name: "Anjali", score: 65 }
  ];

  // Section 4 Data: Weekly Stock-out Incidents
  const stockoutIncidentsData = [
    { day: "Mon", incidents: 2 },
    { day: "Tue", incidents: 4 },
    { day: "Wed", incidents: 1 },
    { day: "Thu", incidents: 7 },
    { day: "Fri", incidents: 3 },
    { day: "Sat", incidents: 0 },
    { day: "Sun", incidents: 2 }
  ];

  // Section 4 Data: High-Risk Drug Usage Donut Data
  const highRiskData = [
    { name: "Antibiotics", value: 95, color: "#8b5cf6" },
    { name: "High Alert", value: 65, color: "#f43f5e" },
    { name: "Narcotics", value: 35, color: "#f59e0b" },
    { name: "Normal", value: 40, color: "#10b981" }
  ];

  return (
    <div className="space-y-6">
      {/* SECTION 1 — ANALYTICS HEADER & PERIOD SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base font-black text-[#0f172a] uppercase tracking-wider">
            PHARMACY ANALYTICS & PERFORMANCE
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Real-time velocity, dispensing TAT, wastage metrics, and valuation.
          </p>
        </div>

        <div className="relative shrink-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="appearance-none bg-white border border-slate-200/80 rounded-xl px-4 py-2 pr-9 text-xs font-extrabold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
          >
            <option value="Today">Today</option>
            <option value="7 Days">7 Days</option>
            <option value="30 Days">30 Days</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* SECTION 2 — SIX KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* CARD 1: TURNOVER */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2 flex flex-col justify-between hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              TURNOVER
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#0f172a] tracking-tight font-mono">
              5.5x
            </div>
            <div className="text-[10px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded inline-block mt-1">
              High Velocity
            </div>
          </div>
        </div>

        {/* CARD 2: STOCK-OUTS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2 flex flex-col justify-between hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              STOCK-OUTS
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#0f172a] tracking-tight font-mono">
              {stockOutsCount}
            </div>
            <div className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded inline-block mt-1">
              Critical Low
            </div>
          </div>
        </div>

        {/* CARD 3: EXPIRY LOSS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2 flex flex-col justify-between hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              EXPIRY LOSS
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarX className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#0f172a] tracking-tight font-mono">
              ₹4.5k
            </div>
            <div className="text-[10px] font-bold text-amber-700 mt-0.5">
              ↓ 12% vs last month
            </div>
          </div>
        </div>

        {/* CARD 4: DISPENSING TAT */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2 flex flex-col justify-between hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              DISPENSING TAT
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#0f172a] tracking-tight font-mono">
              18m
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">
              Avg per script
            </div>
          </div>
        </div>

        {/* CARD 5: SCRIPTS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2 flex flex-col justify-between hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              SCRIPTS
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#0f172a] tracking-tight font-mono">
              {scriptsCount}
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">
              This Week
            </div>
          </div>
        </div>

        {/* CARD 6: INVENTORY VAL */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-2 flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              INVENTORY VAL
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#0f172a] tracking-tight font-mono">
              {formattedInventoryVal}
            </div>
            <div className="text-[10px] font-bold text-slate-400 mt-0.5">
              Total Assets
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 — TWO MAIN CHARTS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT CHART: TURNOVER EFFICIENCY VS EXPIRY LOSS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-[#0f172a]">
              Turnover Efficiency vs Expiry Loss
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Correlation between inventory movement speed and wastage.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={turnoverData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#8b5cf6", fontWeight: 700 }}
                  unit="x"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#f97316", fontWeight: 700 }}
                />
                <Tooltip content={<LeftChartTooltip />} />
                <Bar yAxisId="left" dataKey="turnover" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={28} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="expiryLoss"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT CHART: DISPENSING TAT TRENDS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-[#0f172a]">
              Dispensing TAT Trends
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Average turnaround time (minutes) throughout the day.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#3b82f6", fontWeight: 700 }}
                  unit="m"
                />
                <Tooltip content={<RightChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tat"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#tatGradient)"
                  dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 7 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 4 — ADDITIONAL ANALYTICS (THREE CARDS ROW) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: PHARMACIST PRODUCTIVITY */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#0f172a]">
                Pharmacist Productivity
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Fulfillment efficiency per staff member.
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={productivityData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} unit="%" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#0f172a", fontWeight: 700 }} />
                <Tooltip content={<ProductivityTooltip />} />
                <Bar dataKey="score" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 2: STOCK-OUT INCIDENTS (WEEKLY) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#0f172a]">
                Stock-out Incidents (Weekly)
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Reported inventory stock-out events across wards.
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockoutIncidentsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="stockoutGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 10, fill: "#f43f5e", fontWeight: 700 }} />
                <Tooltip content={<StockoutTooltip />} />
                <Area
                  type="monotone"
                  dataKey="incidents"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fill="url(#stockoutGradient)"
                  dot={{ r: 4, fill: "#f43f5e", strokeWidth: 1.5, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 3: HIGH-RISK DRUG USAGE (DONUT CHART) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#0f172a]">
                High-Risk Drug Usage
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                Dispensed volume by controlled category.
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={highRiskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {highRiskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* CENTER TEXT OVERLAY */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-[#0f172a] font-mono leading-none">235</span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">UNITS</span>
            </div>
          </div>

          {/* LEGEND */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            {highRiskData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 text-[11px] truncate">{item.name}</span>
                <span className="text-slate-900 font-mono text-[11px] ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CUSTOM TOOLTIPS ---
const LeftChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-bold space-y-1">
        <div className="text-slate-400 border-b border-slate-700 pb-1 font-mono">{label}</div>
        <div className="text-purple-300">Turnover Velocity: {payload[0]?.value}x</div>
        <div className="text-amber-300">Expiry Loss: ₹{payload[1]?.value?.toLocaleString()}</div>
      </div>
    );
  }
  return null;
};

const RightChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-bold space-y-1">
        <div className="text-slate-400 border-b border-slate-700 pb-1 font-mono">Time: {label}</div>
        <div className="text-blue-300">Avg TAT: {payload[0]?.value} min</div>
      </div>
    );
  }
  return null;
};

const ProductivityTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs font-bold space-y-0.5">
        <div className="text-purple-300">{label}</div>
        <div className="text-white font-mono">Productivity: {payload[0]?.value}%</div>
      </div>
    );
  }
  return null;
};

const StockoutTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs font-bold space-y-0.5">
        <div className="text-rose-300">{label}</div>
        <div className="text-white font-mono">Stock-out Events: {payload[0]?.value}</div>
      </div>
    );
  }
  return null;
};

const DonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs font-bold space-y-0.5">
        <div style={{ color: data.payload.color }}>{data.name}</div>
        <div className="text-white font-mono">{data.value} Units</div>
      </div>
    );
  }
  return null;
};
