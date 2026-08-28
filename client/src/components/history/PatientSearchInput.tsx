import React, { useState, useEffect } from "react";
import { Search, User, ChevronDown, Loader2 } from "lucide-react";
import { api } from "../../services/api";

export interface PatientSearchResult {
  id: string;
  name: string;
  UHID: string;
  age?: number | null;
  gender: string;
  mobile: string;
  bloodGroup?: string | null;
}

interface PatientSearchInputProps {
  onSelectPatient: (patient: PatientSearchResult) => void;
  selectedPatientId?: string | null;
}

export const PatientSearchInput: React.FC<PatientSearchInputProps> = ({
  onSelectPatient,
  selectedPatientId
}) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/history/patients", {
          params: { search: query }
        });
        if (isMounted && response.data?.success) {
          setResults(response.data.data);
        }
      } catch {
        // Non-blocking search error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchPatients, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          placeholder="Search patient by Name, UHID, or Mobile..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600 focus:bg-white transition-all shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-purple-600 animate-spin absolute right-3.5 top-3" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 max-h-60 overflow-y-auto">
          {results.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                onSelectPatient(p);
                setIsOpen(false);
                setQuery(p.name);
              }}
              className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">{p.name}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {p.UHID} • {p.age ? `${p.age}y` : ""} {p.gender}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{p.mobile}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
