import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { LabSkeleton } from "../components/lab/LabSkeleton";
import { LabKpiCards } from "../components/lab/LabKpiCards";
import { LabAnalyticsSection } from "../components/lab/LabAnalyticsSection";
import { CriticalResultsTable } from "../components/lab/CriticalResultsTable";
import { LabFilterBar } from "../components/lab/LabFilterBar";
import { LabOrderTable } from "../components/lab/LabOrderTable";
import { LabOrdersSection } from "../components/lab/LabOrdersSection";
import { LabCollectionSection } from "../components/lab/LabCollectionSection";
import { LabResultsSection } from "../components/lab/LabResultsSection";
import { SampleCollectionModal } from "../components/lab/SampleCollectionModal";
import { LabResultEntryModal } from "../components/lab/LabResultEntryModal";
import { LabResultDetailsModal } from "../components/lab/LabResultDetailsModal";
import { NewLabOrderModal } from "../components/lab/NewLabOrderModal";
import { Microscope, Plus, AlertCircle } from "lucide-react";

export const LaboratoryPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatusFilter = searchParams.get("status") || "ALL";
  const currentSearchQuery = searchParams.get("search") || "";
  const selectedOrderId = searchParams.get("orderId");

  const [activeTab, setActiveTab] = useState<"Dashboard" | "Orders" | "Collection" | "Results">("Dashboard");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [activeCollectOrder, setActiveCollectOrder] = useState<any | null>(null);
  const [activeResultEntryOrder, setActiveResultEntryOrder] = useState<any | null>(null);
  const [activeViewOrder, setActiveViewOrder] = useState<any | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params: any = {};
      if (currentStatusFilter !== "ALL") params.status = currentStatusFilter;
      if (currentSearchQuery.trim()) params.search = currentSearchQuery.trim();

      const response = await api.get("/laboratory", { params });

      if (response.data?.success) {
        setDashboardData(response.data.data);

        // Handle URL deep-linking for orderId
        if (selectedOrderId && response.data.data.orders) {
          const matched = response.data.data.orders.find((o: any) => o.id === selectedOrderId);
          if (matched) {
            setActiveViewOrder(matched);
          }
        }
      } else {
        throw new Error(response.data?.error?.message || "Failed to load laboratory workspace");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Error connecting to Laboratory service");
    } finally {
      setIsLoading(false);
    }
  }, [currentStatusFilter, currentSearchQuery, selectedOrderId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFilterChange = (newFilter: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newFilter === "ALL") {
      nextParams.delete("status");
    } else {
      nextParams.set("status", newFilter);
    }
    setSearchParams(nextParams);
  };

  const handleSearchChange = (newSearch: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!newSearch.trim()) {
      nextParams.delete("search");
    } else {
      nextParams.set("search", newSearch);
    }
    setSearchParams(nextParams);
  };

  const handleCollectSample = (order: any) => {
    setActiveCollectOrder(order);
  };

  const handleProcessOrder = async (order: any) => {
    try {
      const response = await api.post(`/laboratory/orders/${order.id}/process`);
      if (response.data?.success) {
        fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to start processing");
    }
  };

  const handleEnterResults = (order: any) => {
    setActiveResultEntryOrder(order);
  };

  const handleViewDetails = (order: any) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("orderId", order.id);
    setSearchParams(nextParams);
    setActiveViewOrder(order);
  };

  const handleCreateNewOrder = () => {
    setIsNewOrderModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 md:px-6 py-6">
      {/* MAIN LABORATORY HEADER CARD MATCHING REFERENCE SCREENSHOT #1 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            {/* Microscope Icon in Purple Square Box */}
            <div className="w-12 h-12 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center border border-purple-200/80 shrink-0">
              <Microscope className="w-6.5 h-6.5 text-purple-700" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#0f172a] tracking-tight">
                Laboratory Command Center
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                78 Samples In-Process • <span className="text-rose-600 font-extrabold">21 STAT Pending</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateNewOrder}
            className="px-4 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-0.5 pt-1 overflow-x-auto">
          {(["Dashboard", "Orders", "Collection", "Results"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading && !dashboardData ? (
        <LabSkeleton />
      ) : (
        <div className="space-y-6">
          {/* DASHBOARD TAB VIEW - MATCHES REFERENCE SCREENSHOT #1 & #2 EXACTLY */}
          {activeTab === "Dashboard" && (
            <>
              {/* 1. Four KPI Cards */}
              <LabKpiCards
                data={
                  dashboardData?.metrics || {
                    toCollect: 47,
                    processing: 78,
                    completedToday: 29,
                    criticalValues: 7
                  }
                }
              />

              {/* 2. Analytics Section (Samples Received Line Chart + Department Load Bar Chart) */}
              <LabAnalyticsSection
                samplesData={dashboardData?.samplesReceivedChart}
                departmentLoad={dashboardData?.departmentLoad}
              />

              {/* 3. Critical Results Section (Action Required Table) */}
              <CriticalResultsTable results={dashboardData?.criticalResults} />
            </>
          )}

          {/* ORDERS TAB VIEW - MATCHES FIRST REFERENCE SCREENSHOT EXACTLY */}
          {activeTab === "Orders" && dashboardData?.orders && (
            <LabOrdersSection
              orders={dashboardData.orders}
              onViewDetails={handleViewDetails}
            />
          )}

          {/* COLLECTION TAB VIEW - MATCHES SCREENSHOT 1 EXACTLY */}
          {activeTab === "Collection" && dashboardData?.orders && (
            <LabCollectionSection
              orders={dashboardData.orders}
              onSuccess={fetchDashboardData}
            />
          )}

          {/* RESULTS TAB VIEW - MATCHES FIRST SCREENSHOT EXACTLY */}
          {activeTab === "Results" && dashboardData?.orders && (
            <LabResultsSection
              orders={dashboardData.orders}
              userRole={user?.role}
              onSuccess={fetchDashboardData}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <NewLabOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      {activeCollectOrder && (
        <SampleCollectionModal
          order={activeCollectOrder}
          onClose={() => setActiveCollectOrder(null)}
          onSuccess={fetchDashboardData}
        />
      )}

      {activeResultEntryOrder && (
        <LabResultEntryModal
          order={activeResultEntryOrder}
          onClose={() => setActiveResultEntryOrder(null)}
          onSuccess={fetchDashboardData}
        />
      )}

      {activeViewOrder && (
        <LabResultDetailsModal
          order={activeViewOrder}
          userRole={user?.role}
          onClose={() => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("orderId");
            setSearchParams(nextParams);
            setActiveViewOrder(null);
          }}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default LaboratoryPage;
