import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Bot,
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Send,
  Loader2,
  Users,
  AlertTriangle,
  FlaskConical,
  Bed,
  Newspaper
} from "lucide-react";
import {
  CopilotMessage,
  executeQuickAction,
  processNaturalLanguageQuery
} from "../../services/copilotEngine";

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGES: CopilotMessage[] = [
  {
    id: "msg-init",
    sender: "copilot",
    text: "Hello! I am your MedNxt Co-pilot. I can summarize hospital data or search the web for medical protocols. Try the quick actions below!",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
];

export const CopilotPanel: React.FC<CopilotPanelProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [messages, setMessages] = useState<CopilotMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isAnalyzing) return;

    const userMsg: CopilotMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setIsAnalyzing(true);

    try {
      const responseText = await processNaturalLanguageQuery(text, location.pathname);
      const agentMsg: CopilotMessage = {
        id: `msg-copilot-${Date.now()}`,
        sender: "copilot",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      const errorMsg: CopilotMessage = {
        id: `msg-error-${Date.now()}`,
        sender: "copilot",
        text: "I couldn't process that request right now. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuickAction = async (
    actionType: "patient_summary" | "low_stock" | "pending_labs" | "bed_occupancy" | "medical_news",
    label: string
  ) => {
    if (isAnalyzing) return;

    const userMsg: CopilotMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: label,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAnalyzing(true);

    try {
      const responseText = await executeQuickAction(actionType, location.pathname);
      const agentMsg: CopilotMessage = {
        id: `msg-copilot-${Date.now()}`,
        sender: "copilot",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      const errorMsg: CopilotMessage = {
        id: `msg-error-${Date.now()}`,
        sender: "copilot",
        text: "I couldn't process that request right now. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatText = (content: string) => {
    // Simple markdown formatting helper for headings and bullets
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-extrabold text-sm text-[#0f172a] mt-1 mb-1 tracking-tight">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("• ")) {
        return (
          <div key={idx} className="flex items-start space-x-1.5 my-0.5 text-xs">
            <span className="text-purple-600 font-bold">•</span>
            <span>{formatBoldText(line.replace("• ", ""))}</span>
          </div>
        );
      }
      return (
        <p key={idx} className="text-xs leading-relaxed my-0.5">
          {formatBoldText(line)}
        </p>
      );
    });
  };

  const formatBoldText = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-black text-[#0f172a]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden ${
        isExpanded
          ? "bottom-4 right-4 left-4 md:left-auto md:w-[760px] h-[85vh] max-h-[800px]"
          : "bottom-6 right-6 w-96 md:w-[420px] h-[580px] max-w-[calc(100vw-2rem)]"
      }`}
    >
      {/* HEADER (Dark Navy matching Reference Screenshots) */}
      <div className="bg-[#0f172a] text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/25 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black tracking-tight text-white">
                MedNxt Co-pilot
              </h3>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-300 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online & Grounded</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? "Collapse" : "Expand"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES BODY */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60 font-sans">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1 animate-fadeIn`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-xs shadow-2xs ${
                  isUser
                    ? "bg-[#6336d3] text-white rounded-tr-xs max-w-[85%] font-semibold"
                    : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs max-w-[92%] font-medium"
                }`}
              >
                {isUser ? msg.text : formatText(msg.text)}
              </div>
              <span className="text-[10px] font-bold text-slate-400 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isAnalyzing && (
          <div className="flex items-center space-x-2 p-3 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs max-w-[80%] text-xs font-bold text-slate-600 shadow-2xs animate-pulse">
            <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            <span>MedNxt Co-pilot is analyzing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="p-2.5 bg-slate-100/70 border-t border-slate-200/60 overflow-x-auto shrink-0">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleQuickAction("patient_summary", "Patient Summary")}
            className="px-3 py-1.5 bg-white hover:bg-purple-50 border border-purple-200/80 text-purple-700 font-extrabold text-[11px] rounded-xl shrink-0 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Patient Summary</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAction("low_stock", "Low Stock Alerts")}
            className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-rose-200/80 text-rose-700 font-extrabold text-[11px] rounded-xl shrink-0 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Low Stock Alerts</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAction("pending_labs", "Pending Labs")}
            className="px-3 py-1.5 bg-white hover:bg-amber-50 border border-amber-200/80 text-amber-700 font-extrabold text-[11px] rounded-xl shrink-0 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending Labs</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAction("bed_occupancy", "Bed Occupancy")}
            className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-extrabold text-[11px] rounded-xl shrink-0 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Bed className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bed Occupancy</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickAction("medical_news", "Medical News")}
            className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-blue-200/80 text-blue-700 font-extrabold text-[11px] rounded-xl shrink-0 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Newspaper className="w-3.5 h-3.5 text-blue-600" />
            <span>Medical News</span>
          </button>
        </div>
      </div>

      {/* INPUT FOOTER */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about patients, inventory, or medical protocols..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isAnalyzing}
          className="px-4 py-2.5 bg-[#6336d3] hover:bg-[#5228be] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-1.5 shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default CopilotPanel;
