import React, { useState } from "react";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Database,
  Download,
  Globe2,
  Image,
  KeyRound,
  Link,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Save,
  Shield,
  Users
} from "lucide-react";
import { applyBrandTheme, getSavedBrandTheme } from "../services/theme";

const sections = [
  { label: "General & Branding", icon: Building2 },
  { label: "Departments", icon: Users },
  { label: "Integrations", icon: Link },
  { label: "System & Data", icon: Database },
  { label: "Security & Access", icon: Shield }
];

const themeColors = ["#4f46e5", "#2563eb", "#10b981", "#e11d48", "#7c3aed", "#475569"];
const initialDepartments = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Pediatrics",
  "ENT",
  "Gynecology",
  "Dermatology",
  "Emergency Medicine",
  "Neurology"
];

export const SystemSettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("General & Branding");
  const [activeColor, setActiveColor] = useState(getSavedBrandTheme);
  const [savedMessage, setSavedMessage] = useState("");
  const [departments, setDepartments] = useState(initialDepartments);
  const [newDepartment, setNewDepartment] = useState("");

  const handleAddDepartment = () => {
    const departmentName = newDepartment.trim();
    if (!departmentName) return;

    setDepartments((current) => [...current, departmentName]);
    setNewDepartment("");
  };

  const handleSaveConfiguration = () => {
    applyBrandTheme(activeColor);
    setSavedMessage("Configuration saved and applied.");
    window.setTimeout(() => setSavedMessage(""), 2400);
  };

  return (
    <div className="min-h-full bg-[#f8fafc] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] pb-16">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            System Settings
          </h1>
          <p className="mt-1 text-base font-medium text-slate-500">
            Manage hospital configuration, departments, and system preferences.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-200/70">
          <div className="grid min-h-[662px] grid-cols-1 lg:grid-cols-[285px_minmax(0,1fr)]">
            <aside className="flex flex-col border-b border-slate-200 bg-slate-50 lg:border-b-0 lg:border-r">
              <div className="p-5">
                <p className="px-2 text-xs font-black uppercase tracking-wider text-slate-400">
                  Configuration
                </p>
                <div className="mt-4 space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.label;

                    return (
                      <button
                        key={section.label}
                        type="button"
                        onClick={() => setActiveSection(section.label)}
                        className={`flex h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base font-bold transition-colors ${
                          isActive
                            ? "border border-brand-200 bg-brand-50 text-brand-700 shadow-sm"
                            : "text-slate-600 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <Icon className={`h-4.5 w-4.5 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                        <span>{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto border-t border-slate-200 px-5 py-4 text-center text-sm font-medium text-slate-400">
                <p>MedNxt HMS v2.4.0</p>
                <p>Enterprise Edition</p>
              </div>
            </aside>

            <main className="p-6 lg:p-8">
              {activeSection === "Departments" ? (
                <DepartmentsPanel
                  departments={departments}
                  newDepartment={newDepartment}
                  onDepartmentChange={setNewDepartment}
                  onAddDepartment={handleAddDepartment}
                />
              ) : activeSection === "Integrations" ? (
                <IntegrationsPanel />
              ) : activeSection === "System & Data" ? (
                <SystemDataPanel />
              ) : activeSection === "Security & Access" ? (
                <SecurityPoliciesPanel />
              ) : (
                <GeneralBrandingPanel activeColor={activeColor} onColorChange={setActiveColor} />
              )}
            </main>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
          {savedMessage && (
            <p className="text-sm font-bold text-brand-700" role="status">
              {savedMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleSaveConfiguration}
            className="inline-flex h-[52px] w-[270px] items-center justify-center gap-3 rounded-xl bg-brand-700 px-6 text-lg font-black text-white shadow-lg shadow-slate-900/15 transition-colors hover:bg-brand-800"
          >
            <Save className="h-5 w-5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const DepartmentsPanel: React.FC<{
  departments: string[];
  newDepartment: string;
  onDepartmentChange: (value: string) => void;
  onAddDepartment: () => void;
}> = ({ departments, newDepartment, onDepartmentChange, onAddDepartment }) => (
  <section>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-black text-slate-950">Departments Master</h2>
        <p className="mt-1 text-base font-medium text-slate-500">
          Manage clinical and administrative units.
        </p>
      </div>
      <span className="inline-flex h-8 items-center self-start rounded-full border border-brand-200 bg-brand-50 px-4 text-sm font-black text-brand-700">
        {departments.length} Active
      </span>
    </div>

    <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={newDepartment}
          onChange={(event) => onDepartmentChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAddDepartment();
          }}
          placeholder="Enter new department name..."
          className="h-12 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-5 text-base font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="button"
          onClick={onAddDepartment}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-500 px-7 text-base font-black text-white shadow-sm transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add</span>
        </button>
      </div>
    </div>

    <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {departments.map((department) => (
        <div
          key={department}
          className="flex h-[62px] items-center rounded-lg border border-slate-200 bg-white px-4 text-base font-black text-slate-800 shadow-sm"
        >
          {department}
        </div>
      ))}
    </div>
  </section>
);

const IntegrationsPanel: React.FC = () => (
  <section>
    <div>
      <h2 className="text-2xl font-black text-slate-950">External Integrations</h2>
      <p className="mt-1 text-base font-medium text-slate-500">
        Configure third-party services and APIs.
      </p>
    </div>

    <div className="mt-8 space-y-7">
      <IntegrationCard
        icon={CreditCard}
        iconClass="bg-blue-50 text-blue-600"
        title="Payment Gateway"
        description="Process online payments via Razorpay/Stripe."
        leftLabel="Provider"
        leftValue="Razorpay"
        rightLabel="API Key / ID"
        secret="••••••••••••••••••"
      />

      <IntegrationCard
        icon={MessageCircle}
        iconClass="bg-brand-50 text-brand-600"
        title="SMS Gateway"
        description="Send OTPs and alerts via Twilio/Msg91."
        leftLabel="Provider"
        leftValue="Twilio"
        rightLabel="API Key / Auth Token"
        secret="••••••••••"
      />

      <IntegrationCard
        icon={Shield}
        iconClass="bg-orange-50 text-orange-600"
        title="ABDM Integration (NDHM)"
        description="Ayushman Bharat Digital Mission compliance."
        leftLabel="Environment"
        leftValue="Sandbox (Test)"
        rightLabel="Client ID"
        secret="••••••••••••••"
      />
    </div>
  </section>
);

const IntegrationCard: React.FC<{
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  secret: string;
}> = ({
  icon: Icon,
  iconClass,
  title,
  description,
  leftLabel,
  leftValue,
  rightLabel,
  secret
}) => (
  <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/60">
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        aria-label={`${title} enabled`}
        className="relative mt-1 h-6 w-9 rounded-full border-2 border-brand-600 bg-white"
      >
        <span className="absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-brand-600" />
      </button>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label={leftLabel}>
        <select className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-slate-800 shadow-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100">
          <option>{leftValue}</option>
        </select>
      </Field>

      <Field label={rightLabel}>
        <div className="relative">
          <KeyRound className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            defaultValue={secret}
            className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pl-11 text-base font-bold tracking-widest text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </div>
      </Field>
    </div>
  </article>
);

const SystemDataPanel: React.FC = () => (
  <section>
    <div>
      <h2 className="text-2xl font-black text-slate-950">Notifications</h2>
      <p className="mt-1 text-base font-medium text-slate-500">
        Configure system alerts and communications.
      </p>
    </div>

    <div className="mt-6 border-t border-slate-200 pt-5">
      <div className="space-y-5">
        <NotificationRow
          icon={Mail}
          iconClass="bg-blue-50 text-blue-600"
          title="Email Notifications"
          description="Receive daily reports and critical alerts via email."
        />
        <NotificationRow
          icon={Phone}
          iconClass="bg-brand-50 text-brand-600"
          title="SMS Alerts"
          description="Send OTPs and patient appointment reminders."
        />
        <NotificationRow
          icon={MessageCircle}
          iconClass="bg-brand-50 text-brand-600"
          title="WhatsApp Notifications"
          description="Send reports, billing details, and appointment updates via WhatsApp."
        />
      </div>
    </div>

    <div className="mt-9">
      <h2 className="text-2xl font-black text-slate-950">Data Management</h2>
      <p className="mt-1 text-base font-medium text-slate-500">
        Backup, Restore and Maintenance.
      </p>
    </div>

    <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-200 pt-5 xl:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-slate-700" />
          <h3 className="text-lg font-black text-slate-950">Database Backup</h3>
        </div>
        <p className="mt-3 text-base font-medium text-slate-500">Last backup: 2 hours ago</p>
        <button
          type="button"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-black text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Download className="h-4 w-4" />
          <span>Download SQL Dump</span>
        </button>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-black text-slate-950">Maintenance Mode</h3>
        </div>
        <p className="mt-3 text-base font-medium text-slate-500">Prevent non-admin logins.</p>
        <label className="mt-5 flex items-center gap-3 text-sm font-black text-orange-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>Enable Maintenance Mode</span>
        </label>
      </div>
    </div>
  </section>
);

const SecurityPoliciesPanel: React.FC = () => (
  <section>
    <div>
      <h2 className="text-2xl font-black text-slate-950">Security Policies</h2>
      <p className="mt-1 text-base font-medium text-slate-500">
        Access control and session management.
      </p>
    </div>

    <div className="mt-6 border-t border-slate-200 pt-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <Field label="Session Timeout (Minutes)">
          <div className="flex items-center gap-5">
            <input
              type="range"
              min="5"
              max="120"
              defaultValue="60"
              className="h-2 min-w-0 flex-1 accent-blue-500"
            />
            <span className="inline-flex h-9 w-20 shrink-0 items-center justify-center rounded-md bg-slate-100 text-base font-black text-slate-950">
              30 min
            </span>
          </div>
        </Field>

        <div className="mt-9 border-t border-slate-100 pt-5">
          <p className="text-sm font-black uppercase tracking-wide text-brand-700">
            Password Policy
          </p>
          <div className="mt-3 space-y-2.5">
            <SecurityCheckbox label="Require Special Character" defaultChecked />
            <SecurityCheckbox label="Require Number" defaultChecked />
            <SecurityCheckbox label="Force Password Rotation (90 Days)" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SecurityCheckbox: React.FC<{ label: string; defaultChecked?: boolean }> = ({
  label,
  defaultChecked = false
}) => (
  <label className="flex items-center gap-3 text-base font-bold text-slate-700">
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
    />
    <span>{label}</span>
  </label>
);

const NotificationRow: React.FC<{
  icon: React.ElementType;
  iconClass: string;
  title: string;
  description: string;
}> = ({ icon: Icon, iconClass, title, description }) => (
  <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex min-w-0 items-center gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
      </div>
    </div>

    <button
      type="button"
      aria-label={`${title} disabled`}
      className="relative h-7 w-12 shrink-0 rounded-full bg-slate-200 transition-colors"
    >
      <span className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm" />
    </button>
  </div>
);

const GeneralBrandingPanel: React.FC<{
  activeColor: string;
  onColorChange: (color: string) => void;
}> = ({ activeColor, onColorChange }) => (
  <div className="grid grid-cols-1 gap-9 xl:grid-cols-2">
    <section>
      <SectionTitle icon={Building2} title="Organization Details" />

      <div className="mt-7 space-y-5">
        <Field label="Hospital Name">
          <TextInput value="MedNxt Hospitals" />
        </Field>

        <Field label="Website">
          <TextInput value="www.mednxt.in" icon={Globe2} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact">
            <TextInput value="+91 98765 43210" icon={Phone} />
          </Field>
          <Field label="Email">
            <TextInput value="admin@mednxt.in" icon={Mail} />
          </Field>
        </div>

        <Field label="Address">
          <textarea
            className="min-h-[100px] w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            defaultValue="123, Health Tech Park, Bangalore, KA"
          />
        </Field>
      </div>
    </section>

    <div className="space-y-9">
      <section>
        <SectionTitle icon={Palette} title="Branding" />

        <div className="mt-7 flex flex-col gap-6 sm:flex-row">
          <button
            type="button"
            className="flex h-[126px] w-[126px] shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50 text-brand-700 shadow-sm"
          >
            <Image className="h-9 w-9" />
            <span className="mt-3 text-[11px] font-black uppercase">Upload Logo</span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black uppercase text-brand-700">
              Theme Color
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {themeColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select ${color} theme`}
                  onClick={() => onColorChange(color)}
                  className={`h-11 w-11 rounded-full border-2 transition ${
                    activeColor === color ? "border-white ring-2 ring-brand-500 ring-offset-2" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="mt-4 max-w-[340px] text-base font-medium leading-6 text-slate-500">
              Select a primary color theme for the application. This will affect buttons, active states, and focus rings.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionTitle icon={Globe2} title="Regional Settings" />

        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Currency">
            <select className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-slate-800 shadow-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100">
              <option>INR (₹)</option>
            </select>
          </Field>

          <Field label="Timezone">
            <select className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-slate-800 shadow-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100">
              <option>Asia/Kolkata (IST)</option>
            </select>
          </Field>

          <div className="sm:col-span-2">
            <Field label="Date Format">
              <TextInput value="DD/MM/YYYY (31/12/2023)" icon={CalendarDays} />
            </Field>
          </div>
        </div>
      </section>
    </div>
  </div>
);

const SectionTitle: React.FC<{ icon: React.ElementType; title: string }> = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
    <Icon className="h-4.5 w-4.5 text-slate-400" />
    <h2 className="text-lg font-black uppercase tracking-wide text-slate-950">{title}</h2>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-black uppercase tracking-wide text-brand-700">
      {label}
    </span>
    {children}
  </label>
);

const TextInput: React.FC<{ value: string; icon?: React.ElementType }> = ({ value, icon: Icon }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />}
    <input
      defaultValue={value}
      className={`h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 ${Icon ? "pl-11" : ""}`}
    />
  </div>
);

export default SystemSettingsPage;
