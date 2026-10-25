import { Complaint, Category, Ward, Announcement, User, AdminStats } from "../types";
import { initialCategories, initialWards, initialComplaints, initialAnnouncements, initialOfficers } from "../data/mockData";

class ClientDatabase {
  private categories: Category[];
  private wards: Ward[];
  private complaints: Complaint[];
  private announcements: Announcement[];
  private officers: User[];
  private nextTicketIndex: number = 105;

  constructor() {
    this.categories = this.loadFromStorage("fic_categories", initialCategories);
    this.wards = this.loadFromStorage("fic_wards", initialWards);
    this.complaints = this.loadFromStorage("fic_complaints", initialComplaints);
    this.announcements = this.loadFromStorage("fic_announcements", initialAnnouncements);
    this.officers = this.loadFromStorage("fic_officers", initialOfficers);
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn(`Failed to read ${key} from localStorage, using fallback:`, e);
    }
    return fallback;
  }

  private saveToStorage(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to write ${key} to localStorage:`, e);
    }
  }

  public getCategories(): Category[] {
    return this.categories;
  }

  public getWards(): Ward[] {
    return this.wards;
  }

  public getAnnouncements(): Announcement[] {
    return this.announcements;
  }

  public getOfficers(): User[] {
    return this.officers;
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
    const assignedOfficer = this.officers[0];

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
      assigned_officer_id: assignedOfficer ? assignedOfficer.id : null,
      officer_name: assignedOfficer ? `${assignedOfficer.full_name} (${assignedOfficer.designation})` : "Pending Assignment",
      officer_phone: assignedOfficer ? assignedOfficer.phone_number : null,
      title: data.title || "Civic Complaint",
      description: data.description || "",
      latitude: data.latitude || 28.6514,
      longitude: data.longitude || 77.1907,
      address: data.address || `${ward.name_en}, New Delhi`,
      landmark: data.landmark || "",
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
        { status: "ASSIGNED", timestamp: new Date().toISOString(), remarks: `Assigned to ${assignedOfficer.full_name}` }
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

    // Check for ticket search
    const ticketMatch = cleanMsg.match(/FC-2026-(\d+)/i) || cleanMsg.match(/#?(\d{6})/i);
    if (ticketMatch || lower.includes("track") || lower.includes("status") || lower.includes("स्थिति")) {
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

    // Ward & Councillor
    if (lower.includes("ward") || lower.includes("councillor") || lower.includes("पार्षद") || lower.includes("वार्ड")) {
      const w = this.wards[0];
      return {
        text: `🏛️ **Ward 64 (${w.name_en} / ${w.name_hi}):**\n- **Zone:** ${w.zone_name}\n- **Councillor:** ${w.councillor_name}\n- **Phone:** ${w.councillor_phone}\n- **Office:** ${w.office_address}`,
        action: "WARD_INFO",
        data: w,
        quickReplies: ["Report Issue in Ward", "Helpline Numbers", "Main Menu"]
      };
    }

    // Issue Filing
    if (lower.includes("pothole") || lower.includes("garbage") || lower.includes("kachra") || lower.includes("light") || lower.includes("water") || lower.includes("report") || lower.includes("शिकायत")) {
      let catName = "Garbage & Sanitation";
      let catId = "cat-1";
      if (lower.includes("pothole") || lower.includes("road") || lower.includes("gaddha")) {
        catName = "Pothole & Road Damage";
        catId = "cat-2";
      } else if (lower.includes("light") || lower.includes("dark")) {
        catName = "Streetlight & Poles";
        catId = "cat-3";
      }

      // Check duplicate
      const nearby = this.getNearbyComplaints(28.6514, 77.1907, 500);
      let duplicateAlert = "";
      if (nearby.length > 0) {
        duplicateAlert = `\n\n💡 *Notice:* We found 1 similar open complaint (#${nearby[0].complaint_number}) nearby. You can also upvote it with 'Me Too'.`;
      }

      return {
        text: `I've categorized this under **${catName}**.${duplicateAlert}\n\nPlease state the exact **location, landmark, or street name**:`,
        action: "REQUEST_LOCATION",
        quickReplies: ["Karol Bagh Metro Gate 2", "Rohini Sector 7 Market", "Civil Lines Rajpur Road", "Use Current GPS"]
      };
    }

    return {
      text: "Hello! I am your **Fic City Assistant**.\n\nYou can report civic issues (garbage, potholes, streetlights), track existing complaints, or find ward councillor details.",
      action: "GENERAL_GREETING",
      quickReplies: ["Report an Issue", "Track My Complaint", "Find My Ward", "Helpline Numbers"]
    };
  }
}

export const clientDb = new ClientDatabase();
