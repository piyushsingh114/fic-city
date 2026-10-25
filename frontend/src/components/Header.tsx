import React from "react";
import { Shield, Smartphone, Monitor, UserCheck, PhoneCall, Globe2 } from "lucide-react";
import { UserRole } from "../types";

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  language: "en" | "hi";
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  isMobileFrame,
  onToggleFrame,
  language,
  onToggleLanguage
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                FIC <span className="text-emerald-600">CITY</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                MCD 311
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {language === "hi" ? "दिल्ली नागरिक शिकायत निवारण प्रणाली" : "Delhi Municipal Grievance & Resolution"}
            </p>
          </div>
        </div>

        {/* Center: Role Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => onRoleChange("CITIZEN")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === "CITIZEN"
                ? "bg-white text-emerald-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === "hi" ? "नागरिक ऐप" : "Citizen"}</span>
          </button>

          <button
            onClick={() => onRoleChange("FIELD_OFFICER")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === "FIELD_OFFICER"
                ? "bg-white text-sky-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>{language === "hi" ? "अधिकारी पोर्टल" : "Field Officer"}</span>
          </button>

          <button
            onClick={() => onRoleChange("SUPER_ADMIN")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === "SUPER_ADMIN"
                ? "bg-white text-indigo-700 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-600" />
            <span>{language === "hi" ? "एडमिन डैशबोर्ड" : "Admin Web"}</span>
          </button>
        </div>

        {/* Right controls: Language, Mobile Frame, Helpline */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            title="Toggle English / हिन्दी"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === "en" ? "हिन्दी" : "English"}</span>
          </button>

          {/* Toggle Mobile Phone Mockup Frame for Citizen App */}
          {currentRole === "CITIZEN" && (
            <button
              onClick={onToggleFrame}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isMobileFrame
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="Toggle mobile device frame"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isMobileFrame ? "Frame ON" : "Fullscreen"}</span>
            </button>
          )}

          {/* Emergency helpline pill */}
          <a
            href="tel:155304"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>Helpline: 155304</span>
          </a>
        </div>
      </div>
    </header>
  );
};
