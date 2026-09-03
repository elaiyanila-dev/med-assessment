import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DollarSign,
  FileText,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2
} from "lucide-react";

type BillingTab = "bill" | "claims";
type PaymentMode = "cash" | "tpa";

interface BillItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  gst: number;
}

interface BillingDraft {
  items: BillItem[];
  discount: number;
  paymentMode: PaymentMode;
  tpaDetails: {
    provider: string;
    policyNumber: string;
    preAuthCode: string;
  };
}

const serviceCatalog: BillItem[] = [
  { id: "srv-opd", name: "OPD Consultation", price: 500, qty: 1, gst: 0 },
  { id: "srv-general-consultation", name: "General Consultation", price: 500, qty: 1, gst: 0 },
  { id: "srv-specialist-consultation", name: "Specialist Consultation", price: 1000, qty: 1, gst: 0 },
  { id: "srv-video-consultation", name: "Video Consultation", price: 800, qty: 1, gst: 0 },
  { id: "srv-cbc-profile", name: "CBC Profile", price: 380, qty: 1, gst: 5 },
  { id: "srv-cbc-hemogram", name: "CBC (Hemogram)", price: 450, qty: 1, gst: 5 },
  { id: "srv-chest-xray", name: "Chest X-Ray", price: 900, qty: 1, gst: 12 },
  { id: "srv-xray-chest-pa", name: "X-Ray Chest PA", price: 800, qty: 1, gst: 12 },
  { id: "srv-mri-brain-contrast", name: "MRI Brain Contrast", price: 8500, qty: 1, gst: 12 },
  { id: "srv-ipd-room-deluxe", name: "IPD Room Charge (Deluxe)", price: 4500, qty: 1, gst: 0 },
  { id: "srv-nursing-day", name: "Nursing Charges (Day)", price: 800, qty: 1, gst: 0 },
  { id: "srv-surgical-consumables", name: "Surgical Consumables Kit", price: 2500, qty: 1, gst: 5 },
  { id: "srv-sanitizer-kit", name: "Sanitizer & Hygiene Kit", price: 500, qty: 1, gst: 5 },
  { id: "srv-ambulance", name: "Ambulance Service", price: 1500, qty: 1, gst: 0 },
  { id: "srv-nebulization", name: "Nebulization", price: 200, qty: 1, gst: 0 }
];

const claims = [
  { id: "CLM-2023-001", patient: "Rahul Verma", payer: "Star Health", diagnosis: "Acute Bronchitis", amount: 45000, date: "2023-10-15", status: "Approved" },
  { id: "CLM-2023-002", patient: "Priya Sharma", payer: "HDFC Ergo", diagnosis: "Appendicitis", amount: 12500, date: "2023-10-18", status: "Processing" },
  { id: "CLM-2023-003", patient: "Amit Patel", payer: "MediAssist TPA", diagnosis: "Viral Fever", amount: 8500, date: "2023-10-19", status: "Query" },
  { id: "CLM-2023-004", patient: "Nisha Rao", payer: "Care Health", diagnosis: "Migraine", amount: 5000, date: "2023-10-20", status: "Rejected" }
];

const tpaProviders = ["Star Health", "HDFC Ergo", "MediAssist TPA", "Care Health"];
const billingDraftStorageKey = "mednxt:billing-draft";

const defaultTpaDetails = {
  provider: tpaProviders[0],
  policyNumber: "",
  preAuthCode: ""
};

const getSavedBillingDraft = (): BillingDraft => {
  const fallback: BillingDraft = {
    items: [],
    discount: 0,
    paymentMode: "cash",
    tpaDetails: defaultTpaDetails
  };

  try {
    const savedDraft = window.localStorage.getItem(billingDraftStorageKey);
    if (!savedDraft) {
      return fallback;
    }

    const draft = JSON.parse(savedDraft) as Partial<BillingDraft>;
    return {
      items: Array.isArray(draft.items) ? draft.items : fallback.items,
      discount: typeof draft.discount === "number" ? draft.discount : fallback.discount,
      paymentMode: draft.paymentMode === "tpa" ? "tpa" : "cash",
      tpaDetails: {
        provider:
          typeof draft.tpaDetails?.provider === "string" && tpaProviders.includes(draft.tpaDetails.provider)
            ? draft.tpaDetails.provider
            : fallback.tpaDetails.provider,
        policyNumber:
          typeof draft.tpaDetails?.policyNumber === "string" ? draft.tpaDetails.policyNumber : "",
        preAuthCode: typeof draft.tpaDetails?.preAuthCode === "string" ? draft.tpaDetails.preAuthCode : ""
      }
    };
  } catch {
    return fallback;
  }
};

