import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Complaint, Employee, ActivityLog, AdminStats, Ward } from "../../types";
import {
  fetchComplaints,
  fetchEmployeesApi,
  createEmployeeApi,
  fetchActivityLogsApi,
  fetchAdminStats,
  fetchWards,
  updateComplaintStatus,
  assignOfficer,
  createAnnouncement
} from "../../services/api";
import {
  Shield,
  Users,
  BarChart3,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  Filter,
  Plus,
  Lock,
  MapPin,
  Send,
  LogOut,
  Navigation,
  FileCheck,
  RefreshCw,
  Building,
  UserCheck
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { employee, employeeToken, logoutEmployee } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!employeeToken) {
      navigate("/admin/login");
    }
  }, [employeeToken, navigate]);

  const [activeTab, setActiveTab] = useState<"triage" | "employees" | "analytics" | "logs" | "broadcast">("triage");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Resolution modal
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<"IN_PROGRESS" | "RESOLVED" | "REJECTED">("RESOLVED");
  const [remarks, setRemarks] = useState("");
  const [afterPhotoUrl, setAfterPhotoUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // New Employee state (Super Admin only)
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpId, setNewEmpId] = useState("");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpPhone, setNewEmpPhone] = useState("");
  const [newEmpRole, setNewEmpRole] = useState<"DEPT_HEAD" | "JE" | "FIELD_STAFF">("JE");
  const [newEmpDesignation, setNewEmpDesignation] = useState("Junior Engineer");
  const [newEmpPassword, setNewEmpPassword] = useState("Officer@123");

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastWard, setBroadcastWard] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [comps, emps, lg, st, wds] = await Promise.all([
        fetchComplaints(),
        fetchEmployeesApi(),
        fetchActivityLogsApi(),
        fetchAdminStats(),
        fetchWards()
      ]);
      setComplaints(comps);
      setEmployees(emps);
      setLogs(lg);
      setStats(st);
      setWards(wds);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Role-Based Filtering (RBAC)
  const roleFilteredComplaints = complaints.filter((c) => {
    if (employee?.role === "SUPER_ADMIN") return true;
    if (employee?.role === "DEPT_HEAD") {
      return c.department_id === employee.department_id;
    }
    if (employee?.role === "JE" || employee?.role === "FIELD_STAFF") {
      return (
        c.assigned_employee_id === employee.id ||
        c.ward_id === employee.ward_id ||
        c.officer_name?.includes(employee.full_name)
      );
    }
    return true;
  });

  const displayedComplaints = roleFilteredComplaints.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.complaint_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    if (newStatus === "RESOLVED" && !afterPhotoUrl) {
      alert("Mandatory: Please attach or provide After Resolution Photo proof before resolving.");
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await updateComplaintStatus(
        selectedTicket.id,
        newStatus,
        remarks || `Status transitioned to ${newStatus} by ${employee?.full_name}`,
        employee?.id,
        newStatus === "RESOLVED" ? afterPhotoUrl : undefined
      );

      setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setSelectedTicket(null);
      setRemarks("");
      setAfterPhotoUrl("");
      alert(`Ticket #${updated.complaint_number} updated to ${newStatus}!`);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Update failed. Try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEmp = await createEmployeeApi({
        employee_id: newEmpId.toUpperCase(),
        full_name: newEmpName,
        email: newEmpEmail,
        phone_number: newEmpPhone,
        role: newEmpRole,
        designation: newEmpDesignation,
        password: newEmpPassword
      });

      setEmployees((prev) => [newEmp, ...prev]);
      setShowAddEmpModal(false);
      setNewEmpId("");
      setNewEmpName("");
      setNewEmpEmail("");
      setNewEmpPhone("");
      alert(`Employee ${newEmp.full_name} (${newEmp.employee_id}) created!`);
    } catch (err: any) {
      alert(err.message || "Failed to create employee.");
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      await createAnnouncement({
        title: broadcastTitle,
        message: broadcastMessage,
        ward_id: broadcastWard || undefined
      });
      setBroadcastTitle("");
      setBroadcastMessage("");
      alert("Broadcast alert dispatched to citizen devices!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm tracking-tight text-white leading-tight">
                MUNICIPAL HQ
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">RBAC Panel</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Authenticated:</span>
              <span className="font-mono text-[10px] font-bold text-indigo-400">{employee?.employee_id}</span>
            </div>
            <p className="font-extrabold text-white text-xs truncate">{employee?.full_name}</p>
            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
              {employee?.role}
            </span>
          </div>

          <nav className="space-y-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab("triage")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === "triage" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Complaints Triage</span>
            </button>

            {employee?.role === "SUPER_ADMIN" && (
              <button
                onClick={() => setActiveTab("employees")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === "employees" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Employee Accounts</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === "analytics" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>KPIs & Hotspots</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === "logs" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Activity Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab("broadcast")}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
                activeTab === "broadcast" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Emergency Broadcast</span>
            </button>
          </nav>
        </div>

        <button
          onClick={() => {
            logoutEmployee();
            navigate("/admin/login");
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 text-xs font-bold transition-colors mt-6"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
        {/* Top KPI Header */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Assigned Scope</span>
              <p className="text-2xl font-black text-white mt-1">{roleFilteredComplaints.length}</p>
              <span className="text-[10px] text-slate-400">Total within RBAC view</span>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Resolved</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{stats.resolved}</p>
              <span className="text-[10px] text-emerald-400">Verified photo proof</span>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase">SLA Overdue</span>
              <p className="text-2xl font-black text-rose-400 mt-1">{stats.overdue}</p>
              <span className="text-[10px] text-rose-400">Auto-escalated</span>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase">SLA Compliance</span>
              <p className="text-2xl font-black text-indigo-400 mt-1">{stats.slaCompliancePercentage}%</p>
              <span className="text-[10px] text-indigo-400">Target 95%</span>
            </div>
          </div>
        )}

        {/* TAB 1: COMPLAINTS TRIAGE */}
        {activeTab === "triage" && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">Grievance Triage Queue</h3>
                <p className="text-xs text-slate-400">
                  Manage assigned complaints with GPS coordinates and mandatory verification proof
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open("/api/admin/export-csv", "_blank")}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV Export</span>
                </button>
              </div>
            </div>

            {/* Filter pills & search */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {(["ALL", "SUBMITTED", "IN_PROGRESS", "RESOLVED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticket, address..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-2">Ticket #</th>
                    <th className="py-3 px-2">Issue & Location</th>
                    <th className="py-3 px-2">Priority</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">SLA Target</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {displayedComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-750 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-indigo-400">
                        {c.complaint_number}
                      </td>
                      <td className="py-3 px-2 max-w-[240px]">
                        <p className="font-bold text-white truncate">{c.title}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{c.address}</span>
                        </p>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          c.priority === "CRITICAL" ? "bg-rose-950 text-rose-300 border border-rose-800" : "bg-slate-700 text-slate-300"
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === "RESOLVED" ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-300"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-slate-400">
                        {new Date(c.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(c.sla_deadline).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => {
                            setSelectedTicket(c);
                            setNewStatus(c.status === "SUBMITTED" ? "IN_PROGRESS" : "RESOLVED");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                        >
                          Update / Proof
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: EMPLOYEE ACCOUNTS (Super Admin Only) */}
        {activeTab === "employees" && employee?.role === "SUPER_ADMIN" && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Employee & Officer Management</h3>
                <p className="text-xs text-slate-400">Super Admin control: Provision officer accounts and reset credentials</p>
              </div>
              <button
                onClick={() => setShowAddEmpModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Employee</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-2">Emp ID</th>
                    <th className="py-3 px-2">Name & Designation</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Contact</th>
                    <th className="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {employees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="py-3 px-2 font-mono font-bold text-indigo-400">{emp.employee_id}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-white">{emp.full_name}</p>
                        <p className="text-[11px] text-slate-400">{emp.designation}</p>
                      </td>
                      <td className="py-3 px-2 font-bold">{emp.role}</td>
                      <td className="py-3 px-2 font-mono text-slate-400">{emp.phone_number}</td>
                      <td className="py-3 px-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVITY AUDIT LOGS */}
        {activeTab === "logs" && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 space-y-4">
            <div>
              <h3 className="text-base font-black text-white">Security & Audit Activity Logs</h3>
              <p className="text-xs text-slate-400">Immutable trail of every ticket status update and assignment</p>
            </div>

            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded-2xl bg-slate-900 border border-slate-700/70 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-400">{log.action}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300 font-bold">{log.employee_name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BROADCAST */}
        {activeTab === "broadcast" && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 space-y-4">
            <div>
              <h3 className="text-base font-black text-white">Broadcast Emergency Notification</h3>
              <p className="text-xs text-slate-400">Send push alert directly to citizens in any Delhi Ward</p>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3 max-w-lg">
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Alert Title (e.g. Water Logging Alert)"
                className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
              />
              <textarea
                rows={3}
                required
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Alert message description..."
                className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Now</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Resolution & Photo Proof Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl max-w-lg w-full p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-400">
                  {selectedTicket.complaint_number}
                </span>
                <h3 className="font-black text-sm text-white mt-0.5">Update Resolution Status</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Action State:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["IN_PROGRESS", "RESOLVED", "REJECTED"] as const).map((action) => (
                    <button
                      type="button"
                      key={action}
                      onClick={() => setNewStatus(action)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        newStatus === action ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-700 text-slate-400"
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              {newStatus === "RESOLVED" && (
                <div className="space-y-2 p-3 bg-emerald-950/40 rounded-2xl border border-emerald-800">
                  <label className="block text-xs font-bold text-emerald-300">
                    Mandatory "After Resolution" Photo Proof:
                  </label>
                  <input
                    type="text"
                    value={afterPhotoUrl}
                    onChange={(e) => setAfterPhotoUrl(e.target.value)}
                    placeholder="Paste image URL of cleared site..."
                    className="w-full text-xs p-2.5 rounded-xl border border-emerald-700 bg-slate-900 text-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setAfterPhotoUrl("https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80")}
                    className="text-[11px] font-bold text-emerald-400 underline block"
                  >
                    + Use Sample Clean Site Proof
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Officer Remarks:</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Official action taken on site..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-700 bg-slate-900 text-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  {isUpdating ? "Submitting..." : "Submit Proof & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal (Super Admin only) */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl max-w-md w-full p-6 border border-slate-700 shadow-2xl space-y-4">
            <h3 className="font-black text-sm text-white">Provision New Employee Account</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <input
                type="text"
                required
                value={newEmpId}
                onChange={(e) => setNewEmpId(e.target.value)}
                placeholder="Employee ID (e.g. JE-ROADS-204)"
                className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700 text-white uppercase font-mono"
              />
              <input
                type="text"
                required
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                placeholder="Full Name"
                className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <input
                type="email"
                required
                value={newEmpEmail}
                onChange={(e) => setNewEmpEmail(e.target.value)}
                placeholder="Official Email"
                className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <input
                type="tel"
                required
                value={newEmpPhone}
                onChange={(e) => setNewEmpPhone(e.target.value)}
                placeholder="Mobile Number"
                className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
              <select
                value={newEmpRole}
                onChange={(e: any) => setNewEmpRole(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-slate-700 text-white"
              >
                <option value="JE">Junior Engineer (JE)</option>
                <option value="DEPT_HEAD">Department Head</option>
                <option value="FIELD_STAFF">Field Staff</option>
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
