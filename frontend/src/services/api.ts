import { Complaint, Category, Ward, Announcement, AdminStats, User } from "../types";

const API_BASE = "/api";

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  const data = await res.json();
  return data.data;
}

export async function fetchWards(): Promise<Ward[]> {
  const res = await fetch(`${API_BASE}/wards`);
  const data = await res.json();
  return data.data;
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE}/announcements`);
  const data = await res.json();
  return data.data;
}

export async function createAnnouncement(payload: { title: string; message: string; ward_id?: string; priority?: string }): Promise<Announcement> {
  const res = await fetch(`${API_BASE}/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data;
}

export async function fetchComplaints(params?: Record<string, string>): Promise<Complaint[]> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const res = await fetch(`${API_BASE}/complaints${query}`);
  const data = await res.json();
  return data.data;
}

export async function fetchNearbyComplaints(lat: number, lng: number, radius = 800): Promise<Complaint[]> {
  const res = await fetch(`${API_BASE}/complaints/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  const data = await res.json();
  return data.data;
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${id}`);
  const data = await res.json();
  return data.data;
}

export async function createComplaint(payload: Partial<Complaint>): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data;
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  remarks: string,
  officer_id?: string,
  proof_media_url?: string
): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, remarks, officer_id, proof_media_url })
  });
  const data = await res.json();
  return data.data;
}

export async function upvoteComplaint(id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${id}/upvote`, {
    method: "POST"
  });
  const data = await res.json();
  return data.data;
}

export async function submitFeedback(id: string, rating: number, review: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${id}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating, review })
  });
  const data = await res.json();
  return data.data;
}

export async function reopenComplaint(id: string, reason: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${id}/reopen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });
  const data = await res.json();
  return data.data;
}

export async function escalateComplaint(id: string, reason?: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${id}/escalate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason })
  });
  const data = await res.json();
  return data.data;
}

export async function addComment(id: string, text: string, user_name: string) {
  const res = await fetch(`${API_BASE}/complaints/${id}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, user_name })
  });
  const data = await res.json();
  return data.data;
}

export async function sendChatMessage(payload: {
  user_id?: string;
  message?: string;
  media_url?: string;
  location?: { lat: number; lng: number };
}) {
  const res = await fetch(`${API_BASE}/chatbot/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data;
}

export async function fetchFAQs() {
  const res = await fetch(`${API_BASE}/chatbot/faqs`);
  const data = await res.json();
  return data.data;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`);
  const data = await res.json();
  return data.data;
}

export async function assignOfficer(complaint_id: string, officer_id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/admin/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ complaint_id, officer_id })
  });
  const data = await res.json();
  return data.data;
}

export async function fetchOfficers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/auth/users`);
  const data = await res.json();
  return (data.data as User[]).filter((u) => u.role === "FIELD_OFFICER");
}