export const BillingClaimsPage: React.FC = () => {
  const savedDraft = useMemo(() => getSavedBillingDraft(), []);
  const [activeTab, setActiveTab] = useState<BillingTab>("bill");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(savedDraft.paymentMode);
  const [items, setItems] = useState<BillItem[]>(savedDraft.items);
  const [discount, setDiscount] = useState(savedDraft.discount);
  const [isServiceMenuOpen, setIsServiceMenuOpen] = useState(false);
  const [tpaDetails, setTpaDetails] = useState(savedDraft.tpaDetails);
  const serviceMenuRef = useRef<HTMLDivElement>(null);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [items]);

  const gstTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.qty * (item.gst / 100), 0);
  }, [items]);

  const payable = Math.max(0, subtotal + gstTotal - discount);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!serviceMenuRef.current?.contains(event.target as Node)) {
        setIsServiceMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const draft: BillingDraft = {
      items,
      discount,
      paymentMode,
      tpaDetails
    };

    window.localStorage.setItem(billingDraftStorageKey, JSON.stringify(draft));
  }, [discount, items, paymentMode, tpaDetails]);

  const addService = (service: BillItem) => {
    setItems((prev) => [...prev, { ...service, id: `${service.id}-${Date.now()}` }]);
    setIsServiceMenuOpen(false);
  };

  const removeService = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc]">
      <div className="w-full px-4 py-6 pb-12 sm:px-6 lg:px-7">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center gap-6 border-b border-slate-200 px-6 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("bill")}
              className={`flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-extrabold transition-colors ${
                activeTab === "bill"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>New Bill</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("claims")}
              className={`flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-extrabold transition-colors ${
                activeTab === "claims"
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Claims Automation</span>
            </button>
          </div>

          {activeTab === "bill" ? (
            <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px]">
              <section className="space-y-7 p-6">
                <div className="space-y-3">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Patient Details
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_178px]">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-700 shadow-2xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        placeholder="Search by Name, Mobile or UHID"
                      />
                    </div>
                    <select className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-800 shadow-2xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20">
                      <option>OPD Bill</option>
                      <option>IPD Bill</option>
                      <option>Pharmacy Bill</option>
                      <option>Lab Bill</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Billable Services
                    </h2>
                    <div ref={serviceMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsServiceMenuOpen((isOpen) => !isOpen)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-extrabold text-white shadow-xs transition-colors hover:bg-purple-700"
                        aria-expanded={isServiceMenuOpen}
                        aria-haspopup="listbox"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Service</span>
                      </button>

                      {isServiceMenuOpen ? (
                        <div
                          className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                          role="listbox"
                          aria-label="Select service"
                        >
                          <div className="bg-slate-50 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                            Select Service
                          </div>
                          <div className="max-h-72 overflow-y-auto py-1">
                            {serviceCatalog.map((service) => (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => addService(service)}
                                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-extrabold text-[#0f172a] transition-colors hover:bg-purple-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700 focus:outline-none"
                                role="option"
                              >
                                <span>{service.name}</span>
                                <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-black text-slate-600">
                                  Rs. {service.price}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                    <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <div className="col-span-5">Service / Item</div>
                      <div className="col-span-2">Price</div>
                      <div className="col-span-1">Qty</div>
                      <div className="col-span-1">GST</div>
                      <div className="col-span-2">Total</div>
                      <div className="col-span-1 text-right">Action</div>
                    </div>

                    {items.length === 0 ? (
                      <div className="flex min-h-[176px] flex-col items-center justify-center gap-3 text-center text-sm font-semibold text-slate-400">
                        <FileText className="h-9 w-9 text-slate-200" />
                        <span>No items added. Select services to generate bill.</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {items.map((item) => {
                          const lineTotal = item.price * item.qty * (1 + item.gst / 100);
                          return (
                            <div key={item.id} className="grid grid-cols-12 items-center gap-4 px-5 py-4 text-sm">
                              <div className="col-span-5 font-extrabold text-[#0f172a]">{item.name}</div>
                              <div className="col-span-2 font-mono font-bold">Rs. {item.price.toFixed(2)}</div>
                              <div className="col-span-1 font-mono font-bold">{item.qty}</div>
                              <div className="col-span-1 font-mono font-bold">{item.gst}%</div>
                              <div className="col-span-2 font-mono font-black text-purple-700">Rs. {lineTotal.toFixed(2)}</div>
                              <div className="col-span-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeService(item.id)}
                                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                  aria-label="Remove service"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <label className="flex items-center gap-4 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Discount (Rs.)
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className="h-11 w-36 rounded-xl border border-slate-200 px-4 text-right font-mono text-sm font-black text-[#0f172a] shadow-2xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </label>
                </div>
              </section>

              <aside className="flex flex-col border-l border-slate-200 bg-slate-50/70 p-6">
                <h2 className="mb-5 text-base font-black uppercase tracking-wide text-[#0f172a]">
                  Payment Summary
                </h2>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <SummaryRow label="Subtotal" value={subtotal} />
                  <SummaryRow label="GST Total" value={gstTotal} />
                  <SummaryRow label="Discount" value={-discount} tone="success" />
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-sm font-black text-[#0f172a]">Total Payable</span>
                    <span className="font-mono text-2xl font-black text-purple-700">
                      Rs. {payable.toFixed(2)}
                    </span>
                  </div>
                </div>

                <h3 className="mb-3 mt-7 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Payment Mode
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <PaymentButton
                    active={paymentMode === "cash"}
                    onClick={() => setPaymentMode("cash")}
                    label="Cash"
                    icon={<DollarSign className="h-5 w-5" />}
                  />
                  <PaymentButton
                    active={paymentMode === "tpa"}
                    onClick={() => setPaymentMode("tpa")}
                    label="TPA"
                    icon={<ShieldCheck className="h-5 w-5" />}
                  />
                </div>

                {paymentMode === "tpa" ? (
                  <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
                    <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-amber-800">
                      <ShieldCheck className="h-4 w-4" />
                      <span>TPA / Insurance Details</span>
                    </div>
                    <div className="space-y-3">
                      <select
                        value={tpaDetails.provider}
                        onChange={(event) =>
                          setTpaDetails((details) => ({ ...details, provider: event.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-amber-300 bg-white px-4 text-sm font-extrabold text-[#0f172a] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        aria-label="TPA provider"
                      >
                        {tpaProviders.map((provider) => (
                          <option key={provider}>{provider}</option>
                        ))}
                      </select>
                      <input
                        value={tpaDetails.policyNumber}
                        onChange={(event) =>
                          setTpaDetails((details) => ({ ...details, policyNumber: event.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-amber-200 bg-white px-4 text-sm font-semibold text-[#0f172a] outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        placeholder="Policy Number"
                      />
                      <input
                        value={tpaDetails.preAuthCode}
                        onChange={(event) =>
                          setTpaDetails((details) => ({ ...details, preAuthCode: event.target.value }))
                        }
                        className="h-11 w-full rounded-xl border border-amber-200 bg-white px-4 text-sm font-semibold text-[#0f172a] outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                        placeholder="Pre-Auth Code"
                      />
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={items.length === 0}
                  className="mt-auto inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-extrabold text-white shadow-xs transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  <Printer className="h-5 w-5" />
                  <span>Generate Invoice</span>
                </button>
              </aside>
            </div>
          ) : (
            <ClaimsPanel />
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: number; tone?: "success" }> = ({ label, value, tone }) => (
  <div className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-700">
    <span className={tone === "success" ? "font-extrabold text-emerald-700" : ""}>{label}</span>
    <span className={`font-mono font-black ${tone === "success" ? "text-emerald-700" : "text-[#0f172a]"}`}>
      {value < 0 ? "- " : ""}Rs. {Math.abs(value).toFixed(2)}
    </span>
  </div>
);

const PaymentButton: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode }> = ({
  active,
  onClick,
  label,
  icon
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex h-[74px] flex-col items-center justify-center gap-1 rounded-xl border text-xs font-black uppercase transition-colors ${
      active
        ? "border-purple-600 bg-purple-600 text-white shadow-xs"
        : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const getClaimStatusClass = (status: string) => {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-100 text-emerald-700";
    case "Processing":
      return "border-blue-200 bg-blue-100 text-blue-700";
    case "Query":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
};

const ClaimsPanel: React.FC = () => (
  <div className="min-h-[620px] space-y-5 p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xl font-black tracking-tight text-[#0f172a]">
        Claims & Adjudication
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
        >
          Filter by Status
        </button>
        <button
          type="button"
          className="h-11 rounded-xl bg-purple-600 px-4 text-sm font-extrabold text-white shadow-xs transition-colors hover:bg-purple-700"
        >
          New Claim
        </button>
      </div>
    </div>

    <div className="space-y-4">
      {claims.map((claim) => (
        <div
          key={claim.id}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-colors hover:border-purple-200"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wide text-slate-400">
                  {claim.id}
                </span>
                <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase ${getClaimStatusClass(claim.status)}`}>
                  {claim.status}
                </span>
              </div>
              <h3 className="mt-3 text-base font-black text-[#0f172a]">
                {claim.patient}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {claim.payer} • {claim.diagnosis}
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <div className="font-mono text-xl font-black text-[#0f172a]">
                Rs. {claim.amount.toLocaleString("en-IN")}
              </div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-400">
                {claim.date}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3.5 py-2 text-xs font-black text-purple-700 transition-colors hover:bg-purple-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Analyze with AI</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default BillingClaimsPage;
