import React, { useState, useEffect } from "react";
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  MapPin,
  PhoneCall,
  Send,
  Navigation,
  FileCheck,
  RefreshCw,
  X
} from "lucide-react";
import { Complaint } from "../types";
import { fetchComplaints, updateComplaintStatus } from "../services/api";

interface OfficerViewProps {
  language: "en" | "hi";
}

export const OfficerView: React.FC<OfficerViewProps> = ({ language }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [activeTask, setActiveTask] = useState<Complaint | null>(null);
  const [statusAction, setStatusAction] = useState<"IN_PROGRESS" | "RESOLVED" | "REJECTED">("RESOLVED");
  const [remarks, setRemarks] = useState("");
  const [afterPhotoUrl, setAfterPhotoUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("PENDING");

  const loadOfficerTasks = async () => {
    try {
      const data = await fetchComplaints();
      setComplaints(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOfficerTasks();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    if (statusAction === "RESOLVED" && !afterPhotoUrl) {
      alert("Mandatory: Please attach or provide After Resolution Photo proof before resolving.");
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await updateComplaintStatus(
        activeTask.id,
        statusAction,
        remarks || `Status marked as ${statusAction} by Junior Engineer`,
        "user-off-1",
        statusAction === "RESOLVED" ? afterPhotoUrl : undefined
      );

      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setActiveTask(null);
      setRemarks("");
      setAfterPhotoUrl("");
      alert(`Ticket #${updated.complaint_number} updated to ${statusAction}!`);
    } catch (err) {
      console.error(err);
      alert("Update failed. Try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const pendingTasks = complaints.filter(
    (c) => c.status === "ASSIGNED" || c.status === "IN_PROGRESS" || c.status === "REOPENED"
  );
  const resolvedTasks = complaints.filter((c) => c.status === "RESOLVED");

  const displayedList =
    filter === "PENDING" ? pendingTasks : filter === "RESOLVED" ? resolvedTasks : complaints;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Officer Profile Banner */}
      <div className="bg-gradient-to-r from-sky-800 to-indigo-900 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white">
            <UserCheck className="w-8 h-8 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black">Rajesh Verma, JE</h2>
              <span className="text-[10px] font-mono font-bold bg-sky-500/30 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/30">
                MCD-SAN-1044
              </span>
            </div>
            <p className="text-xs text-sky-200">Junior Engineer — Sanitation & Solid Waste</p>
            <p className="text-[11px] text-sky-300">Ward 64 (Karol Bagh) • Central Zone</p>
          </div>
        </div>

        {/* Quick Task KPI Counter */}
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-xs border border-white/10">
          <div className="text-center">
            <span className="block text-xl font-black text-amber-300">{pendingTasks.length}</span>
            <span className="text-[10px] text-sky-200 font-bold uppercase">Pending</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <span className="block text-xl font-black text-emerald-300">{resolvedTasks.length}</span>
            <span className="text-[10px] text-sky-200 font-bold uppercase">Resolved</span>
          </div>
        </div>
      </div>

      {/* Task Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {(["PENDING", "RESOLVED", "ALL"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === f
                  ? "bg-sky-700 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f === "PENDING"
                ? `Active Assigned (${pendingTasks.length})`
                : f === "RESOLVED"
                ? `Completed (${resolvedTasks.length})`
                : `All Tickets (${complaints.length})`}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">Sorted by SLA deadline urgency</span>
      </div>

      {/* Assigned Tasks Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedList.map((ticket) => {
          const isOverdue = new Date(ticket.sla_deadline) < new Date() && ticket.status !== "RESOLVED";
          return (
            <div
              key={ticket.id}
              className={`p-5 rounded-3xl bg-white border shadow-xs transition-all space-y-4 ${
                isOverdue ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-sky-800">
                      {ticket.complaint_number}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ticket.priority === "CRITICAL"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ticket.priority} Priority
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                    {ticket.title}
                  </h3>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                    ticket.status === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : ticket.status === "IN_PROGRESS"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>

              {/* Photo & Address */}
              <div className="flex items-start gap-3">
                {ticket.media[0] ? (
                  <img
                    src={ticket.media[0].url}
                    alt="Problem Site"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div className="text-xs space-y-1">
                  <p className="text-slate-600 line-clamp-2">{ticket.description}</p>
                  <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{ticket.address}</span>
                  </p>
                </div>
              </div>

              {/* SLA Deadline Tracker */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>SLA Deadline:</span>
                </div>
                <span className={`font-bold ${isOverdue ? "text-rose-600 animate-pulse" : "text-slate-800"}`}>
                  {isOverdue ? "BREACHED (OVERDUE)" : new Date(ticket.sla_deadline).toLocaleString()}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`https://maps.google.com/?q=${ticket.latitude},${ticket.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  Navigate
                </a>

                <button
                  onClick={() => {
                    setActiveTask(ticket);
                    setStatusAction(ticket.status === "SUBMITTED" ? "IN_PROGRESS" : "RESOLVED");
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Update Status / Proof
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action / Resolution Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs font-extrabold text-sky-700">
                  {activeTask.complaint_number}
                </span>
                <h3 className="font-black text-sm text-slate-900 mt-0.5">
                  Update Resolution Status
                </h3>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Action State:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["IN_PROGRESS", "RESOLVED", "REJECTED"] as const).map((action) => (
                    <button
                      type="button"
                      key={action}
                      onClick={() => setStatusAction(action)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        statusAction === action
                          ? action === "RESOLVED"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : action === "IN_PROGRESS"
                            ? "bg-sky-600 text-white border-sky-600"
                            : "bg-rose-600 text-white border-rose-600"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {statusAction === "RESOLVED" && (
                <div className="space-y-2 p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-900">
                    Mandatory "After Resolution" Photo Proof:
                  </label>
                  <p className="text-[11px] text-emerald-700">
                    Upload photo of the cleared dump or repaired road as proof of work.
                  </p>
                  <input
                    type="text"
                    value={afterPhotoUrl}
                    onChange={(e) => setAfterPhotoUrl(e.target.value)}
                    placeholder="Paste image URL or use sample resolution proof..."
                    className="w-full text-xs p-2.5 rounded-xl border border-emerald-300 bg-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setAfterPhotoUrl(
                        "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80"
                      )
                    }
                    className="text-[11px] font-bold text-emerald-800 underline block"
                  >
                    + Use Sample Clean Site Photo Proof
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official Remarks / Remarks to Citizen:
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Tipper truck DL-1M-4321 cleared 3 tons of garbage. Disinfectant sprayed."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Submit Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
