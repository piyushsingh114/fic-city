import { Complaint, Category, Ward, Announcement, AdminStats, User } from "../types";
import { clientDb } from "./clientDb";

const API_BASE = "/api";

async function safeFetch<T>(url: string, options?: RequestInit, fallback?: () => T): Promise<T> {
  try {
    const res = await fetch(url, options);
    // If not successful or content-type is not JSON (e.g. Vercel returning index.html)
    const contentType = res.headers.get("content-type");
    if (!res.ok || !contentType || !contentType.includes("application/json")) {
      if (fallback) return fallback();
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    return data.data;
  } catch (err) {
    if (fallback) return fallback();
    throw err;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  return safeFetch(
    `${API_BASE}/categories`,
    undefined,
    () => clientDb.getCategories()
  );
}

export async function fetchWards(): Promise<Ward[]> {
  return safeFetch(
    `${API_BASE}/wards`,
    undefined,
    () => clientDb.getWards()
  );
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  return safeFetch(
    `${API_BASE}/announcements`,
    undefined,
    () => clientDb.getAnnouncements()
  );
}

export async function createAnnouncement(payload: { title: string; message: string; ward_id?: string; priority?: string }): Promise<Announcement> {
  return safeFetch(
    `${API_BASE}/announcements`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    () => clientDb.createAnnouncement(payload)
  );
}

export async function fetchComplaints(params?: Record<string, string>): Promise<Complaint[]> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  return safeFetch(
    `${API_BASE}/complaints${query}`,
    undefined,
    () => clientDb.getComplaints(params)
  );
}

export async function fetchNearbyComplaints(lat: number, lng: number, radius = 800): Promise<Complaint[]> {
  return safeFetch(
    `${API_BASE}/complaints/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
    undefined,
    () => clientDb.getNearbyComplaints(lat, lng, radius)
  );
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  return safeFetch(
    `${API_BASE}/complaints/${id}`,
    undefined,
    () => {
      const found = clientDb.getComplaintById(id);
      if (!found) throw new Error("Not found");
      return found;
    }
  );
}

export async function createComplaint(payload: Partial<Complaint>): Promise<Complaint> {
  return safeFetch(
    `${API_BASE}/complaints`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    () => clientDb.createComplaint(payload)
  );
}

export async function updateComplaintStatus(
  id: string,
  status: string,
  remarks: string,
  officer_id?: string,
  proof_media_url?: string
): Promise<Complaint> {
  return safeFetch(
    `${API_BASE}/complaints/${id}/status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, remarks, officer_id, proof_media_url })
    },
    () => clientDb.updateComplaintStatus(id, status as any, remarks, officer_id, proof_media_url)
  );
}

export async function upvoteComplaint(id: string): Promise<Complaint> {
  return safeFetch(
    `${API_BASE}/complaints/${id}/upvote`,
    { method: "POST" },
    () => clientDb.upvoteComplaint(id)
  );
}

export async function submitFeedback(id: string, rating: number, review: string): Promise<Complaint> {
  return safeFetch(
    `${API_BASE}/complaints/${id}/feedback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, review })
    },
    () => clientDb.submitFeedback(id, rating, review)
  );
}

export async function reopenComplaint(id: string, reason: string): Promise<Complaint> {
  return safeFetch(
    `${API_BASE}/complaints/${id}/reopen`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    },
    () => clientDb.reopenComplaint(id, reason)
  );
}

export async function escalateComplaint(id: string, reason?: string): Promise<Complaint> {
  return safeFetch(
    `${API_BASE}/complaints/${id}/escalate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason })
    },
    () => clientDb.escalateComplaint(id, reason)
  );
}

export async function addComment(id: string, text: string, user_name: string) {
  return safeFetch(
    `${API_BASE}/complaints/${id}/comment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user_name })
    },
    () => clientDb.addComment(id, text, user_name)
  );
}

export async function sendChatMessage(payload: {
  user_id?: string;
  message?: string;
  media_url?: string;
  location?: { lat: number; lng: number };
}) {
  return safeFetch(
    `${API_BASE}/chatbot/message`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    },
    () => clientDb.processChatMessage(payload.message || "", payload.user_id)
  );
}

export async function fetchFAQs() {
  return safeFetch(
    `${API_BASE}/chatbot/faqs`,
    undefined,
    () => [
      {
        question_en: "How do I report a civic problem in Fic City?",
        answer_en: "Click '+ Report Issue' on the home screen or use the AI Assistant. Select category, upload photos, confirm GPS, and submit."
      },
      {
        question_en: "What is the standard SLA resolution time?",
        answer_en: "Emergency manholes & wires: 4 hours. Garbage dumps: 12-24 hours. Potholes & streetlights: 24-48 hours."
      },
      {
        question_en: "What is the 'Me Too' Upvote feature?",
        answer_en: "Instead of filing duplicate complaints for the same pothole or garbage dump, tap 'Me Too' on nearby issues to boost priority."
      }
    ]
  );
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return safeFetch(
    `${API_BASE}/admin/stats`,
    undefined,
    () => clientDb.getAdminStats()
  );
}

export async function assignOfficer(complaint_id: string, officer_id: string): Promise<Complaint> {
  return safeFetch(
    `${API_BASE}/admin/assign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint_id, officer_id })
    },
    () => {
      const c = clientDb.getComplaintById(complaint_id);
      if (!c) throw new Error("Complaint not found");
      const off = clientDb.getOfficers().find(o => o.id === officer_id) || clientDb.getOfficers()[0];
      c.assigned_officer_id = off.id;
      c.officer_name = `${off.full_name} (${off.designation})`;
      return c;
    }
  );
}

export async function fetchOfficers(): Promise<User[]> {
  return safeFetch(
    `${API_BASE}/auth/users`,
    undefined,
    () => clientDb.getOfficers()
  );
}
