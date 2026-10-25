import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Mic,
  Camera,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  PhoneCall,
  Loader2
} from "lucide-react";
import { sendChatMessage, upvoteComplaint } from "../services/api";
import { Complaint } from "../types";

interface Message {
  id: string;
  sender: "USER" | "BOT";
  text: string;
  action?: string;
  data?: any;
  quickReplies?: string[];
  satisfaction?: boolean | null;
  timestamp: string;
}

interface AiChatbotProps {
  language: "en" | "hi";
  onOpenComplaint?: (id: string) => void;
  onComplaintCreated?: (newTicket: Complaint) => void;
}

export const AiChatbot: React.FC<AiChatbotProps> = ({
  language,
  onOpenComplaint,
  onComplaintCreated
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "BOT",
      text:
        language === "hi"
          ? "नमस्ते! मैं आपका **फिक सिटी सहायक** (Fic City Assistant) हूँ।\n\nआप मुझसे बोलकर या लिखकर शिकायत दर्ज कर सकते हैं (जैसे: *'मेरे घर के पास बड़ा गड्ढा है'* या *'कचरे का ढेर लगा है'*), अपनी शिकायत ट्रैक कर सकते हैं, या वार्ड की जानकारी पूछ सकते हैं।"
          : "Hello! I am your **Fic City Assistant**.\n\nYou can report civic issues by typing or voice (e.g. *'huge pothole near metro'*, *'garbage overflowing'*), track existing complaints, or ask about your ward & SLAs.",
      quickReplies:
        language === "hi"
          ? ["शिकायत दर्ज करें", "शिकायत ट्रैक करें", "वार्ड और पार्षद जानकारी", "हेल्पलाइन नंबर"]
          : ["Report an Issue", "Track My Complaint", "Find My Ward", "Helpline Numbers"],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() && !selectedPhoto) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "USER",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendChatMessage({
        message: textToSend,
        media_url: selectedPhoto || undefined,
        location: { lat: 28.6514, lng: 77.1907 }
      });

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "BOT",
        text: res.text,
        action: res.action,
        data: res.data,
        quickReplies: res.quickReplies,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botMsg]);

      // If a complaint was created via bot
      if (res.action === "COMPLAINT_CREATED" && res.data && onComplaintCreated) {
        onComplaintCreated(res.data);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "BOT",
          text:
            language === "hi"
              ? "क्षमा करें, सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें या हेल्पलाइन 155304 पर कॉल करें।"
              : "Sorry, I had trouble reaching the municipal server. Please try again or dial helpline 155304.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsLoading(false);
      setSelectedPhoto(null);
    }
  };

  const handleVoiceSimulate = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const simulatedVoices =
        language === "hi"
          ? "करोल बाग मार्केट के पास सड़क पर बहुत गहरा गड्ढा है, जिससे ट्रैफिक रुक रहा है"
          : "There is an overflowing garbage dump near Karol Bagh metro station blocking traffic";
      setInput(simulatedVoices);
    }, 1500);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeedback = (msgId: string, rating: boolean) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, satisfaction: rating } : m))
    );
  };

  const handleUpvote = async (complaintId: string) => {
    try {
      await upvoteComplaint(complaintId);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: "BOT",
          text:
            language === "hi"
              ? "✅ धन्यवाद! आपका 'Me Too' अपवोट दर्ज कर लिया गया है। इस शिकायत की प्राथमिकता बढ़ा दी गई है।"
              : "✅ Thank you! Your 'Me Too' upvote has been registered, increasing this ticket's priority.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Floating Chatbot Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold px-4 py-3 rounded-full shadow-xl shadow-emerald-700/30 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-emerald-700 animate-ping" />
          </div>
          <span className="text-sm">
            {language === "hi" ? "फिक सिटी सहायक" : "Fic City AI"}
          </span>
          <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-mono uppercase">
            Online
          </span>
        </button>
      )}

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-4 py-3.5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm leading-tight">
                    {language === "hi" ? "फिक सिटी सहायक" : "Fic City Assistant"}
                  </h3>
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300/30 font-medium">
                    AI Agent
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  {language === "hi" ? "दिल्ली नगर निगम सहायता सेवा" : "24/7 Civic Resolution Copilot"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "USER" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === "USER"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {/* Visual card for Complaint Details */}
                  {msg.action === "COMPLAINT_DETAILS" && msg.data && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-emerald-700">
                          {msg.data.complaint_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {msg.data.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800">
                        {msg.data.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{msg.data.address}</span>
                      </div>
                      {onOpenComplaint && (
                        <button
                          onClick={() => {
                            onOpenComplaint(msg.data.id);
                            setIsOpen(false);
                          }}
                          className="w-full mt-1 py-1.5 text-center text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Full Details & Photos
                        </button>
                      )}
                    </div>
                  )}

                  {/* Visual card for Newly Created Complaint */}
                  {msg.action === "COMPLAINT_CREATED" && msg.data && (
                    <div className="mt-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Ticket Registered</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-emerald-100 text-[11px] space-y-1">
                        <div>
                          <strong>ID:</strong> {msg.data.complaint_number}
                        </div>
                        <div>
                          <strong>Ward:</strong> {msg.data.ward_name}
                        </div>
                        <div>
                          <strong>Officer:</strong> {msg.data.officer_name}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                          <Clock className="w-3 h-3" />
                          Target: {new Date(msg.data.sla_deadline).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ward Info Card */}
                  {msg.action === "WARD_INFO" && msg.data && (
                    <div className="mt-2.5 p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-slate-700 space-y-1">
                      <p className="text-[11px] font-bold text-sky-900">
                        Councillor: {msg.data.councillor_name}
                      </p>
                      <a
                        href={`tel:${msg.data.councillor_phone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-sky-700 font-bold underline"
                      >
                        <PhoneCall className="w-3 h-3" /> {msg.data.councillor_phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Timestamp & Feedback Buttons for Bot */}
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  {msg.sender === "BOT" && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        onClick={() => handleFeedback(msg.id, true)}
                        className={`p-0.5 hover:text-emerald-600 transition-colors ${
                          msg.satisfaction === true ? "text-emerald-600 font-bold" : ""
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, false)}
                        className={`p-0.5 hover:text-rose-600 transition-colors ${
                          msg.satisfaction === false ? "text-rose-600 font-bold" : ""
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Reply Suggestion Chips */}
                {msg.quickReplies && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.quickReplies.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(chip)}
                        className="text-[11px] font-medium bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-300 px-2.5 py-1 rounded-full shadow-xs transition-all active:scale-95"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>{language === "hi" ? "सहायक टाइप कर रहा है..." : "Fic City AI is thinking..."}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Photo Preview if attached */}
          {selectedPhoto && (
            <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={selectedPhoto}
                  alt="Upload preview"
                  className="w-10 h-10 object-cover rounded-lg border border-slate-300 shadow-xs"
                />
                <span className="text-xs text-slate-600 font-medium">Photo attached</span>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-xs text-rose-600 hover:underline font-bold px-2 py-1"
              >
                Remove
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              {/* Photo Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                title="Attach photo"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* Voice Input Button */}
              <button
                type="button"
                onClick={handleVoiceSimulate}
                className={`p-2 rounded-xl transition-all ${
                  isRecording
                    ? "bg-rose-500 text-white animate-pulse"
                    : "text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                }`}
                title="Speak in Hindi/English"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={
                  isRecording
                    ? language === "hi"
                      ? "सुन रहा हूँ... बोलिए"
                      : "Listening... speak now"
                    : language === "hi"
                    ? "समस्या बताएं या शिकायत ID लिखें..."
                    : "Describe issue or enter Complaint ID..."
                }
                className="flex-1 bg-slate-100 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && !selectedPhoto)}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
