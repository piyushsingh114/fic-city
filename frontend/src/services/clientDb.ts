import { Complaint, Category, Ward, Announcement, User, Employee, ActivityLog, AdminStats } from "../types";
import { initialCategories, initialWards, initialComplaints, initialAnnouncements } from "../data/mockData";

export const defaultEmployees: Employee[] = [
  {
    id: "emp-super-1",
    employee_id: "MCD-ADMIN-001",
    full_name: "Dr. Priya Malhotra, IAS",
    email: "commissioner@mcd.delhi.gov.in",
    phone_number: "9876543213",
    role: "SUPER_ADMIN",
    designation: "Additional Municipal Commissioner",
    is_active: true,
    must_change_password: false
  },
  {
    id: "emp-head-san",
    employee_id: "DEPT-SAN-01",
    full_name: "Shri O.P. Meena",
    email: "head.sanitation@mcd.delhi.gov.in",
    phone_number: "9876543214",
    role: "DEPT_HEAD",
    department_id: "dept-1",
    designation: "Chief Engineer (Sanitation)",
    is_active: true
  },
  {
    id: "emp-je-1",
    employee_id: "MCD-SAN-1044",
    full_name: "Rajesh Verma",
    email: "rajesh.verma@mcd.delhi.gov.in",
    phone_number: "9876543211",
    role: "JE",
    department_id: "dept-1",
    ward_id: "ward-64",
    designation: "Junior Engineer (Ward 64 - Karol Bagh)",
    is_active: true
  },
  {
    id: "emp-je-2",
    employee_id: "MCD-PWD-0892",
    full_name: "Suresh Yadav",
    email: "suresh.yadav@mcd.delhi.gov.in",
    phone_number: "9876543212",
    role: "JE",
    department_id: "dept-2",
    ward_id: "ward-23",
    designation: "Junior Engineer (Ward 23 - Rohini)",
    is_active: true
  }
];

export const defaultUsers: User[] = [
  {
    id: "user-cit-1",
    phone_number: "9876543210",
    full_name: "Amit Sharma",
    email: "amit.sharma@example.com",
    ward_id: "ward-64",
    created_at: new Date().toISOString()
  },
  {
    id: "user-cit-2",
    phone_number: "9876543220",
    full_name: "Pooja Malhotra",
    email: "pooja.m@example.com",
    ward_id: "ward-23",
    created_at: new Date().toISOString()
  }
];

class ClientDatabase {
  private categories: Category[];
  private wards: Ward[];
  private complaints: Complaint[];
  private announcements: Announcement[];
  private users: User[];
  private employees: Employee[];
  private activityLogs: ActivityLog[];
  private nextTicketIndex: number = 105;

  constructor() {
    this.categories = this.loadFromStorage("fic_categories", initialCategories);
    this.wards = this.loadFromStorage("fic_wards", initialWards);
    this.complaints = this.loadFromStorage("fic_complaints", initialComplaints);
    this.announcements = this.loadFromStorage("fic_announcements", initialAnnouncements);
    this.users = this.loadFromStorage("fic_users_list", defaultUsers);
    this.employees = this.loadFromStorage("fic_employees_list", defaultEmployees);
    this.activityLogs = this.loadFromStorage("fic_activity_logs", [
      {
        id: "log-1",
        employee_id: "emp-super-1",
        employee_name: "Dr. Priya Malhotra, IAS",
        action: "SYSTEM_INIT",
        details: "MCD 311 Municipal Grievance portal initialized with 6 Delhi Wards",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ]);
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(`Failed to read ${key} from storage:`, e);
    }
    return fallback;
  }

