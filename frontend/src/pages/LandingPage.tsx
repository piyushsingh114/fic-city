import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/Logo";
import {
  ArrowRight,
  Shield,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Search,
  PhoneCall,
  Lock,
  ChevronRight,
  Trash2,
  Hammer,
  Lightbulb,
  Waves,
  CloudRain,
  Dog,
  ShieldAlert,
  Trees,
  Bath,
  Skull,
  HelpCircle
} from "lucide-react";
import { Category } from "../types";
import { initialCategories } from "../data/mockData";

export const LandingPage: React.FC = () => {
  const { isCitizenAuthenticated, language } = useAuth();
  const navigate = useNavigate();
  const [trackId, setTrackId] = useState("");

  const handleReportClick = () => {
    if (isCitizenAuthenticated) {
      navigate("/user/dashboard");
    } else {
      navigate("/user/login?redirect=/user/dashboard");
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;
    navigate(`/user/dashboard?search=${encodeURIComponent(trackId.trim())}`);
  };

  const getCategoryIcon = (code: string) => {
    switch (code) {
      case "GARBAGE": return <Trash2 className="w-5 h-5 text-amber-500" />;
      case "POTHOLE": return <Hammer className="w-5 h-5 text-orange-500" />;
      case "STREETLIGHT": return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case "DRAINAGE": return <Waves className="w-5 h-5 text-blue-500" />;
      case "WATERLOG": return <CloudRain className="w-5 h-5 text-sky-500" />;
      case "ANIMALS": return <Dog className="w-5 h-5 text-emerald-500" />;
      case "ENCROACHMENT": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case "PARKS": return <Trees className="w-5 h-5 text-green-500" />;
      case "TOILETS": return <Bath className="w-5 h-5 text-indigo-500" />;
      case "DEAD_ANIMAL": return <Skull className="w-5 h-5 text-purple-500" />;
      default: return <HelpCircle className="w-5 h-5 text-teal-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-emerald-50/40 to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 py-16 sm:py-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-black uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>MCD 311 Grievance Redressal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Report. Track. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-sky-600">Resolve.</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Fic City connects citizens directly with Delhi Municipal officers. Report garbage, potholes, streetlights & waterlogging with high-accuracy live GPS and photo proof.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleReportClick}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>{language === "hi" ? "शिकायत दर्ज करें" : "Report a Civic Complaint"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/user/login"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200 font-extrabold text-sm shadow-xs transition-colors"
            >
              <span>Citizen Sign In</span>
            </Link>
          </div>

          {/* Search by Complaint ID bar */}
          <div className="pt-4 max-w-md mx-auto">
            <form onSubmit={handleTrackSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                placeholder="Track complaint by ID (e.g. FC-2026-000101)..."
                className="w-full text-xs pl-11 pr-24 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white font-bold text-xs"
              >
                Track
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Live Impact Counters */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="block text-3xl font-black text-emerald-600 dark:text-emerald-400">1,180+</span>
            <span className="text-xs text-slate-500 font-bold uppercase mt-1 block">Complaints Resolved</span>
          </div>
          <div>
            <span className="block text-3xl font-black text-sky-600 dark:text-sky-400">18.4 hrs</span>
            <span className="text-xs text-slate-500 font-bold uppercase mt-1 block">Avg SLA Resolution</span>
          </div>
          <div>
            <span className="block text-3xl font-black text-indigo-600 dark:text-indigo-400">250+</span>
            <span className="text-xs text-slate-500 font-bold uppercase mt-1 block">Delhi Wards Covered</span>
          </div>
          <div>
            <span className="block text-3xl font-black text-amber-500">4.6 ★</span>
            <span className="text-xs text-slate-500 font-bold uppercase mt-1 block">Citizen Satisfaction</span>
          </div>
        </div>
      </section>

      {/* 12 Civic Categories Grid */}
      <section className="py-16 px-4 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Comprehensive Civic Services
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            12 standardized civic problem categories with pre-determined municipal SLAs
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {initialCategories.map((c) => (
            <div
              key={c.id}
              onClick={handleReportClick}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md cursor-pointer transition-all text-center flex flex-col items-center justify-center group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950 flex items-center justify-center transition-colors">
                {getCategoryIcon(c.code)}
              </div>
              <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 mt-2.5 line-clamp-1">
                {language === "hi" ? c.name_hi : c.name_en}
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">SLA: {c.default_sla_hours}h</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works 3 Steps */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              How Fic City Works
            </h2>
            <p className="text-xs text-slate-500">Fast, transparent and accountable municipal governance in 3 steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-black flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Spot, Snap & Live GPS</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Take a photo and tap "Use Current Location". Our reverse geocoding locks exact coordinates and street address.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 font-black flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Auto-Assigned to Ward JE</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your ticket is automatically dispatched to the Junior Engineer of your ward with a strict resolution deadline (SLA).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 font-black flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Photo Proof & Citizen Rating</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The officer must upload an "After" resolution photo. You verify the work, rate 1-5 stars, or reopen if unsatisfied.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 dark:text-slate-400">
          <Logo size="sm" />
          <p>© 2026 Fic City. Municipal Corporation of Delhi Grievance Redressal System.</p>
          <div className="flex items-center gap-4">
            <Link to="/user/login" className="hover:text-emerald-600">Citizen Sign In</Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-indigo-400 font-bold">Officer / Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
