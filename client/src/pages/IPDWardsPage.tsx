import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Bed as BedIcon, RefreshCw, ShieldAlert, UserCheck, Calendar, Pill, LayoutGrid, List, Plus } from "lucide-react";
import { api } from "../services/api";
import { IPDSkeleton } from "../components/ipd/IPDSkeleton";
import { IPDSummaryCards } from "../components/ipd/IPDSummaryCards";
import { BedGrid, BedItem } from "../components/ipd/BedGrid";
import { AdmittedPatientList, AdmittedPatientItem } from "../components/ipd/AdmittedPatientList";
import { WardRoundModal } from "../components/ipd/WardRoundModal";
import { IPDIndentModal } from "../components/ipd/IPDIndentModal";
import { NurseScheduleSection } from "../components/ipd/NurseScheduleSection";
import { WardPharmacySection } from "../components/ipd/WardPharmacySection";

export const IPDWardsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const admissionIdFromUrl = searchParams.get("admissionId");

  const [ipdData, setIpdData] = useState<any | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>("All");
  const [activeTab, setActiveTab] = useState<"beds" | "admissions" | "schedule" | "pharmacy">("beds");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [activeWardRoundAdmission, setActiveWardRoundAdmission] = useState<any | null>(null);
  const [activeIndentAdmission, setActiveIndentAdmission] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIPDData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get("/ipd");
      if (response.data?.success && response.data?.data) {
        setIpdData(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to load IPD dashboard data");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.message ||
        "Error loading IPD & Wards workspace."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIPDData();
  }, [fetchIPDData]);

  useEffect(() => {
    if (admissionIdFromUrl && ipdData?.admissions) {
      const found = ipdData.admissions.find((a: any) => a.id === admissionIdFromUrl);
      if (found) {
        setSelectedWard(found.ward);
      }
    }
  }, [admissionIdFromUrl, ipdData]);

  const handleSelectBed = (bed: BedItem) => {
    if (bed.activeAdmission) {
      setSearchParams({ admissionId: bed.activeAdmission.id });
    }
  };

  const handleSelectAdmission = (adm: AdmittedPatientItem) => {
    setSearchParams({ admissionId: adm.id });
  };

  if (isLoading) {
    return <IPDSkeleton />;
  }

  const wardFilters = ["All", "General Ward Male", "General Ward Female", "Private Ward", "ICU"];

  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-[#f8fafc] p-4 md:p-5 space-y-4 overflow-y-auto">
      {/* Error Alert State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">IPD Workspace Error</h3>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchIPDData}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {ipdData && (
        <>
          {/* Top 4 KPI Cards */}
          <IPDSummaryCards metrics={ipdData.metrics} />

          {/* Bed Management Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3 md:px-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Left Area: Navigation Tabs */}
            <div className="flex items-center space-x-1 border-b lg:border-b-0 border-slate-100 pb-2 lg:pb-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("beds")}
                className={`px-3.5 py-1.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "beds"
                    ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <BedIcon className="w-4 h-4 text-purple-600" />
                <span>Bed Management</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("admissions")}
                className={`px-3.5 py-1.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "admissions"
                    ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Admissions List</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`px-3.5 py-1.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "schedule"
                    ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Nurse Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("pharmacy")}
                className={`px-3.5 py-1.5 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === "pharmacy"
                    ? "border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Pill className="w-4 h-4" />
                <span>Ward Pharmacy</span>
              </button>
            </div>

            {/* Right Area: Ward Filters & Controls (Only for Bed Management tab) */}
            {activeTab === "beds" && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Ward Filter Pills */}
                <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 overflow-x-auto">
                  {wardFilters.map((wardName) => {
                    const isActive = selectedWard === wardName || (wardName === "All" && (!selectedWard || selectedWard === "All"));
                    return (
                      <button
                        key={wardName}
                        type="button"
                        onClick={() => setSelectedWard(wardName === "All" ? null : wardName)}
                        className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                          isActive
                            ? "bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        {wardName}
                      </button>
                    );
                  })}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "grid" ? "bg-white text-purple-700 shadow-2xs" : "text-slate-400 hover:text-slate-600"
                    }`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      viewMode === "list" ? "bg-white text-purple-700 shadow-2xs" : "text-slate-400 hover:text-slate-600"
                    }`}
                    aria-label="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add Bed Button */}
                <button
                  type="button"
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200/80 shadow-2xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-purple-600" />
                  <span>Add Bed</span>
                </button>
              </div>
            )}
          </div>

          {/* Primary View: Bed Management Grid */}
          {activeTab === "beds" && (
            <BedGrid
              beds={ipdData.beds}
              selectedWard={selectedWard}
              onSelectBed={handleSelectBed}
              onOpenWardRound={(adm) => setActiveWardRoundAdmission(adm)}
              onOpenDischarge={(adm) => setActiveWardRoundAdmission(adm)}
            />
          )}

          {/* Admissions List View Tab */}
          {activeTab === "admissions" && (
            <AdmittedPatientList
              admissions={ipdData.admissions}
              onSelectAdmission={handleSelectAdmission}
              onOpenWardRound={(adm) => setActiveWardRoundAdmission(adm)}
              onOpenIndent={(adm) => setActiveIndentAdmission(adm)}
            />
          )}

          {/* Nurse Schedule Tab */}
          {activeTab === "schedule" && <NurseScheduleSection />}

          {/* Ward Pharmacy Tab */}
          {activeTab === "pharmacy" && <WardPharmacySection />}
        </>
      )}

      {/* Modals */}
      <WardRoundModal
        isOpen={activeWardRoundAdmission !== null}
        onClose={() => setActiveWardRoundAdmission(null)}
        admission={activeWardRoundAdmission}
        onSaved={fetchIPDData}
      />

      <IPDIndentModal
        isOpen={activeIndentAdmission !== null}
        onClose={() => setActiveIndentAdmission(null)}
        admission={activeIndentAdmission}
        onSaved={fetchIPDData}
      />
    </div>
  );
};

export default IPDWardsPage;
