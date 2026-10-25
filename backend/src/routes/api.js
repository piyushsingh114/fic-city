import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { dbStore } from "../data/dbStore.js";
import { aiChatbotService } from "../services/aiChatbotService.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `fic-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`);
  }
});
const upload = multer({ storage });

// ============================================================================
// 1. AUTHENTICATION & USERS
// ============================================================================
router.post("/auth/send-otp", (req, res) => {
  const { phone_number } = req.body;
  if (!phone_number) {
    return res.status(400).json({ success: false, message: "Phone number required" });
  }
  // In demo/dev mode, OTP is always 123456
  return res.json({
    success: true,
    message: "OTP sent successfully to " + phone_number,
    demo_otp: "123456"
  });
});

router.post("/auth/verify-otp", (req, res) => {
  const { phone_number, otp, role = "CITIZEN" } = req.body;
  
  if (otp !== "123456" && otp !== "000000") {
    return res.status(400).json({ success: false, message: "Invalid OTP. Use 123456 for demo." });
  }

  // Find or create user
  let user = dbStore.users.find(u => u.phone_number === phone_number);
  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      phone_number,
      full_name: role === "CITIZEN" ? "Citizen User" : "Officer User",
      role: role,
      preferred_language: "en",
      created_at: new Date().toISOString()
    };
    dbStore.users.push(user);
  }

  // Simulated JWT Token
  const token = `jwt_fic_city_${user.id}_${Date.now()}`;

  return res.json({
    success: true,
    token,
    user
  });
});

router.get("/auth/users", (req, res) => {
  res.json({ success: true, data: dbStore.users });
});

// ============================================================================
// 2. COMPLAINTS & TRACKING
// ============================================================================
router.get("/complaints", (req, res) => {
  const list = dbStore.getComplaints(req.query);
  res.json({ success: true, count: list.length, data: list });
});

router.get("/complaints/nearby", (req, res) => {
  const lat = parseFloat(req.query.lat) || 28.6514;
  const lng = parseFloat(req.query.lng) || 77.1907;
  const radius = parseInt(req.query.radius, 10) || 1000; // 1km default
  const nearby = dbStore.getNearbyComplaints(lat, lng, radius);
  res.json({ success: true, count: nearby.length, data: nearby });
});

router.get("/complaints/:id", (req, res) => {
  const complaint = dbStore.getComplaintById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }
  res.json({ success: true, data: complaint });
});

router.post("/complaints", (req, res) => {
  try {
    const complaint = dbStore.createComplaint(req.body);
    // Broadcast via socket.io if attached
    if (req.app.get("io")) {
      req.app.get("io").emit("complaint:new", complaint);
    }
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/complaints/:id/status", (req, res) => {
  const { status, remarks, officer_id, proof_media_url } = req.body;
  const updated = dbStore.updateComplaintStatus(req.params.id, status, remarks, officer_id, proof_media_url);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }
  if (req.app.get("io")) {
    req.app.get("io").emit("complaint:updated", updated);
  }
  res.json({ success: true, data: updated });
});

router.post("/complaints/:id/upvote", (req, res) => {
  const updated = dbStore.addUpvote(req.params.id);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }
  if (req.app.get("io")) {
    req.app.get("io").emit("complaint:upvoted", { id: req.params.id, count: updated.upvotes_count });
  }
  res.json({ success: true, data: updated });
});

router.post("/complaints/:id/feedback", (req, res) => {
  const { rating, review } = req.body;
  const updated = dbStore.addFeedback(req.params.id, rating, review);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }
  res.json({ success: true, data: updated });
});

router.post("/complaints/:id/reopen", (req, res) => {
  const { reason } = req.body;
  const updated = dbStore.reopenComplaint(req.params.id, reason);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }
  if (req.app.get("io")) {
    req.app.get("io").emit("complaint:updated", updated);
  }
  res.json({ success: true, data: updated });
});

router.post("/complaints/:id/escalate", (req, res) => {
  const { reason } = req.body;
  const updated = dbStore.escalateComplaint(req.params.id, reason);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }
  if (req.app.get("io")) {
    req.app.get("io").emit("complaint:updated", updated);
  }
  res.json({ success: true, data: updated });
});

