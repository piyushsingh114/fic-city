import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components/Logo";
import { Shield, KeyRound, ArrowRight, AlertCircle, RefreshCw, Lock, UserCheck } from "lucide-react";
import { loginEmployeeApi } from "../../services/api";

export const AdminLogin: React.FC = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const { loginEmployee } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (failedAttempts >= 5) {
      setError("Account locked due to 5 consecutive failed attempts. Contact Municipal Commissioner.");
      return;
    }

    if (!employeeId.trim()) return setError("Please enter your Employee ID");
    if (!password) return setError("Please enter your password");

    setLoading(true);
    try {
      const res = await loginEmployeeApi({
        employee_id: employeeId.trim().toUpperCase(),
        password
      });

      loginEmployee(res);
      navigate("/admin/dashboard");
    } catch (err: any) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setError("Account locked after 5 failed attempts.");
      } else {
        setError(`Invalid Employee ID or password. (${5 - nextAttempts} attempts remaining)`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fillSuperAdminDemo = () => {
    setEmployeeId("MCD-ADMIN-001");
    setPassword("Admin@123");
  };

  const fillJeDemo = () => {
    setEmployeeId("MCD-SAN-1044");
    setPassword("Officer@123");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-900 text-white transition-colors">
      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-md rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">
            Municipal Employee Portal
          </h2>
          <p className="text-xs text-slate-400">
            Restricted Access: Super Admin, Department Heads, and Junior Engineers (JE)
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Employee ID / Officer ID *
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. MCD-ADMIN-001 or JE-SAN-1044"
                className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Employee Password *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter authorized password"
                className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || failedAttempts >= 5}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Sign In to Municipal Portal</span>
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="space-y-2 pt-2 border-t border-slate-700/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase block text-center">
            Default Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillSuperAdminDemo}
              className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-left text-xs transition-colors"
            >
              <span className="font-bold text-indigo-400 block text-[11px]">Super Admin</span>
              <span className="text-[10px] text-slate-300 font-mono">MCD-ADMIN-001</span>
            </button>
            <button
              type="button"
              onClick={fillJeDemo}
              className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-left text-xs transition-colors"
            >
              <span className="font-bold text-emerald-400 block text-[11px]">Junior Engineer</span>
              <span className="text-[10px] text-slate-300 font-mono">MCD-SAN-1044</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
