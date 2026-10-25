import {
  initialDepartments,
  initialWards,
  initialCategories,
  initialUsers,
  initialComplaints,
  initialFAQs,
  initialAnnouncements
} from "./mockData.js";

class DbStore {
  constructor() {
    this.departments = [...initialDepartments];
    this.wards = [...initialWards];
    this.categories = [...initialCategories];
    this.users = [...initialUsers];
    this.complaints = [...initialComplaints];
    this.faqs = [...initialFAQs];
    this.announcements = [...initialAnnouncements];
    this.chatSessions = new Map(); // sessionId -> { id, userId, messages: [] }
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
    return R * c; // Distance in km
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

    // Default order: newest first
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

    // Auto calculate SLA deadline
    const slaHours = data.sla_hours || category.default_sla_hours || 48;
    const sla_deadline = new Date(Date.now() + 1000 * 60 * 60 * slaHours).toISOString();

    // Auto-assign to available officer in this ward/dept
    const availableOfficer = this.users.find(
      (u) => u.role === "FIELD_OFFICER" && u.department_id === category.department_id
    ) || this.users.find((u) => u.role === "FIELD_OFFICER");

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
      latitude: parseFloat(data.latitude) || 28.6514,
      longitude: parseFloat(data.longitude) || 77.1907,
      address: data.address || `${ward.name_en}, New Delhi`,
      landmark: data.landmark || "",
      is_anonymous: Boolean(data.is_anonymous),
      status: availableOfficer ? "ASSIGNED" : "SUBMITTED",
      priority: data.priority || "MEDIUM",
      source: data.source || "MOBILE_APP",
      upvotes_count: 1,
      created_at: new Date().toISOString(),
      sla_deadline,
      is_escalated: false,
      media: data.media || [],
      timeline: [
        {
          status: "SUBMITTED",
          timestamp: new Date().toISOString(),
          remarks: `Complaint registered with SLA of ${slaHours} hours`
        },
        ...(availableOfficer
          ? [
              {
                status: "ASSIGNED",
                timestamp: new Date().toISOString(),
                remarks: `Assigned to ${availableOfficer.full_name} (${availableOfficer.designation})`
              }
            ]
          : [])
      ],
      comments: []
    };

    this.complaints.unshift(newComplaint);
    return newComplaint;
  }

  updateComplaintStatus(id, newStatus, remarks, officerUserId, proofMedia = null) {
    const complaint = this.getComplaintById(id);
    if (!complaint) return null;

    complaint.status = newStatus;
    complaint.updated_at = new Date().toISOString();

    if (newStatus === "RESOLVED") {
      complaint.resolved_at = new Date().toISOString();
      if (proofMedia) {
        complaint.media.push({
          id: `med-${Date.now()}`,
          stage: "AFTER",
          type: "PHOTO",
          url: proofMedia,
          uploaded_at: new Date().toISOString()
        });
      }
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

  // --- STATS & ANALYTICS ---
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

    // SLA compliance rate
    const slaCompliance = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;

    // Category breakdown
    const categoryCounts = {};
    for (const c of this.complaints) {
      categoryCounts[c.category_name] = (categoryCounts[c.category_name] || 0) + 1;
    }

    // Ward breakdown
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