  private saveToStorage(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to write ${key} to storage:`, e);
    }
  }

  // ==========================================
  // CITIZEN AUTH METHODS
  // ==========================================
  public registerCitizen(payload: {
    full_name: string;
    phone_number: string;
    email?: string;
    password: string;
    ward_id?: string;
  }): { user: User; token: string } {
    const existing = this.users.find(
      u => u.phone_number === payload.phone_number || (payload.email && u.email === payload.email)
    );
    if (existing) {
      throw new Error("An account already exists with this mobile number or email.");
    }

    const newUser: User = {
      id: `user-cit-${Date.now()}`,
      full_name: payload.full_name,
      phone_number: payload.phone_number,
      email: payload.email,
      ward_id: payload.ward_id || "ward-64",
      created_at: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveToStorage("fic_users_list", this.users);

    return {
      user: newUser,
      token: `token_cit_${newUser.id}_${Date.now()}`
    };
  }

  public loginCitizen(payload: {
    identifier: string;
    password: string;
  }): { user: User; token: string } {
    const user = this.users.find(
      u => u.phone_number === payload.identifier || u.email?.toLowerCase() === payload.identifier.toLowerCase()
    );

    if (!user) {
      // Auto-provision demo account if tested
      if (payload.identifier === "9876543210") {
        return {
          user: defaultUsers[0],
          token: `token_cit_${defaultUsers[0].id}_${Date.now()}`
        };
      }
      throw new Error("No citizen account found with these credentials.");
    }

    return {
      user,
      token: `token_cit_${user.id}_${Date.now()}`
    };
  }

  // ==========================================
  // EMPLOYEE AUTH & RBAC METHODS
  // ==========================================
  public loginEmployee(payload: {
    employee_id: string;
    password: string;
  }): { employee: Employee; token: string } {
    const emp = this.employees.find(
      e => e.employee_id.toUpperCase() === payload.employee_id.toUpperCase()
    );

    if (!emp) {
      throw new Error("Invalid Employee ID.");
    }

    if (emp.is_locked) {
      throw new Error("Account locked due to excessive failed attempts. Contact Municipal Commissioner.");
    }

    // Default passwords
    const valid =
      payload.password === "Admin@123" ||
      payload.password === "Officer@123" ||
      payload.password === "password123";

    if (!valid) {
      throw new Error("Incorrect password.");
    }

    // Log login
    this.logActivity(emp.id, emp.full_name, "EMPLOYEE_LOGIN", `Logged in to role: ${emp.role}`);

    return {
      employee: emp,
      token: `token_emp_${emp.id}_${Date.now()}`
    };
  }

  public getEmployees(): Employee[] {
    return this.employees;
  }

  public createEmployee(payload: Partial<Employee> & { password?: string }): Employee {
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      employee_id: payload.employee_id || `MCD-STAFF-${Date.now().toString().slice(-4)}`,
      full_name: payload.full_name || "New Staff",
      email: payload.email || "staff@mcd.delhi.gov.in",
      phone_number: payload.phone_number || "9876500000",
      role: payload.role || "FIELD_STAFF",
      designation: payload.designation || "Staff",
      department_id: payload.department_id || "dept-1",
      ward_id: payload.ward_id || "ward-64",
      is_active: true,
      must_change_password: true,
      created_at: new Date().toISOString()
    };

    this.employees.push(newEmp);
    this.saveToStorage("fic_employees_list", this.employees);

    this.logActivity(
      "emp-super-1",
      "Super Admin",
      "USER_CREATE",
      `Provisioned account for ${newEmp.full_name} (${newEmp.employee_id}) as ${newEmp.role}`
    );

    return newEmp;
  }

  public logActivity(
    employeeId: string,
    employeeName: string,
    action: string,
    details: string,
    complaintId?: string
  ) {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      employee_id: employeeId,
      employee_name: employeeName,
      action,
      details,
      complaint_id: complaintId,
      timestamp: new Date().toISOString()
    };
    this.activityLogs.unshift(newLog);
    this.saveToStorage("fic_activity_logs", this.activityLogs.slice(0, 100));
  }

  public getActivityLogs(): ActivityLog[] {
    return this.activityLogs;
  }

  // ==========================================
  // METADATA & COMPLAINT METHODS
  // ==========================================
  public getCategories(): Category[] {
    return this.categories;
  }

  public getWards(): Ward[] {
    return this.wards;
  }

  public getAnnouncements(): Announcement[] {
    return this.announcements;
  }

  public createAnnouncement(payload: { title: string; message: string; ward_id?: string; priority?: string }): Announcement {
    const ward = this.wards.find(w => w.id === payload.ward_id);
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      ward_id: payload.ward_id || null,
      ward_name: ward ? ward.name_en : "All Delhi Wards",
      title: payload.title,
      message: payload.message,
      priority: (payload.priority as any) || "MEDIUM",
      created_at: new Date().toISOString()
    };
    this.announcements.unshift(newAnn);
    this.saveToStorage("fic_announcements", this.announcements);
    return newAnn;
  }

  public getComplaints(filters?: Record<string, string>): Complaint[] {
    let list = [...this.complaints];
    if (filters?.status && filters.status !== "ALL") {
      list = list.filter(c => c.status === filters.status);
    }
    if (filters?.citizen_id) {
      list = list.filter(c => c.citizen_id === filters.citizen_id);
    }
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      list = list.filter(
        c =>
          c.complaint_number.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.address.toLowerCase().includes(term)
      );
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getNearbyComplaints(lat: number, lng: number, radiusMeters = 800): Complaint[] {
    return this.complaints
      .map(c => ({
        ...c,
        distanceMeters: Math.round(this.calculateDistance(lat, lng, c.latitude, c.longitude) * 1000)
      }))
      .filter(c => c.distanceMeters <= radiusMeters && c.status !== "RESOLVED")
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public getComplaintById(idOrNumber: string): Complaint | undefined {
    return this.complaints.find(
      c => c.id === idOrNumber || c.complaint_number.toUpperCase() === idOrNumber.toUpperCase()
    );
  }

  public createComplaint(data: Partial<Complaint>): Complaint {
    const id = `comp-${this.nextTicketIndex}`;
    const complaint_number = `FC-2026-${String(this.nextTicketIndex).padStart(6, "0")}`;
    this.nextTicketIndex++;

    const category = this.categories.find(c => c.id === data.category_id) || this.categories[0];
    const ward = data.ward_id
      ? this.wards.find(w => w.id === data.ward_id) || this.wards[0]
      : this.wards[0];

    const slaHours = category.default_sla_hours || 48;
    const sla_deadline = new Date(Date.now() + 1000 * 60 * 60 * slaHours).toISOString();
    const assignedEmp = this.employees.find(e => e.role === "JE") || this.employees[2];

    const newTicket: Complaint = {
      id,
      complaint_number,
      citizen_id: data.citizen_id || "user-cit-1",
      citizen_name: data.is_anonymous ? "Anonymous Citizen" : data.citizen_name || "Concerned Citizen",
      citizen_phone: data.is_anonymous ? "HIDDEN" : data.citizen_phone || "9876543210",
      category_id: category.id,
      category_name: category.name_en,
      sub_category_name: data.sub_category_name || "General Issue",
      department_id: category.department_id,
      ward_id: ward.id,
      ward_name: ward.name_en,
      zone_name: ward.zone_name,
      assigned_employee_id: assignedEmp ? assignedEmp.id : null,
      officer_name: assignedEmp ? `${assignedEmp.full_name} (${assignedEmp.designation})` : "Pending Assignment",
      officer_phone: assignedEmp ? assignedEmp.phone_number : null,
      title: data.title || "Civic Complaint",
      description: data.description || "",
      latitude: data.latitude || 28.6514,
      longitude: data.longitude || 77.1907,
      address: data.address || `${ward.name_en}, New Delhi`,
      house_flat_no: data.house_flat_no,
      landmark: data.landmark || "",
      location_accuracy_meters: data.location_accuracy_meters,
      location_captured_at: data.location_captured_at || new Date().toISOString(),
      is_anonymous: Boolean(data.is_anonymous),
      status: "ASSIGNED",
      priority: data.priority || "HIGH",
      source: "WEB_PORTAL",
      upvotes_count: 1,
      created_at: new Date().toISOString(),
      sla_deadline,
      is_escalated: false,
      media: data.media || [],
      timeline: [
        { status: "SUBMITTED", timestamp: new Date().toISOString(), remarks: `Lodged with ${slaHours}h SLA` },
        { status: "ASSIGNED", timestamp: new Date().toISOString(), remarks: `Assigned to ${assignedEmp.full_name}` }
      ],
      comments: []
    };

    this.complaints.unshift(newTicket);
    this.saveToStorage("fic_complaints", this.complaints);
    return newTicket;
  }

  public updateComplaintStatus(
    id: string,
    status: any,
    remarks: string,
    officer_id?: string,
    proof_media_url?: string
  ): Complaint {
    const complaint = this.getComplaintById(id);
    if (!complaint) throw new Error("Ticket not found");

    complaint.status = status;
    if (status === "RESOLVED") {
      complaint.resolved_at = new Date().toISOString();
      if (proof_media_url) {
        complaint.media.push({
          id: `med-${Date.now()}`,
          stage: "AFTER",
          type: "PHOTO",
          url: proof_media_url,
          uploaded_at: new Date().toISOString()
        });
      }
    }

    complaint.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      remarks: remarks || `Status transitioned to ${status}`
    });

    this.saveToStorage("fic_complaints", this.complaints);

    // Audit Log
    const actingEmp = this.employees.find(e => e.id === officer_id) || this.employees[0];
    this.logActivity(
      actingEmp.id,
      actingEmp.full_name,
      "STATUS_UPDATE",
      `Updated ${complaint.complaint_number} to ${status}. Remarks: ${remarks || "None"}`,
      complaint.id
    );

    return complaint;
  }

  public upvoteComplaint(id: string): Complaint {
    const c = this.getComplaintById(id);
    if (!c) throw new Error("Ticket not found");
    c.upvotes_count = (c.upvotes_count || 0) + 1;
    this.saveToStorage("fic_complaints", this.complaints);
    return c;
  }

  public submitFeedback(id: string, rating: number, review?: string): Complaint {
    const c = this.getComplaintById(id);
    if (!c) throw new Error("Ticket not found");
    c.feedback = {
      rating,
      review: review || "",
      submitted_at: new Date().toISOString()
    };
    this.saveToStorage("fic_complaints", this.complaints);
    return c;
  }

  public reopenComplaint(id: string, reason: string): Complaint {
    const c = this.getComplaintById(id);
    if (!c) throw new Error("Ticket not found");
    c.status = "REOPENED";
    c.is_escalated = true;
    c.timeline.push({
      status: "REOPENED",
      timestamp: new Date().toISOString(),
      remarks: `Reopened by citizen: ${reason}`
    });
    this.saveToStorage("fic_complaints", this.complaints);
    return c;
  }

  public escalateComplaint(id: string, reason?: string): Complaint {
    const c = this.getComplaintById(id);
    if (!c) throw new Error("Ticket not found");
    c.is_escalated = true;
    c.priority = "CRITICAL";
    c.timeline.push({
      status: c.status,
      timestamp: new Date().toISOString(),
      remarks: `⚠️ ESCALATED TO COMMISSIONER: ${reason || "Citizen manual escalation"}`
    });
    this.saveToStorage("fic_complaints", this.complaints);
    return c;
  }

  public addComment(id: string, text: string, user_name: string) {
    const c = this.getComplaintById(id);
    if (!c) throw new Error("Ticket not found");
    const comment = {
      id: `comm-${Date.now()}`,
      user: user_name,
      text,
      timestamp: new Date().toISOString()
    };
    c.comments.push(comment);
    this.saveToStorage("fic_complaints", this.complaints);
    return comment;
  }

  public getAdminStats(): AdminStats {
    const total = this.complaints.length;
    const resolved = this.complaints.filter(c => c.status === "RESOLVED").length;
    const inProgress = this.complaints.filter(c => c.status === "IN_PROGRESS").length;
    const pending = this.complaints.filter(c => c.status === "SUBMITTED" || c.status === "ASSIGNED").length;
    const overdue = this.complaints.filter(
      c => c.status !== "RESOLVED" && new Date(c.sla_deadline) < new Date()
    ).length;

    const categoryCounts: Record<string, number> = {};
    for (const c of this.complaints) {
      categoryCounts[c.category_name] = (categoryCounts[c.category_name] || 0) + 1;
    }

    const wardCounts: Record<string, number> = {};
    for (const c of this.complaints) {
      wardCounts[c.ward_name] = (wardCounts[c.ward_name] || 0) + 1;
    }

    return {
      total,
      resolved,
      inProgress,
      pending,
      overdue,
      slaCompliancePercentage: total > 0 ? Math.round(((total - overdue) / total) * 100) : 100,
      avgResolutionHours: 18.4,
      citizenSatisfactionScore: 4.6,
      categoryCounts,
      wardCounts
    };
  }

  public processChatMessage(message: string, userId = "user-cit-1"): any {
    const cleanMsg = message.trim();
    const lower = cleanMsg.toLowerCase();

    const ticketMatch = cleanMsg.match(/FC-2026-(\d+)/i) || cleanMsg.match(/#?(\d{6})/i);
    if (ticketMatch || lower.includes("track") || lower.includes("status")) {
      const ticket = ticketMatch
        ? this.getComplaintById(ticketMatch[0].startsWith("FC-") ? ticketMatch[0] : `FC-2026-${ticketMatch[1]}`)
        : this.complaints[0];

      if (ticket) {
        return {
          text: `📌 **Complaint #${ticket.complaint_number} Status:**\n- **Issue:** ${ticket.title}\n- **Current Status:** ${ticket.status}\n- **Assigned Officer:** ${ticket.officer_name}\n- **SLA Deadline:** ${new Date(ticket.sla_deadline).toLocaleString()}\n\n${ticket.status === "RESOLVED" ? "✅ Resolved! Please rate our service." : "Inspection work is currently underway."}`,
          action: "COMPLAINT_DETAILS",
          data: ticket,
          quickReplies: ["Rate Resolution 5⭐", "Escalate Complaint", "Call Officer", "Main Menu"]
        };
      }
    }

    if (lower.includes("pothole") || lower.includes("garbage") || lower.includes("report")) {
      let catName = "Garbage & Sanitation";
      if (lower.includes("pothole") || lower.includes("road")) catName = "Pothole & Road Damage";
      return {
        text: `I've categorized this under **${catName}**.\n\nPlease state the exact **location, landmark, or street name**:`,
        action: "REQUEST_LOCATION",
        quickReplies: ["Karol Bagh Metro Gate 2", "Rohini Sector 7 Market", "Use Current GPS"]
      };
    }

    return {
      text: "Hello! I am your **Fic City Assistant**.\n\nYou can report civic problems, track complaints, or check municipal SLAs.",
      action: "GENERAL_GREETING",
      quickReplies: ["Report an Issue", "Track My Complaint", "Find My Ward", "Helpline Numbers"]
    };
  }
}

export const clientDb = new ClientDatabase();
