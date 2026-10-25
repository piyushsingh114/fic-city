import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { LandingPage } from "./pages/LandingPage";
import { UserRegister } from "./pages/user/UserRegister";
import { UserLogin } from "./pages/user/UserLogin";
import { ForgotPassword } from "./pages/user/ForgotPassword";
import { UserDashboard } from "./pages/user/UserDashboard";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AiChatbot } from "./components/AiChatbot";
import { io } from "socket.io-client";
import { Complaint } from "./types";

const AppContent: React.FC = () => {
  const location = useLocation();
  const { language } = useAuth();
  const isAdminDashboard = location.pathname.startsWith("/admin/dashboard");

  useEffect(() => {
    // Connect to backend socket if running locally
    try {
      const socket = io("http://localhost:5000", {
        autoConnect: false,
        reconnectionAttempts: 2
      });

      socket.connect();

      socket.on("complaint:new", (newComplaint: Complaint) => {
        console.log("Socket: New grievance reported:", newComplaint.complaint_number);
      });

      socket.on("complaint:updated", (updated: Complaint) => {
        console.log("Socket: Grievance updated:", updated.complaint_number);
      });

      return () => {
        socket.disconnect();
      };
    } catch {
      // Ignore socket connection errors in production / Vercel
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Universal Top Header with Brand Logo, Language and Theme controls */}
      <Navbar />

      {/* Main Routed View */}
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Citizen Authentication & Grievance Portal */}
          <Route path="/user/register" element={<UserRegister />} />
          <Route path="/user/login" element={<UserLogin />} />
          <Route path="/user/forgot-password" element={<ForgotPassword />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />

          {/* Secure Municipal Staff & Admin Portal */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Fallback to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating Fic City Assistant on public & citizen screens */}
      {!isAdminDashboard && (
        <AiChatbot language={language} />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};
