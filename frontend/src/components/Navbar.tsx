import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";
import {
  Sun,
  Moon,
  Globe2,
  PhoneCall,
  User,
  LogOut,
  ShieldAlert,
  LayoutDashboard,
  LogIn
} from "lucide-react";

export const Navbar: React.FC = () => {
  const {
    citizen,
    isCitizenAuthenticated,
    logoutCitizen,
    employee,
    isEmployeeAuthenticated,
    logoutEmployee,
    isDarkMode,
    toggleTheme,
    language,
    toggleLanguage
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        {/* Center Nav Links (only for citizen / public views) */}
        {!isAdminRoute && (
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Link
              to="/"
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${
                location.pathname === "/" ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : ""
              }`}
            >
              {language === "hi" ? "होम" : "Home"}
            </Link>
            <Link
              to="/user/dashboard"
              className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${
                location.pathname === "/user/dashboard" ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : ""
              }`}
            >
              {language === "hi" ? "नागरिक डैशबोर्ड" : "Citizen Dashboard"}
            </Link>
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light / Dark mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{language === "en" ? "हिन्दी" : "English"}</span>
          </button>

          {/* Citizen Auth Section */}
          {!isAdminRoute && (
            <>
              {isCitizenAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/user/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline max-w-[120px] truncate">{citizen?.full_name}</span>
                  </Link>

                  <button
                    onClick={() => {
                      logoutCitizen();
                      navigate("/");
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/user/login"
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition-colors"
                  >
                    {language === "hi" ? "लॉग इन" : "Sign In"}
                  </Link>
                  <Link
                    to="/user/register"
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all"
                  >
                    {language === "hi" ? "पंजीकरण" : "Register"}
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Admin Auth Status in Admin View */}
          {isAdminRoute && isEmployeeAuthenticated && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {employee?.role}
              </span>
              <button
                onClick={() => {
                  logoutEmployee();
                  navigate("/admin/login");
                }}
                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

          {/* Helpline pill */}
          <a
            href="tel:155304"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>155304</span>
          </a>
        </div>
      </div>
    </header>
  );
};
