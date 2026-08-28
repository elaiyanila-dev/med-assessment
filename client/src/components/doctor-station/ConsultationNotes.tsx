import React, { useState, useEffect } from "react";
import { Check, Loader2, Stethoscope, Mic, MicOff, AlertCircle } from "lucide-react";
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
  const [activeSoapTab, setActiveSoapTab] = useState<"SUBJECTIVE" | "OBJECTIVE" | "ASSESSMENT" | "PLAN">("OBJECTIVE");

  const [subjective, setSubjective] = useState<string>(initialSubjective || "");
  const [objective, setObjective] = useState<string>(initialObjective || "");
  const [assessment, setAssessment] = useState<string>(initialAssessment || "");
  const [plan, setPlan] = useState<string>(initialPlan || "");
  const [icd10Code, setIcd10Code] = useState<string>(initialIcd10Code || "");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync internal state whenever patient or consultationId changes
  useEffect(() => {
    setSubjective(initialSubjective || "");
    setObjective(initialObjective || "");
    setAssessment(initialAssessment || "");
    setPlan(initialPlan || "");
    setIcd10Code(initialIcd10Code || "");
    setSuccessMsg(null);
    setErrorMsg(null);
  }, [consultationId, initialSubjective, initialObjective, initialAssessment, initialPlan, initialIcd10Code]);

  // Voice Dictation Handler using Web Speech API with safe fallback
  const handleDictate = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg("Voice dictation is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      setIsListening(true);
      setErrorMsg(null);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (activeSoapTab === "OBJECTIVE") {
          setObjective((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else if (activeSoapTab === "SUBJECTIVE") {
          setSubjective((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else if (activeSoapTab === "ASSESSMENT") {
          setAssessment((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else if (activeSoapTab === "PLAN") {
          setPlan((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== "no-speech") {
          setErrorMsg(`Voice dictation notice: ${event.error || "Unable to capture audio"}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setErrorMsg("Voice dictation could not be initialized.");
    }
  };

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
        setSuccessMsg("Clinical notes saved successfully.");
        onNotesSaved(response.data.data);
      } else {
        throw new Error(response.data?.error?.message || "Failed to save clinical notes");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Error saving clinical notes");
    } finally {
      setIsSubmitting(false);
    }
  };

  const soapSubTabs: Array<{ key: "SUBJECTIVE" | "OBJECTIVE" | "ASSESSMENT" | "PLAN"; label: string; hasDot?: boolean }> = [
    { key: "SUBJECTIVE", label: "SUBJECTIVE" },
    { key: "OBJECTIVE", label: "OBJECTIVE", hasDot: true },
    { key: "ASSESSMENT", label: "ASSESSMENT" },
    { key: "PLAN", label: "PLAN" }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SOAP Sub-tabs */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {soapSubTabs.map((tab) => {
            const isActive = activeSoapTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSoapTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                  isActive
                    ? "bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs"
                    : "bg-slate-100/80 text-slate-500 hover:text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                {tab.hasDot && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Success / Error Messages */}
        <div className="flex items-center space-x-2">
          {successMsg && (
            <span className="text-xs font-extrabold text-emerald-600 flex items-center bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Check className="w-3.5 h-3.5 mr-1" /> {successMsg}
            </span>
          )}
          {errorMsg && (
            <span className="text-xs font-extrabold text-rose-600 flex items-center bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 mr-1" /> {errorMsg}
            </span>
          )}
        </div>
      </div>

      {/* Heading: Chief Complaints & History + Dictate Button */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-base font-extrabold text-[#0f172a] tracking-tight">
          Chief Complaints & History
        </h3>

        <button
          type="button"
          onClick={handleDictate}
          className={`px-3.5 py-1.5 border rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
            isListening
              ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
              : "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200/80"
          }`}
          title="Voice Dictation"
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5 text-rose-600" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-purple-600" />
              <span>🎙 Dictate</span>
            </>
          )}
        </button>
      </div>

      {/* Active SOAP Tab Textarea Area */}
      {activeSoapTab === "SUBJECTIVE" && (
        <div>
          <textarea
            rows={6}
            placeholder="High Fever & Chills since 2 days, headache, weakness..."
            value={subjective}
            onChange={(e) => setSubjective(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>
      )}

      {activeSoapTab === "OBJECTIVE" && (
        <div>
          <textarea
            rows={6}
            placeholder="Physical examination findings, vital observations, clinical examination notes..."
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>
      )}

      {activeSoapTab === "ASSESSMENT" && (
        <div>
          <textarea
            rows={6}
            placeholder="Clinical assessment, differential diagnosis, condition severity..."
            value={assessment}
            onChange={(e) => setAssessment(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>
      )}

      {activeSoapTab === "PLAN" && (
        <div>
          <textarea
            rows={6}
            placeholder="Treatment plan, clinical advice, follow-up instructions..."
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>
      )}

      {/* ICD-10 Primary Diagnosis Code Section */}
      <div className="bg-purple-50/40 border border-purple-200/80 p-4 rounded-2xl space-y-1.5">
        <label className="block text-xs font-extrabold text-[#0f172a] flex items-center space-x-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-purple-700" />
          <span>ICD-10 Primary Diagnosis Code</span>
        </label>
        <input
          type="text"
          placeholder="e.g. J06.9 (Acute upper respiratory infection) or E11.9 (Type 2 diabetes)"
          value={icd10Code}
          onChange={(e) => setIcd10Code(e.target.value)}
          className="w-full bg-white border border-purple-200/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-[#6336d3] hover:bg-[#5228be] active:bg-[#461fa8] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
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

export default ConsultationNotes;
