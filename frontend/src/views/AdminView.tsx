import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Users,
  Building2,
  Download,
  Send,
  Plus,
  Bot,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  Check
} from "lucide-react";
import { AdminStats, Complaint, Ward, User } from "../types";
import {
  fetchAdminStats,
  fetchComplaints,
  fetchWards,
  fetchOfficers,
  assignOfficer,
  createAnnouncement,
  fetchFAQs,
  createComplaint
} from "../services/api";

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastWard, setBroadcastWard] = useState("");
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Reassignment state
  const [selectedComplaintId, setSelectedComplaintId] = useState("");
  const [targetOfficerId, setTargetOfficerId] = useState("");

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [st, comps, wds, offs, fq] = await Promise.all([
        fetchAdminStats(),
        fetchComplaints(),
        fetchWards(),
        fetchOfficers(),
        fetchFAQs()
      ]);
      setStats(st);
      setComplaints(comps);
      setWards(wds);
      setOfficers(offs);
      setFaqs(fq);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      await createAnnouncement({
        title: broadcastTitle,
        message: broadcastMessage,
        ward_id: broadcastWard || undefined
      });
      setBroadcastSent(true);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setTimeout(() => setBroadcastSent(false), 3000);
      alert("Broadcast notification dispatched to citizens in ward!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssign = async () => {
    if (!selectedComplaintId || !targetOfficerId) return;
    try {
      const updated = await assignOfficer(selectedComplaintId, targetOfficerId);
      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedComplaintId("");
      setTargetOfficerId("");
      alert(`Complaint reassigned to ${updated.officer_name}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    window.open("/api/admin/export-csv", "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              HQ EXECUTIVE DASHBOARD
            </span>
            <span className="text-xs text-slate-500 font-medium">Dr. Priya Malhotra, IAS</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Municipal Corporation Grievance Command Center
          </h1>
          <p className="text-xs text-slate-500">
            Real-time municipal performance, automated SLA escalation tracking & AI analytics
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export All Reports (CSV)</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Tickets</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +14% this week
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Resolved</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.resolved}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Proof verified</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">In Progress</span>
            <p className="text-2xl font-black text-sky-600 mt-1">{stats.inProgress}</p>
            <span className="text-[10px] text-slate-500 mt-1 block">Staff dispatched</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Overdue (SLA)</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{stats.overdue}</p>
            <span className="text-[10px] text-rose-600 font-bold mt-1 block">Auto-escalated</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">SLA Compliance</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{stats.slaCompliancePercentage}%</p>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Target: 95%</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Citizen Rating</span>
            <p className="text-2xl font-black text-amber-500 mt-1">{stats.citizenSatisfactionScore} ★</p>
            <span className="text-[10px] text-slate-500 mt-1 block">From verified reviews</span>
          </div>
        </div>
      )}

      {/* Analytics Charts & Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Complaints by Category</span>
            </h3>
            <span className="text-xs text-slate-400">All Wards</span>
          </div>

          {stats && (
            <div className="space-y-3 pt-2">
              {Object.entries(stats.categoryCounts).map(([catName, count]) => {
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{catName}</span>
                      <span className="text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ward Leaderboard */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Ward Volume Leaderboard</span>
            </h3>
            <span className="text-xs text-slate-400">Delhi Zonal</span>
          </div>

          {stats && (
            <div className="space-y-3 pt-2">
              {Object.entries(stats.wardCounts).map(([wardName, count]) => (
                <div key={wardName} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{wardName}</p>
                      <span className="text-[10px] text-slate-500">MCD Ward Jurisdiction</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-sky-800">
                    {count} Tickets
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Chatbot Analytics & FAQs */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span>Fic City AI Assistant Stats</span>
            </h3>
            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
              Automated
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100">
              <span className="block text-xl font-black text-purple-800">420+</span>
              <span className="text-[10px] font-bold text-purple-600 uppercase">Conversations</span>
            </div>
            <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <span className="block text-xl font-black text-emerald-800">89%</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Auto-Triaged</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2">Active FAQ Knowledge Base (RAG):</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {faqs.map((f, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <p className="font-bold text-slate-800">{f.question_en}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{f.answer_en}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Announcement Composer */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-md space-y-4">
        <div>
          <h3 className="text-sm font-extrabold flex items-center gap-2">
            <Send className="w-4 h-4 text-amber-400" />
            <span>Broadcast Emergency Notification to Citizens</span>
          </h3>
          <p className="text-xs text-slate-300">
            Send real-time alerts or announcements directly to citizen app inboxes and via SMS.
          </p>
        </div>

        <form onSubmit={handleSendBroadcast} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="Alert Title (e.g. Water Supply Maintenance)"
            required
            className="text-xs p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
          />

          <select
            value={broadcastWard}
            onChange={(e) => setBroadcastWard(e.target.value)}
            className="text-xs p-3 rounded-xl bg-slate-800 border border-white/20 text-white focus:outline-hidden"
          >
            <option value="">All Delhi Wards (City-wide)</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                Ward {w.ward_number} - {w.name_en}
              </option>
            ))}
          </select>

          <div className="sm:col-span-3 flex gap-2">
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Announcement description / helpline details..."
              required
              className="flex-1 text-xs p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Now</span>
            </button>
          </div>
        </form>
      </div>

      {/* Complaints Management Table & Reassignment */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Grievance Triage & Reassignment Table
            </h3>
            <p className="text-xs text-slate-500">
              Audit complaints, inspect SLA deadlines, and manually reassign between officers
            </p>
          </div>

          {/* Quick Reassign Controls */}
          <div className="flex items-center gap-2">
            <select
              value={selectedComplaintId}
              onChange={(e) => setSelectedComplaintId(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200"
            >
              <option value="">Select Complaint to Reassign</option>
              {complaints.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.complaint_number} - {c.category_name}
                </option>
              ))}
            </select>

            <select
              value={targetOfficerId}
              onChange={(e) => setTargetOfficerId(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200"
            >
              <option value="">Select Target Officer</option>
              {officers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name} ({o.designation})
                </option>
              ))}
            </select>

            <button
              onClick={handleAssign}
              disabled={!selectedComplaintId || !targetOfficerId}
              className="px-3 py-2 rounded-xl bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs"
            >
              Reassign
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-3 px-2">Ticket #</th>
                <th className="py-3 px-2">Issue Title</th>
                <th className="py-3 px-2">Ward</th>
                <th className="py-3 px-2">Priority</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Officer</th>
                <th className="py-3 px-2">SLA Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-2 font-mono font-bold text-emerald-700">
                    {c.complaint_number}
                  </td>
                  <td className="py-3 px-2 text-slate-900 max-w-[220px] truncate">
                    {c.title}
                  </td>
                  <td className="py-3 px-2 text-slate-600">{c.ward_name}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        c.priority === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "IN_PROGRESS"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-700">{c.officer_name}</td>
                  <td className="py-3 px-2 font-mono text-[11px] text-slate-500">
                    {new Date(c.sla_deadline).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
