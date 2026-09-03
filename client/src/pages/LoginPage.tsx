import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  AlertCircle,
  Building2,
  ChevronRight,
  ClipboardList,
  Loader2,
  Lock,
  Stethoscope,
  User,
  Users
} from "lucide-react";

const roles = [
  {
    key: "doctor",
    label: "Doctor",
    description: "OPD & Clinical Notes",
    username: "doctor",
    icon: Stethoscope,
    color: "bg-blue-100 text-blue-700"
  },
  {
    key: "admin",
    label: "Hospital Admin",
    description: "Full System Access",
    username: "admin",
    icon: Building2,
    color: "bg-violet-100 text-violet-700"
  },
  {
    key: "receptionist",
    label: "Receptionist",
    description: "Registration & Billing",
    username: "receptionist",
    icon: ClipboardList,
    color: "bg-amber-100 text-amber-700"
  }
];

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [username, setUsername] = useState(roles[0].username);
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to /dashboard
  if (isAuthenticated) {
    const from = (location.state as any)?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await login(username, password);
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        "Invalid email or password";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role: typeof roles[number]) => {
    setSelectedRole(role);
    setUsername(role.username);
    setPassword("password");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0c1428] text-slate-900 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(78,45,170,0.55),transparent_30%),radial-gradient(circle_at_85%_90%,rgba(0,149,181,0.36),transparent_34%)]" />
      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl grid overflow-hidden bg-white rounded-2xl shadow-2xl md:grid-cols-[1fr_1fr]">
          <section className="bg-slate-50 px-6 py-8 sm:px-9 md:px-10">
            <h1 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
              Select a role to login
            </h1>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole.key === role.key;

                return (
                  <button
                    type="button"
                    key={role.key}
                    onClick={() => selectRole(role)}
                    className={`min-h-[124px] text-left rounded-xl border bg-white p-4 transition-all ${
                      isSelected
                        ? "border-violet-600 shadow-md ring-1 ring-violet-600"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${role.color}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-base font-extrabold text-slate-900">
                          {role.label}
                        </span>
                        <span className="mt-3 block text-xs font-medium text-slate-500">
                          {role.description}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="px-6 py-9 sm:px-9 md:px-10 lg:px-12 flex items-center">
            <div className="w-full max-w-lg mx-auto">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg">
                  <Activity className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-3xl font-extrabold text-slate-950">
                  MedNxt <span className="text-violet-600">AI</span>
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Secure Hospital Management System
                </p>
              </div>

              <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
                {errorMessage && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-3 text-sm text-rose-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3.5 pl-12 pr-4 text-sm font-medium text-slate-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase text-slate-500">
                      Password
                    </label>
                    <span className="text-xs font-bold text-violet-600">Forgot Password?</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 py-3.5 pl-12 pr-4 text-sm font-medium text-slate-950 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Secure Login</span>
                      <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                <Users className="h-3.5 w-3.5" />
                <span>Restricted Access - Authorized Personnel Only</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
