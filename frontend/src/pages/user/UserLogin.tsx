import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components/Logo";
import { Phone, Lock, ArrowRight, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { loginCitizenApi } from "../../services/api";

export const UserLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { loginCitizen, language } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/user/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) return setError("Please enter your mobile number or email");
    if (!password) return setError("Please enter your password");

    setLoading(true);
    try {
      const res = await loginCitizenApi({
        identifier: identifier.trim(),
        password
      });

      loginCitizen(res);
      navigate(redirectTarget);
    } catch (err: any) {
      setError(err.message || "Invalid mobile number or password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCitizen = () => {
    setIdentifier("9876543210");
    setPassword("password123");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block">
            <Logo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {language === "hi" ? "नागरिक लॉग इन" : "Citizen Sign In"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === "hi"
              ? "अपनी शिकायतों को ट्रैक करने के लिए अपने खाते में प्रवेश करें"
              : "Sign in to report and track municipal civic complaints"}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number or Email *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 9876543210 or citizen@example.com"
                className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Password *
              </label>
              <Link
                to="/user/forgot-password"
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>{language === "hi" ? "लॉग इन करें" : "Sign In"}</span>
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-[11px]">
              Demo Citizen Account:
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
              9876543210 • password123
            </span>
          </div>
          <button
            type="button"
            onClick={fillDemoCitizen}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
          >
            Auto Fill
          </button>
        </div>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
          <Link
            to={`/user/register?redirect=${encodeURIComponent(redirectTarget)}`}
            className="text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline"
          >
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
