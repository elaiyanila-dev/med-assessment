import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bot,
  ClipboardCheck,
  Database,
  Monitor,
  Plus,
  Search,
  Truck,
  Wrench,
  Workflow
} from "lucide-react";
import { api } from "../services/api";
import { InventoryMasterTab } from "../components/pharmacy/InventoryMasterTab";

type InventoryTab = "inventory" | "procurement" | "distribution" | "assets" | "vendors";

const fallbackMedicines = [
  {
    id: "med-dolo",
    name: "Dolo 650",
    genericName: "Paracetamol",
    category: "Analgesic",
    stockQuantity: 1240,
    minimumStock: 100,
    unitPrice: 2,
    rackLocation: "R1-S2",
    expiryDate: "2025-12-01"
  },
  {
    id: "med-augmentin",
    name: "Augmentin 625",
    genericName: "Amoxicillin + Clavulanic Acid",
    category: "Antibiotic",
    stockQuantity: 45,
    minimumStock: 80,
    unitPrice: 22,
    rackLocation: "R2-S1",
    expiryDate: "2024-06-15"
  },
  {
    id: "med-pan",
    name: "Pan 40",
    genericName: "Pantoprazole",
    category: "Antacid",
    stockQuantity: 800,
    minimumStock: 100,
    unitPrice: 8,
    rackLocation: "R1-S4",
    expiryDate: "2025-08-10"
  },
  {
    id: "med-azithral",
    name: "Azithral 500",
    genericName: "Azithromycin",
    category: "Antibiotic",
    stockQuantity: 20,
    minimumStock: 75,
    unitPrice: 18,
    rackLocation: "R2-S1",
    expiryDate: "2024-11-20"
  },
  {
    id: "med-glycomet",
    name: "Glycomet 500",
    genericName: "Metformin",
    category: "Antidiabetic",
    stockQuantity: 500,
    minimumStock: 100,
    unitPrice: 4,
    rackLocation: "R3-S2",
    expiryDate: "2025-05-05"
  }
];

const biomedicalAssets = [
  { id: "AST-001", name: "Infusion Pump", department: "ICU", status: "Active", due: "2026-10-15" },
  { id: "AST-002", name: "Patient Monitor", department: "Emergency", status: "Maintenance", due: "2026-09-08" },
  { id: "AST-003", name: "ECG Machine", department: "Cardiology", status: "Active", due: "2026-12-02" },
  { id: "AST-004", name: "Syringe Pump", department: "NICU", status: "Active", due: "2026-11-21" }
];

const vendors = [
  { name: "MedSupply Partners", type: "Medicines", rating: "A", contact: "orders@medsupply.example" },
  { name: "CareTech Biomedical", type: "Equipment", rating: "A-", contact: "support@caretech.example" },
  { name: "NorthStar Logistics", type: "Distribution", rating: "B+", contact: "dispatch@northstar.example" }
];

const tabs: Array<{ id: InventoryTab; label: string; icon: React.ElementType }> = [
  { id: "inventory", label: "Inventory Master", icon: Database },
  { id: "procurement", label: "Procurement & AI", icon: ClipboardCheck },
  { id: "distribution", label: "Internal Distribution", icon: Workflow },
  { id: "assets", label: "Biomedical Assets", icon: Monitor },
  { id: "vendors", label: "Vendor Directory", icon: Truck }
];

