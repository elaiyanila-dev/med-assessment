import React, { useState } from "react";
import { FileText, Check, Loader2, Stethoscope } from "lucide-react";
import { api } from "../../services/api";

interface ConsultationNotesProps {
  consultationId: string;
  initialSubjective?: string | null;
  initialObjective?: string | null;
  initialAssessment?: string | null;
  initialPlan?: string | null;
  initialIcd10Code?: string | null;
  onNotesSaved: (consultation: any) => void;
}

export const ConsultationNotes: React.FC<ConsultationNotesProps> = ({
  consultationId,
  initialSubjective,
  initialObjective,
  initialAssessment,
  initialPlan,
  initialIcd10Code,
  onNotesSaved
}) => {
  const [subjective, setSubjective] = useState<string>(initialSubjective || "");
  const [objective, setObjective] = useState<string>(initialObjective || "");
  const [assessment, setAssessment] = useState<string>(initialAssessment || "");
  const [plan, setPlan] = useState<string>(initialPlan || "");
  const [icd10Code, setIcd10Code] = useState<string>(initialIcd10Code || "");

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
        subjective,
        objective,
        assessment,
        plan,
        icd10Code
      };

      const response = await api.patch(`/consultations/${consultationId}/notes`, payload);
      if (response.data?.success) {
        setSuccessMsg("Clinical notes & diagnosis saved!");
        onNotesSaved(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to save notes");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Error saving notes");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Clinical SOAP Notes & Diagnosis</span>
        </div>
        {successMsg && (
          <span className="text-xs font-bold text-emerald-600 flex items-center">
            <Check className="w-3.5 h-3.5 mr-1" /> {successMsg}
          </span>
        )}
        {errorMsg && <span className="text-xs font-bold text-rose-600">{errorMsg}</span>}
      </div>

      {/* ICD-10 Diagnosis Bar */}
      <div className="bg-purple-50/60 border border-purple-200 p-3.5 rounded-xl space-y-1.5">
        <label className="block text-xs font-bold text-purple-900 flex items-center space-x-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-purple-700" />
          <span>ICD-10 Primary Diagnosis Code</span>
        </label>
        <input
          type="text"
          placeholder="e.g. J06.9 (Acute upper respiratory infection) or E11.9 (Type 2 diabetes)"
          value={icd10Code}
          onChange={(e) => setIcd10Code(e.target.value)}
          className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-purple-600 transition-all"
        />
      </div>

      {/* SOAP Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subjective */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Subjective (Chief Complaints)</label>
          <textarea
            rows={3}
            placeholder="Patient's symptoms, history of present illness..."
            value={subjective}
            onChange={(e) => setSubjective(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Objective */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Objective (Clinical Observations)</label>
          <textarea
            rows={3}
            placeholder="Physical examination findings, vital observations..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Assessment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment (Clinical Impression)</label>
          <textarea
            rows={3}
            placeholder="Diagnosis, differential diagnosis, severity..."
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Plan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Plan (Treatment & Follow-up)</label>
          <textarea
            rows={3}
            placeholder="Treatment plan, advice, follow-up instructions..."
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:border-purple-500 focus:bg-white transition-all"
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
            <span>Save Clinical Notes</span>
          )}
        </button>
      </div>
    </form>
  );
};
