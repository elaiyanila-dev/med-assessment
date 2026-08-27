import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity, Lock, Mail, AlertCircle, Loader2, KeyRound } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("dr.rohan.sharma@mednxt.demo");
  const [password, setPassword] = useState("MedNxt@123");
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
      await login(email, password);
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

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("MedNxt@123");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        {/* Brand Icon */}
        <div className="w-14 h-14 bg-[#2b1055] rounded-2xl flex items-center justify-center text-purple-300 mx-auto shadow-lg border border-purple-800/50">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          MedNxt Hospitals
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Enterprise Hospital Management System Shell
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="doctor@mednxt.demo"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Development Demo Credentials Selector */}
          <div className="border-t border-slate-100 pt-5 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-purple-600" />
              <span>Development Seed Login Quick-Fill:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials("dr.rohan.sharma@mednxt.demo")}
                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg font-medium border border-purple-200 text-left truncate transition-colors"
              >
                Dr. Rohan (Doctor)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("priya.nair@mednxt.demo")}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200 text-left truncate transition-colors"
              >
                Priya Nair (Nurse)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("arun.kumar@mednxt.demo")}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200 text-left truncate transition-colors"
              >
                Arun (Pharmacist)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("anita.rao@mednxt.demo")}
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-medium border border-slate-200 text-left truncate transition-colors"
              >
                Anita (Lab Tech)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