router.post("/complaints/:id/comment", (req, res) => {
  const { text, user_name } = req.body;
  const comment = dbStore.addComment(req.params.id, text, user_name);
  if (!comment) {
    return res.status(404).json({ success: false, message: "Complaint not found" });
  }
  res.json({ success: true, data: comment });
});

// ============================================================================
// 3. MASTER METADATA (CATEGORIES, WARDS, DEPARTMENTS, ANNOUNCEMENTS)
// ============================================================================
router.get("/categories", (req, res) => {
  res.json({ success: true, data: dbStore.categories });
});

router.get("/wards", (req, res) => {
  res.json({ success: true, data: dbStore.wards });
});

router.get("/departments", (req, res) => {
  res.json({ success: true, data: dbStore.departments });
});

router.get("/announcements", (req, res) => {
  res.json({ success: true, data: dbStore.announcements });
});

router.post("/announcements", (req, res) => {
  const { title, message, ward_id, priority = "MEDIUM" } = req.body;
  const ward = dbStore.wards.find(w => w.id === ward_id);
  const newAnn = {
    id: `ann-${Date.now()}`,
    ward_id: ward_id || null,
    ward_name: ward ? ward.name_en : "All Delhi Wards",
    title,
    message,
    priority,
    created_at: new Date().toISOString()
  };
  dbStore.announcements.unshift(newAnn);
  if (req.app.get("io")) {
    req.app.get("io").emit("announcement:new", newAnn);
  }
  res.status(201).json({ success: true, data: newAnn });
});

// ============================================================================
// 4. AI CHATBOT ASSISTANT
// ============================================================================
router.post("/chatbot/message", async (req, res) => {
  try {
    const { user_id = "user-cit-1", message, media_url, location } = req.body;
    if (!message && !media_url) {
      return res.status(400).json({ success: false, message: "Message or image is required" });
    }
    const reply = await aiChatbotService.processMessage({
      userId: user_id,
      message: message || "Look at this image",
      mediaUrl: media_url,
      location
    });
    res.json({ success: true, data: reply });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/chatbot/faqs", (req, res) => {
  res.json({ success: true, data: dbStore.faqs });
});

router.post("/chatbot/faqs", (req, res) => {
  const { question_en, question_hi, answer_en, answer_hi } = req.body;
  const newFaq = {
    id: `faq-${Date.now()}`,
    question_en,
    question_hi,
    answer_en,
    answer_hi
  };
  dbStore.faqs.push(newFaq);
  res.status(201).json({ success: true, data: newFaq });
});

// ============================================================================
// 5. ADMIN ANALYTICS & TRIAGE
// ============================================================================
router.get("/admin/stats", (req, res) => {
  const stats = dbStore.getAdminStats();
  res.json({ success: true, data: stats });
});

router.post("/admin/assign", (req, res) => {
  const { complaint_id, officer_id } = req.body;
  const complaint = dbStore.getComplaintById(complaint_id);
  const officer = dbStore.users.find(u => u.id === officer_id);
  if (!complaint || !officer) {
    return res.status(404).json({ success: false, message: "Complaint or officer not found" });
  }
  complaint.assigned_officer_id = officer.id;
  complaint.officer_name = `${officer.full_name} (${officer.designation || 'Officer'})`;
  complaint.officer_phone = officer.phone_number;
  complaint.status = "ASSIGNED";
  complaint.timeline.push({
    status: "ASSIGNED",
    timestamp: new Date().toISOString(),
    remarks: `Reassigned to ${officer.full_name} by Administrator`
  });
  if (req.app.get("io")) {
    req.app.get("io").emit("complaint:updated", complaint);
  }
  res.json({ success: true, data: complaint });
});

// CSV Export
router.get("/admin/export-csv", (req, res) => {
  const list = dbStore.complaints;
  let csv = "ComplaintNumber,Title,Category,Ward,Status,Priority,Officer,CreatedDate,SLADeadline\n";
  for (const c of list) {
    csv += `"${c.complaint_number}","${c.title.replace(/"/g, '""')}","${c.category_name}","${c.ward_name}","${c.status}","${c.priority}","${c.officer_name || ''}","${c.created_at}","${c.sla_deadline}"\n`;
  }
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=fic-city-complaints.csv");
  res.send(csv);
});

// ============================================================================
// 6. PHOTO / MEDIA UPLOAD
// ============================================================================
router.post("/upload", upload.single("media"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

export default router;
