import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { CitizenView } from "./views/CitizenView";
import { OfficerView } from "./views/OfficerView";
import { AdminView } from "./views/AdminView";
import { AiChatbot } from "./components/AiChatbot";
import { UserRole, Complaint } from "./types";
import { io } from "socket.io-client";

export const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>("CITIZEN");
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  useEffect(() => {
    // Connect to backend socket
    const socket = io("http://localhost:5000");

    socket.on("complaint:new", (newComplaint: Complaint) => {
      console.log("New complaint event:", newComplaint);
    });

    socket.on("complaint:updated", (updated: Complaint) => {
      console.log("Complaint updated event:", updated);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header & Role Switcher */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isMobileFrame={isMobileFrame}
        onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {currentRole === "CITIZEN" ? (
          isMobileFrame ? (
            /* Smartphone device frame preview */
            <div className="py-6 px-4 w-full flex items-center justify-center">
              <div className="w-[400px] h-[820px] bg-slate-900 rounded-[50px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col overflow-hidden ring-1 ring-slate-900/10">
                {/* Simulated Phone Notch & Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-slate-800 mr-2" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-950" />
                </div>

                {/* Inner Mobile Screen */}
                <div className="w-full h-full bg-slate-100 rounded-[40px] overflow-y-auto overflow-x-hidden flex flex-col relative pt-8">
                  <CitizenView
                    language={language}
                    selectedComplaintId={selectedComplaintId}
                    onClearSelectedComplaint={() => setSelectedComplaintId(null)}
                  />
                  {/* Embedded Chatbot inside mobile screen */}
                  <AiChatbot
                    language={language}
                    onOpenComplaint={(id) => setSelectedComplaintId(id)}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Fullscreen Citizen View */
            <div className="w-full">
              <CitizenView
                language={language}
                selectedComplaintId={selectedComplaintId}
                onClearSelectedComplaint={() => setSelectedComplaintId(null)}
              />
              <AiChatbot
                language={language}
                onOpenComplaint={(id) => setSelectedComplaintId(id)}
              />
            </div>
          )
        ) : currentRole === "FIELD_OFFICER" ? (
          /* Field Officer Portal */
          <div className="w-full">
            <OfficerView language={language} />
          </div>
        ) : (
          /* Municipal Administrator Dashboard */
          <div className="w-full">
            <AdminView />
          </div>
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          <strong>Fic City (MCD 311 Grievance System)</strong> • Municipal Corporation of Delhi •
          Smart Civic Governance
        </p>
      </footer>
    </div>
  );
};
