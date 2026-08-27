import React, { useState } from "react";
import { HeartPulse, Check, Loader2 } from "lucide-react";
import { api } from "../../services/api";

interface VitalsFormProps {
  consultationId: string;
  initialVitals?: {
    systolicBP?: number | null;
    diastolicBP?: number | null;
    spo2?: number | null;
    temperature?: number | null;
    weight?: number | null;
  } | null;
  onVitalSaved: (vital: any) => void;
}

export const VitalsForm: React.FC<VitalsFormProps> = ({
  consultationId,
  initialVitals,
  onVitalSaved
}) => {
  const [systolicBP, setSystolicBP] = useState<string>(initialVitals?.systolicBP?.toString() || "");
  const [diastolicBP, setDiastolicBP] = useState<string>(initialVitals?.diastolicBP?.toString() || "");
  const [spo2, setSpo2] = useState<string>(initialVitals?.spo2?.toString() || "");
  const [temperature, setTemperature] = useState<string>(initialVitals?.temperature?.toString() || "");
  const [weight, setWeight] = useState<string>(initialVitals?.weight?.toString() || "");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload = {
        systolicBP: systolicBP ? parseInt(systolicBP, 10) : undefined,
        diastolicBP: diastolicBP ? parseInt(diastolicBP, 10) : undefined,
        spo2: spo2 ? parseInt(spo2, 10) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        weight: weight ? parseFloat(weight) : undefined
      };

      const response = await api.post(`/consultations/${consultationId}/vitals`, payload);
      if (response.data?.success) {
        setSuccessMsg("Vitals saved successfully!");
        onVitalSaved(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to save vitals");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Error saving vitals");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
          <HeartPulse className="w-4 h-4 text-purple-600" />
          <span>Record Patient Vitals</span>
        </div>
        {successMsg && (
          <span className="text-xs font-bold text-emerald-600 flex items-center">
            <Check className="w-3.5 h-3.5 mr-1" /> {successMsg}
          </span>
        )}
        {errorMsg && <span className="text-xs font-bold text-rose-600">{errorMsg}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Sys BP (mmHg)</label>
          <input
            type="number"
            placeholder="120"
            value={systolicBP}
            onChange={(e) => setSystolicBP(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Dia BP (mmHg)</label>
          <input
            type="number"
            placeholder="80"
            value={diastolicBP}
            onChange={(e) => setDiastolicBP(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">SpO2 (%)</label>
          <input
            type="number"
            placeholder="98"
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Temp (°F)</label>
          <input
            type="number"
            step="0.1"
            placeholder="98.6"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Weight (kg)</label>
          <input
            type="number"
            step="0.5"
            placeholder="65.0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Vitals</span>
          )}
        </button>
      </div>
    </form>
  );
};
