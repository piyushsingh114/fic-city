import bcrypt from "bcryptjs";
import {
  initialDepartments,
  initialWards,
  initialCategories,
  initialUsers,
  initialComplaints,
  initialFAQs,
  initialAnnouncements
} from "./mockData.js";

// Initial employee seed with hashed passwords
const salt = bcrypt.genSaltSync(10);
const defaultAdminPasswordHash = bcrypt.hashSync("Admin@123", salt);
const defaultOfficerPasswordHash = bcrypt.hashSync("Officer@123", salt);
const defaultCitizenPasswordHash = bcrypt.hashSync("password123", salt);

const seededEmployees = [
  {
    id: "emp-super-1",
    employee_id: "MCD-ADMIN-001",
    full_name: "Dr. Priya Malhotra, IAS",
    email: "commissioner@mcd.delhi.gov.in",
    phone_number: "9876543213",
    password_hash: defaultAdminPasswordHash,
    role: "SUPER_ADMIN",
    designation: "Additional Municipal Commissioner",
    department_id: null,
    ward_id: null,
    failed_attempts: 0,
    is_locked: false,
    must_change_password: false,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "emp-head-san",
    employee_id: "DEPT-SAN-01",
    full_name: "Shri O.P. Meena",
    email: "head.sanitation@mcd.delhi.gov.in",
    phone_number: "9876543214",
    password_hash: defaultOfficerPasswordHash,
    role: "DEPT_HEAD",
    designation: "Chief Engineer (Sanitation)",
    department_id: "dept-1",
    ward_id: null,
    failed_attempts: 0,
    is_locked: false,
    must_change_password: false,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "emp-je-1",
    employee_id: "MCD-SAN-1044",
    full_name: "Rajesh Verma",
    email: "rajesh.verma@mcd.delhi.gov.in",
    phone_number: "9876543211",
    password_hash: defaultOfficerPasswordHash,
    role: "JE",
    designation: "Junior Engineer (Ward 64 - Karol Bagh)",
    department_id: "dept-1",
    ward_id: "ward-64",
    failed_attempts: 0,
    is_locked: false,
    must_change_password: false,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "emp-je-2",
    employee_id: "MCD-PWD-0892",
    full_name: "Suresh Yadav",
    email: "suresh.yadav@mcd.delhi.gov.in",
    phone_number: "9876543212",
    password_hash: defaultOfficerPasswordHash,
    role: "JE",
    designation: "Junior Engineer (Ward 23 - Rohini)",
    department_id: "dept-2",
    ward_id: "ward-23",
    failed_attempts: 0,
    is_locked: false,
    must_change_password: false,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

class DbStore {
  constructor() {
    this.departments = [...initialDepartments];
    this.wards = [...initialWards];
    this.categories = [...initialCategories];
    
    // Enrich users with default password hash
    this.users = initialUsers.map(u => ({
      ...u,
      password_hash: defaultCitizenPasswordHash,
      is_active: true
    }));

    this.employees = [...seededEmployees];
    this.complaints = [...initialComplaints];
    this.faqs = [...initialFAQs];
    this.announcements = [...initialAnnouncements];
    this.activityLogs = [
      {
        id: "log-1",
        employee_id: "emp-super-1",
        employee_name: "Dr. Priya Malhotra, IAS",
        action: "SYSTEM_INIT",
        complaint_id: null,
        details: "MCD 311 Municipal Grievance portal initialized with 6 Delhi Wards",
        ip_address: "127.0.0.1",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ];

    this.chatSessions = new Map();
    this.nextTicketIndex = 105;
  }

  // --- HAIVERSINE DISTANCE (KM) ---
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
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

  // --- AUTO-DETECT NEAREST WARD BY GPS ---
  findNearestWard(lat, lng) {
    if (!lat || !lng) return this.wards[0];
    let nearest = this.wards[0];
    let minDistance = Infinity;

    for (const ward of this.wards) {
      const dist = this.calculateDistance(lat, lng, ward.center.lat, ward.center.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = ward;
      }
    }
    return nearest;
  }

  // --- CITIZEN AUTHENTICATION ---
  registerCitizen({ full_name, phone_number, email, password, ward_id }) {
    const cleanPhone = phone_number.replace(/\D/g, "");
    const existing = this.users.find(u => u.phone_number === cleanPhone);
    if (existing) {
      throw new Error("An account with this mobile number already exists. Please log in.");
    }

    const newUser = {
      id: `user-cit-${Date.now()}`,
      full_name,
      phone_number: cleanPhone,
      email: email || null,
      password_hash: bcrypt.hashSync(password, 10),
      ward_id: ward_id || "ward-64",
      role: "CITIZEN",
      preferred_language: "en",
      is_active: true,
      created_at: new Date().toISOString()
    };

    this.users.push(newUser);
    const { password_hash, ...safeUser } = newUser;
    return safeUser;
  }

  loginCitizen({ identifier, password }) {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, "");

    const user = this.users.find(
      u => u.phone_number === cleanPhone || (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!user) {
      throw new Error("Account not found with this mobile number or email.");
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      throw new Error("Invalid password. Please check your credentials.");
    }

    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  // --- EMPLOYEE & RBAC AUTHENTICATION ---
  loginEmployee({ employee_id, password, ip_address = "127.0.0.1" }) {
    const cleanEmpId = employee_id.trim().toUpperCase();
    const emp = this.employees.find(e => e.employee_id.toUpperCase() === cleanEmpId);

    if (!emp) {
      throw new Error("Invalid Employee / JE ID. Staff records not found.");
    }

    if (emp.is_locked) {
      throw new Error("Account is locked due to 5 consecutive failed attempts. Please contact Super Admin.");
    }

    if (!emp.is_active) {
      throw new Error("Your employee account has been deactivated. Please contact your department head.");
    }

    const isMatch = bcrypt.compareSync(password, emp.password_hash);
    if (!isMatch) {
      emp.failed_attempts = (emp.failed_attempts || 0) + 1;
      if (emp.failed_attempts >= 5) {
        emp.is_locked = true;
        this.logActivity(emp.id, emp.full_name, "ACCOUNT_LOCKED", null, "Account locked after 5 failed login attempts", ip_address);
        throw new Error("Account has been locked after 5 failed attempts. Please contact Super Admin.");
      }
      throw new Error(`Invalid credentials. Attempt ${emp.failed_attempts} of 5 before account lock.`);
    }

    // Reset failed attempts on success
    emp.failed_attempts = 0;
    this.logActivity(emp.id, emp.full_name, "STAFF_LOGIN", null, `Successful portal login for role ${emp.role}`, ip_address);

    const { password_hash, ...safeEmp } = emp;
    return safeEmp;
  }

  getEmployees() {
    return this.employees.map(({ password_hash, ...safe }) => safe);
  }

  createEmployee(data, creatorEmployee) {
    const cleanEmpId = data.employee_id.trim().toUpperCase();
    const existing = this.employees.find(e => e.employee_id.toUpperCase() === cleanEmpId);
    if (existing) {
      throw new Error("An employee with this Employee ID already exists.");
    }

    const tempPassword = data.password || "Officer@123";
    const newEmp = {
      id: `emp-${Date.now()}`,
      employee_id: cleanEmpId,
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      password_hash: bcrypt.hashSync(tempPassword, 10),
      role: data.role || "FIELD_STAFF",
      designation: data.designation || "Municipal Field Officer",
      department_id: data.department_id || null,
      ward_id: data.ward_id || null,
      failed_attempts: 0,
      is_locked: false,
      must_change_password: true,
      is_active: true,
      created_at: new Date().toISOString()
    };

    this.employees.push(newEmp);

    if (creatorEmployee) {
      this.logActivity(
        creatorEmployee.id,
        creatorEmployee.full_name,
        "EMPLOYEE_CREATE",
        null,
        `Provisioned staff ID: ${cleanEmpId} (${newEmp.role})`
      );
    }

    const { password_hash, ...safeEmp } = newEmp;
    return safeEmp;
  }

  // --- AUDIT ACTIVITY LOGGING ---
  logActivity(employeeId, employeeName, action, complaintId = null, details = "", ipAddress = "127.0.0.1") {
    const log = {
      id: `log-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      employee_id: employeeId,
      employee_name: employeeName,
      action,
      complaint_id: complaintId,
      details,
      ip_address: ipAddress,
      timestamp: new Date().toISOString()
    };
    this.activityLogs.unshift(log);
    if (this.activityLogs.length > 200) {
      this.activityLogs.pop();
    }
    return log;
  }

  getActivityLogs() {
    return this.activityLogs;
  }

  // --- COMPLAINTS QUERY & FILTER ---
  getComplaints(filters = {}) {
    let list = [...this.complaints];

    if (filters.status && filters.status !== "ALL") {
      list = list.filter((c) => c.status === filters.status);
    }
    if (filters.citizen_id) {
      list = list.filter((c) => c.citizen_id === filters.citizen_id);
    }
    if (filters.assigned_officer_id) {
      list = list.filter((c) => c.assigned_officer_id === filters.assigned_officer_id);
    }
    if (filters.ward_id) {
      list = list.filter((c) => c.ward_id === filters.ward_id);
    }
    if (filters.category_id) {
      list = list.filter((c) => c.category_id === filters.category_id);
    }
    if (filters.search) {
      const term = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.complaint_number.toLowerCase().includes(term) ||
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.address.toLowerCase().includes(term)
      );
    }

    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  getNearbyComplaints(lat, lng, radiusMeters = 500) {
    const radiusKm = radiusMeters / 1000;
    return this.complaints
      .map((c) => ({
        ...c,
        distanceMeters: Math.round(this.calculateDistance(lat, lng, c.latitude, c.longitude) * 1000)
      }))
      .filter((c) => c.distanceMeters <= radiusMeters && c.status !== "RESOLVED")
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  getComplaintById(idOrNumber) {
    return this.complaints.find(
      (c) => c.id === idOrNumber || c.complaint_number.toUpperCase() === idOrNumber.toUpperCase()
    );
  }

  createComplaint(data) {
    const id = `comp-${this.nextTicketIndex}`;
    const complaint_number = `FC-2026-${String(this.nextTicketIndex).padStart(6, "0")}`;
    this.nextTicketIndex++;

    const category = this.categories.find((c) => c.id === data.category_id) || this.categories[0];
    const ward = data.ward_id
      ? this.wards.find((w) => w.id === data.ward_id)
      : this.findNearestWard(data.latitude, data.longitude);

    const slaHours = data.sla_hours || category.default_sla_hours || 48;
    const sla_deadline = new Date(Date.now() + 1000 * 60 * 60 * slaHours).toISOString();

    // Assign to JE / Officer
    const availableOfficer = this.employees.find(
      (e) => (e.role === "JE" || e.role === "FIELD_STAFF") && e.ward_id === ward.id
    ) || this.employees.find(
      (e) => (e.role === "JE" || e.role === "FIELD_STAFF") && e.department_id === category.department_id
    ) || this.employees[2];

    const newComplaint = {
      id,
      complaint_number,
      citizen_id: data.citizen_id || "user-cit-1",
      citizen_name: data.is_anonymous ? "Anonymous Citizen" : data.citizen_name || "Concerned Citizen",
      citizen_phone: data.is_anonymous ? "HIDDEN" : data.citizen_phone || "9876543210",
      category_id: category.id,
      category_name: category.name_en,
      sub_category_name: data.sub_category_name || "General",
      department_id: category.department_id,
      ward_id: ward.id,
      ward_name: ward.name_en,
      zone_name: ward.zone_name,
      assigned_officer_id: availableOfficer ? availableOfficer.id : null,
      officer_name: availableOfficer ? `${availableOfficer.full_name} (${availableOfficer.designation})` : "Pending Assignment",
      officer_phone: availableOfficer ? availableOfficer.phone_number : null,
      title: data.title || "Civic Complaint",
      description: data.description || "",
      voice_note_url: data.voice_note_url || null,
      
      // Live GPS Location
      latitude: parseFloat(data.latitude) || 28.6514,
      longitude: parseFloat(data.longitude) || 77.1907,
      address: data.address || `${ward.name_en}, New Delhi`,
      house_flat_no: data.house_flat_no || "",
      landmark: data.landmark || "",
      location_accuracy_meters: data.location_accuracy_meters || null,
      location_captured_at: data.location_captured_at || new Date().toISOString(),

      is_anonymous: Boolean(data.is_anonymous),
      status: availableOfficer ? "ASSIGNED" : "SUBMITTED",
      priority: data.priority || "MEDIUM",
      source: data.source || "WEB_PORTAL",
      upvotes_count: 1,
      created_at: new Date().toISOString(),
      sla_deadline,
      is_escalated: false,
      media: data.media || [],
      comments: [],
      timeline: [
        {
          status: "SUBMITTED",
          timestamp: new Date().toISOString(),
          remarks: "Grievance registered in Fic City system with live GPS location"
        }
      ]
    };

    if (availableOfficer) {
      newComplaint.timeline.push({
        status: "ASSIGNED",
        timestamp: new Date().toISOString(),
        remarks: `Auto-assigned to ${availableOfficer.full_name} (${availableOfficer.designation})`
      });
    }

    this.complaints.unshift(newComplaint);
    return newComplaint;
  }

  updateComplaintStatus(id, newStatus, remarks = "", officerId = null, proofMediaUrl = null) {
    const complaint = this.getComplaintById(id);
    if (!complaint) return null;

    complaint.status = newStatus;
    if (newStatus === "RESOLVED") {
      complaint.resolved_at = new Date().toISOString();
    }
    if (proofMediaUrl) {
      complaint.media.push({
        id: `med-${Date.now()}`,
        url: proofMediaUrl,
        type: "AFTER_PROOF",
        caption: "Resolution proof uploaded by municipal field staff",
        timestamp: new Date().toISOString()
      });
    }

    complaint.timeline.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      remarks: remarks || `Status updated to ${newStatus}`
    });

    return complaint;
  }

  addUpvote(complaintId) {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) return null;
    complaint.upvotes_count = (complaint.upvotes_count || 0) + 1;
    return complaint;
  }

  addFeedback(complaintId, rating, review) {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) return null;
    complaint.feedback = {
      rating: parseInt(rating, 10),
      review: review || "",
      submitted_at: new Date().toISOString()
    };
    return complaint;
  }

  reopenComplaint(complaintId, reason) {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) return null;
    complaint.status = "REOPENED";
    complaint.is_escalated = true;
    complaint.timeline.push({
      status: "REOPENED",
      timestamp: new Date().toISOString(),
      remarks: `Reopened by citizen: ${reason}`
    });
    return complaint;
  }

  escalateComplaint(complaintId, reason = "SLA breached without resolution") {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) return null;
    complaint.is_escalated = true;
    complaint.priority = "CRITICAL";
    complaint.timeline.push({
      status: complaint.status,
      timestamp: new Date().toISOString(),
      remarks: `⚠️ ESCALATED TO ZONAL COMMISSIONER: ${reason}`
    });
    return complaint;
  }

  addComment(complaintId, userText, userName = "Citizen") {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) return null;
    const comment = {
      id: `comm-${Date.now()}`,
      user: userName,
      text: userText,
      timestamp: new Date().toISOString()
    };
    complaint.comments.push(comment);
    return comment;
  }

  getAdminStats() {
    const total = this.complaints.length;
    const resolved = this.complaints.filter((c) => c.status === "RESOLVED").length;
    const inProgress = this.complaints.filter((c) => c.status === "IN_PROGRESS").length;
    const submittedOrAssigned = this.complaints.filter(
      (c) => c.status === "SUBMITTED" || c.status === "ASSIGNED"
    ).length;
    const now = new Date();
    const overdue = this.complaints.filter(
      (c) => c.status !== "RESOLVED" && new Date(c.sla_deadline) < now
    ).length;

    const slaCompliance = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;

    const categoryCounts = {};
    for (const c of this.complaints) {
      categoryCounts[c.category_name] = (categoryCounts[c.category_name] || 0) + 1;
    }

    const wardCounts = {};
    for (const c of this.complaints) {
      wardCounts[c.ward_name] = (wardCounts[c.ward_name] || 0) + 1;
    }

    return {
      total,
      resolved,
      inProgress,
      pending: submittedOrAssigned,
      overdue,
      slaCompliancePercentage: slaCompliance,
      avgResolutionHours: 18.4,
      citizenSatisfactionScore: 4.6,
      categoryCounts,
      wardCounts
    };
  }
}

export const dbStore = new DbStore();
