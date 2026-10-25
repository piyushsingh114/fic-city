# 🏛️ Fic City — Civic Complaint & Municipal Resolution System
> **Inspired by MCD 311 (Delhi Municipal Corporation) & Swachhata**

A complete, production-grade civic grievance redressal ecosystem enabling citizens to report civic problems with photos and GPS, field officers to resolve tickets with photo proof, municipal commissioners to track SLA adherence, and an AI municipal assistant ("Fic City Assistant") that files complaints and answers civic queries conversationally in English and Hindi.

---

## 🚀 Quick Start (Run Locally in VS Code)

### 1. Open in VS Code
Open your VS Code and navigate to this folder:
```bash
code C:\Users\user\.gemini\antigravity\scratch\fic-city
```
*(Or open VS Code -> File -> Open Folder -> `C:\Users\user\.gemini\antigravity\scratch\fic-city`)*

### 2. Launch Everything with 1 Command
Run in your VS Code terminal:
```bash
node start-dev.js
```
*(Alternatively, on Windows, just double-click **`start.bat`** or run `npm run dev`)*

This starts both:
- **Web App (Citizen, Officer & Admin):** [http://localhost:3000](http://localhost:3000)
- **Municipal Backend API & Sockets:** [http://localhost:5000](http://localhost:5000)

---

## 📱 User Roles & Walkthrough

Use the **Role Switcher** in the top navigation bar to test all 3 personas instantly:

### 1. 📱 Citizen App (with Mobile Phone Frame Toggle)
- **Home Screen:** 12 Civic Categories, emergency municipal announcements, recent complaints, and nearby issues in your ward.
- **Raise Complaint:**
  - Select from 12 civic categories (Garbage, Potholes, Streetlights, Drainage, Waterlogging, Stray Animals, etc.).
  - Upload up to 3 photos with instant preview.
  - Auto-detect GPS button and landmark input.
  - Description with speech-to-text / voice simulation.
  - "Submit Anonymously" toggle to protect citizen phone numbers.
  - Instant ticket generation: `FC-2026-000105`.
- **My Complaints & Live Tracking:**
  - Filter by Open, In Progress, Resolved.
  - Interactive status timeline (Submitted ➔ Assigned ➔ In Progress ➔ Resolved).
  - Side-by-side **Before vs After Photo Proof Comparison**!
  - 1-to-5 star citizen satisfaction rating.
  - "Reopen Complaint" button if resolution is unsatisfactory.
  - "Escalate to Municipal Commissioner" button if SLA deadline is nearing.
- **"Me Too" / Upvote:** Prevent duplicate complaints by upvoting existing nearby issues.
- **Ward Directory:** Ward 64 (Karol Bagh), Ward 23 (Rohini), Ward 102 (Civil Lines), Ward 145 (Lajpat Nagar), etc., with councillor names and phone numbers.
- **Language Switch:** Seamless toggle between English and हिन्दी.

### 2. 👷 Field Officer Portal
- **Officer Profile:** e.g., *Rajesh Verma, Junior Engineer - Sanitation (MCD-SAN-1044)*.
- **Task Queue:** View assigned complaints with priority badges (Critical, High, Medium) and live SLA countdown.
- **Turn-by-Turn Directions:** 1-click Google Maps navigation to complaint site.
- **Update Status:**
  - Mark *In Progress* (dispatches tipper truck/maintenance crew).
  - Mark *Resolved* with **mandatory "After Resolution" Photo Proof** upload.
  - Add official field remarks.

### 3. 🏛️ Municipal Administrator Command Center
- **Executive KPIs:** Total Tickets, Resolved %, In-Progress, Overdue (SLA Breached), SLA Compliance Rate (%), Citizen Rating.
- **Category Volume Breakdown:** Progress bars showing problem distribution across Delhi.
- **Ward Performance Leaderboard:** Ticket density across zones.
- **Grievance Triage & Reassignment:** 1-click manual reassignment of complaints to available officers.
- **Emergency Broadcast Composer:** Send real-time push alerts/SMS to citizens in specific wards.
- **1-Click CSV Export:** Download full ticket history for reporting.

### 4. 🤖 "Fic City Assistant" (AI Chatbot)
Click the floating green robot icon on the bottom right of the screen:
- **Conversational Filing:** Say *"There is a huge pothole outside Karol Bagh metro"* or *"यहाँ कचरे का ढेर लगा है"*. The bot identifies the category, asks for the location, confirms details, and files the complaint!
- **Ticket Tracking:** Type any ticket number (e.g. `FC-2026-000101` or `track my complaint`) to see live progress directly in chat.
- **RAG Knowledge Base:** Instant answers to municipal FAQs, standard SLA hours, escalation rules, and councillor contacts.
- **Duplicate Prevention:** Detects if a similar complaint exists within 400m and suggests upvoting instead.
- **Bilingual & Voice:** Converses naturally in English, Hindi (हिंदी), and Hinglish.

---

## 🗂️ Project Structure

```
fic-city/
├── backend/                  # Node.js + Express + Socket.IO REST API
│   ├── src/
│   │   ├── server.js         # HTTP + WebSockets server
│   │   ├── routes/api.js     # Auth, Complaints, Admin, AI endpoints
│   │   ├── services/         # aiChatbotService.js (NLP & Tool Calling)
│   │   └── data/             # dbStore.js & mockData.js (Delhi MCD seed)
│   └── uploads/              # Stored complaint evidence photos
│
├── frontend/                 # React + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx           # App root with Phone Mockup frame
│   │   ├── components/       # Header, AiChatbot modal
│   │   ├── views/            # CitizenView, OfficerView, AdminView
│   │   └── services/api.ts   # API client
│   └── package.json
│
├── mobile-flutter/           # Native Flutter Mobile Codebase (Android & iOS)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/complaint.dart
│   │   └── screens/          # HomeScreen, RaiseComplaintScreen, ChatbotScreen
│   └── pubspec.yaml
│
├── database/
│   └── schema.sql            # Complete PostgreSQL + PostGIS + pgvector DDL
│
├── start-dev.js              # 1-click concurrent dev server launcher
├── start.bat                 # Windows batch launcher
└── start.ps1                 # PowerShell launcher
```

---

## 🛠️ Testing the APIs Directly (Curl / Postman)

- **Get all complaints:**
  `GET http://localhost:5000/api/complaints`
- **Nearby complaints within 1km:**
  `GET http://localhost:5000/api/complaints/nearby?lat=28.6514&lng=77.1907&radius=1000`
- **File a complaint:**
  `POST http://localhost:5000/api/complaints`
- **Chat with AI Assistant:**
  `POST http://localhost:5000/api/chatbot/message`
  Body: `{"message": "There is a deep pothole near my house"}`
- **Admin KPI stats:**
  `GET http://localhost:5000/api/admin/stats`