export const InventoryAssetsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>("inventory");
  const [pharmacyData, setPharmacyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/pharmacy");
      if (res.data?.success && res.data?.data) {
        setPharmacyData(res.data.data);
      } else {
        throw new Error("Failed to load inventory records");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Error connecting to Inventory service");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const medicines = Array.isArray(pharmacyData?.medicines) && pharmacyData.medicines.length > 0
    ? pharmacyData.medicines
    : fallbackMedicines;

  const lowStockCount = useMemo(() => {
    return medicines.filter((med: any) => {
      const stock = med.stock ?? med.stockQuantity ?? 0;
      const minStock = med.minimumStock || 50;
      return stock < minStock;
    }).length;
  }, [medicines]);

  const maintenanceCount = biomedicalAssets.filter((asset) => asset.status === "Maintenance").length;

  const summaryCards = [
    { label: "Total SKUs", value: medicines.length, icon: Database, color: "text-purple-700 bg-purple-50 border-purple-100" },
    { label: "Pending POs", value: 1, icon: ClipboardCheck, color: "text-blue-700 bg-blue-50 border-blue-100" },
    { label: "In Maintenance", value: maintenanceCount, icon: Wrench, color: "text-orange-700 bg-orange-50 border-orange-100" },
    { label: "Low Stock Items", value: lowStockCount, icon: AlertCircle, color: "text-rose-700 bg-rose-50 border-rose-100" }
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      <div className="mx-auto w-full max-w-[1368px] space-y-6 px-4 py-6 pb-12 sm:px-6 lg:px-7">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    {card.label}
                  </div>
                  <div className={`text-3xl font-black font-mono ${card.label === "Low Stock Items" ? "text-rose-600" : "text-[#0f172a]"}`}>
                    {card.value}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 px-5 pt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-extrabold transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-purple-600 text-purple-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {loading && !pharmacyData ? (
              <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ) : activeTab === "inventory" ? (
              <InventoryMasterTab medicines={medicines} onSuccess={fetchInventoryData} />
            ) : activeTab === "procurement" ? (
              <ProcurementPanel />
            ) : activeTab === "distribution" ? (
              <DistributionPanel />
            ) : activeTab === "assets" ? (
              <BiomedicalAssetsPanel />
            ) : (
              <VendorDirectoryPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProcurementPanel: React.FC = () => (
  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-[#0f172a]">Purchase Order Queue</h2>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-extrabold text-white shadow-xs">
          <Plus className="h-4 w-4" />
          <span>New PO</span>
        </button>
      </div>
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80">
        {["Antibiotic replenishment", "ICU consumables", "Lab reagent restock"].map((item, index) => (
          <div key={item} className="flex items-center justify-between gap-4 p-4">
            <div>
              <div className="font-extrabold text-[#0f172a]">{item}</div>
              <div className="text-xs font-semibold text-slate-500">PO-{String(index + 1042).padStart(5, "0")} • Pending approval</div>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase text-amber-700">
              Review
            </span>
          </div>
        ))}
      </div>
    </div>
    <div className="rounded-2xl border border-purple-200/80 bg-purple-50 p-5 shadow-xs">
      <Bot className="mb-4 h-9 w-9 text-purple-700" />
      <h2 className="text-base font-black text-[#0f172a]">AI Reorder Signals</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Antibiotics and high-usage analgesics are trending below target cover. Suggested reorder window: next 48 hours.
      </p>
    </div>
  </div>
);

const DistributionPanel: React.FC = () => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
    <div className="mb-4 flex items-center gap-3">
      <Workflow className="h-5 w-5 text-purple-700" />
      <h2 className="text-base font-black text-[#0f172a]">Internal Distribution</h2>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {["ICU", "Emergency", "IPD Wards"].map((dept, index) => (
        <div key={dept} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{dept}</div>
          <div className="mt-2 text-2xl font-black text-[#0f172a]">{index + 2}</div>
          <div className="text-xs font-semibold text-slate-500">open indent requests</div>
        </div>
      ))}
    </div>
  </div>
);

const BiomedicalAssetsPanel: React.FC = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          placeholder="Search biomedical assets..."
        />
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-5 py-3.5">Asset</th>
            <th className="px-5 py-3.5">Department</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5">Service Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {biomedicalAssets.map((asset) => (
            <tr key={asset.id} className="hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="font-black text-[#0f172a]">{asset.name}</div>
                <div className="font-mono text-[11px] font-bold text-slate-400">{asset.id}</div>
              </td>
              <td className="px-5 py-4 font-bold text-slate-700">{asset.department}</td>
              <td className="px-5 py-4">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
                  asset.status === "Maintenance"
                    ? "border-orange-200 bg-orange-50 text-orange-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}>
                  {asset.status}
                </span>
              </td>
              <td className="px-5 py-4 font-mono font-bold text-slate-600">{asset.due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const VendorDirectoryPanel: React.FC = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    {vendors.map((vendor) => (
      <div key={vendor.name} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <Truck className="mb-4 h-8 w-8 text-purple-700" />
        <h2 className="text-base font-black text-[#0f172a]">{vendor.name}</h2>
        <div className="mt-3 space-y-2 text-xs font-bold text-slate-600">
          <div>Category: {vendor.type}</div>
          <div>Rating: {vendor.rating}</div>
          <div className="break-all font-mono text-slate-500">{vendor.contact}</div>
        </div>
      </div>
    ))}
  </div>
);

export default InventoryAssetsPage;
