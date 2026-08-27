import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { LabSkeleton } from "../components/lab/LabSkeleton";
import { LabSummaryCards } from "../components/lab/LabSummaryCards";
import { LabFilterBar } from "../components/lab/LabFilterBar";
import { LabOrderTable } from "../components/lab/LabOrderTable";
import { SampleCollectionModal } from "../components/lab/SampleCollectionModal";
import { LabResultEntryModal } from "../components/lab/LabResultEntryModal";
import { LabResultDetailsModal } from "../components/lab/LabResultDetailsModal";
import { TestTube, AlertCircle } from "lucide-react";

export const LaboratoryPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStatusFilter = searchParams.get("status") || "ALL";
  const currentSearchQuery = searchParams.get("search") || "";
  const selectedOrderId = searchParams.get("orderId");

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals state
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <TestTube className="w-6 h-6 text-purple-600" />
              <span>MedNxt Clinical Laboratory Workspace</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Specimen sample collection, processing workflow, test parameter recording, and pathologist report release.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <span>Role:</span>
            <span className="font-bold text-purple-700 font-mono">{user?.role || "STAFF"}</span>
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
          <>
            {/* Metric Summary Cards */}
            {dashboardData?.metrics && <LabSummaryCards metrics={dashboardData.metrics} />}

            {/* Filter & Search Controls */}
            <LabFilterBar
              currentFilter={currentStatusFilter}
              onFilterChange={handleFilterChange}
              searchQuery={currentSearchQuery}
              onSearchChange={handleSearchChange}
            />

            {/* Orders Queue Table */}
            {dashboardData?.orders && (
              <LabOrderTable
                orders={dashboardData.orders}
                userRole={user?.role}
                onCollectSample={handleCollectSample}
                onProcessOrder={handleProcessOrder}
                onEnterResults={handleEnterResults}
                onViewDetails={handleViewDetails}
              />
            )}
          </>
        )}

        {/* Modals */}
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
