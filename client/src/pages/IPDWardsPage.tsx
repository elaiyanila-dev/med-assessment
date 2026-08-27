import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Bed as BedIcon, RefreshCw, ShieldAlert } from "lucide-react";
import { api } from "../services/api";
import { IPDSkeleton } from "../components/ipd/IPDSkeleton";
import { IPDSummaryCards } from "../components/ipd/IPDSummaryCards";
import { WardOverviewCard } from "../components/ipd/WardOverviewCard";
import { BedGrid, BedItem } from "../components/ipd/BedGrid";
import { AdmittedPatientList, AdmittedPatientItem } from "../components/ipd/AdmittedPatientList";
import { WardRoundModal } from "../components/ipd/WardRoundModal";
import { IPDIndentModal } from "../components/ipd/IPDIndentModal";

export const IPDWardsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const admissionIdFromUrl = searchParams.get("admissionId");

  const [ipdData, setIpdData] = useState<any | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  useEffect(() => {
    if (admissionIdFromUrl && ipdData?.admissions) {
      const found = ipdData.admissions.find((a: any) => a.id === admissionIdFromUrl);
      if (found) {
        setSelectedWard(found.ward);
      }
    }
  }, [admissionIdFromUrl, ipdData]);

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

  const handleSelectBed = (bed: BedItem) => {
    if (bed.activeAdmission) {
      setSearchParams({ admissionId: bed.activeAdmission.id });
    }
  };

  const handleSelectAdmission = (adm: AdmittedPatientItem) => {
    setSearchParams({ admissionId: adm.id });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
            <BedIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">IPD & Wards</h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Inpatient Department & Ward Management Workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchIPDData}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh IPD Data</span>
        </button>
      </div>

      {/* Error Alert State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 flex flex-col sm:flex-row items-center justify-between gap-4">
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

      {/* Main Workspace Layout */}
      {isLoading ? (
        <IPDSkeleton />
      ) : ipdData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <IPDSummaryCards metrics={ipdData.metrics} />

          {/* Ward Overview Breakdown */}
          <WardOverviewCard
            wards={ipdData.wards}
            selectedWard={selectedWard}
            onSelectWard={setSelectedWard}
          />

          {/* Bed Occupancy Grid */}
          <BedGrid
            beds={ipdData.beds}
            selectedWard={selectedWard}
            onSelectBed={handleSelectBed}
          />

          {/* Active Admissions Table */}
          <AdmittedPatientList
            admissions={ipdData.admissions}
            onSelectAdmission={handleSelectAdmission}
            onOpenWardRound={(adm) => setActiveWardRoundAdmission(adm)}
            onOpenIndent={(adm) => setActiveIndentAdmission(adm)}
          />
        </div>
      ) : null}

      {/* Ward Round Modal */}
      <WardRoundModal
        isOpen={activeWardRoundAdmission !== null}
        onClose={() => setActiveWardRoundAdmission(null)}
        admission={activeWardRoundAdmission}
        onSaved={fetchIPDData}
      />

      {/* IPD Indent Modal */}
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
