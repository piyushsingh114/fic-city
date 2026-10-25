import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LiveLocationPicker } from "../../components/LiveLocationPicker";
import {
  Category,
  Complaint,
  Ward,
  Announcement
} from "../../types";
import {
  fetchCategories,
  fetchComplaints,
  fetchWards,
  fetchAnnouncements,
  createComplaint,
  upvoteComplaint,
  submitFeedback,
  reopenComplaint,
  escalateComplaint,
  addComment
} from "../../services/api";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  Mic,
  ThumbsUp,
  Search,
  ArrowRight,
  Shield,
  Star,
  RefreshCw,
  PhoneCall,
  User,
  LogOut,
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  Hammer,
  Lightbulb,
  Waves,
  CloudRain,
  Dog,
  ShieldAlert,
  Trees,
  Bath,
  Skull,
  HelpCircle
} from "lucide-react";

export const UserDashboard: React.FC = () => {
  const { citizen, citizenToken, logoutCitizen, language } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!citizenToken) {
      navigate("/user/login?redirect=/user/dashboard");
    }
  }, [citizenToken, navigate]);

  const [activeTab, setActiveTab] = useState<"report" | "my_tickets" | "nearby" | "profile">("my_tickets");
  const [categories, setCategories] = useState<Category[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [activeDetailTicket, setActiveDetailTicket] = useState<Complaint | null>(null);

  // New Complaint Form State with Live Location
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationData, setLocationData] = useState({
    latitude: 28.6514,
    longitude: 77.1907,
    address: "DB Gupta Road, Karol Bagh, Delhi - 110005",
    houseFlatNo: "",
    landmark: "",
    accuracyMeters: undefined as number | undefined,
    capturedAt: new Date().toISOString()
  });

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<Complaint | null>(null);

  // Feedback State
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cats, comps, wds, anns] = await Promise.all([
        fetchCategories(),
        fetchComplaints(),
        fetchWards(),
        fetchAnnouncements()
      ]);
      setCategories(cats);
      setComplaints(comps);
      setWards(wds);
      setAnnouncements(anns);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).slice(0, 3 - photos.length).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRecordVoice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setDescription(
        language === "hi"
          ? "यहाँ सड़क पर बहुत गहरा गड्ढा है जिससे रात में गाड़ियां फिसल रही हैं।"
          : "Dangerous open crater on the main lane causing traffic choke and risk of accidents."
      );
    }, 1500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) {
      alert("Please select a problem category.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find((c) => c.id === selectedCatId);
      const newTicket = await createComplaint({
        citizen_id: citizen?.id || "user-cit-1",
        citizen_name: citizen?.full_name || "Citizen",
        citizen_phone: citizen?.phone_number || "9876543210",
        category_id: selectedCatId,
        title: title || `${selectedCategory?.name_en || 'Civic'} Issue`,
        description,
        address: locationData.address,
        house_flat_no: locationData.houseFlatNo,
        landmark: locationData.landmark,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        location_accuracy_meters: locationData.accuracyMeters,
        location_captured_at: locationData.capturedAt,
        is_anonymous: isAnonymous,
        media: photos.map((url, i) => ({
          id: `photo-${Date.now()}-${i}`,
          stage: "BEFORE",
          type: "PHOTO",
          url,
          uploaded_at: new Date().toISOString()
        }))
      });

      setSubmittedTicket(newTicket);
      setComplaints((prev) => [newTicket, ...prev]);
      setSelectedCatId("");
      setTitle("");
      setDescription("");
      setPhotos([]);
    } catch (err) {
      console.error(err);
      alert("Submission failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await upvoteComplaint(id);
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (activeDetailTicket?.id === id) setActiveDetailTicket(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFeedbackSubmit = async (complaintId: string) => {
    try {
      const updated = await submitFeedback(complaintId, rating, feedbackText);
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      setActiveDetailTicket(updated);
      setFeedbackText("");
      alert("Rating submitted successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleReopen = async (complaintId: string) => {
    if (!reopenReason.trim()) {
      alert("Please enter reason for reopening.");
      return;
    }
    try {
      const updated = await reopenComplaint(complaintId, reopenReason);
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      setActiveDetailTicket(updated);
      setReopenReason("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleEscalate = async (complaintId: string) => {
    try {
      const updated = await escalateComplaint(complaintId, "Citizen requested urgent supervisor escalation");
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      setActiveDetailTicket(updated);
      alert("Complaint escalated to Zonal Municipal Commissioner!");
    } catch (e) {
      console.error(e);
    }
  };

  // Category Icon mapper
  const getCategoryIcon = (code: string) => {
    switch (code) {
      case "GARBAGE": return <Trash2 className="w-5 h-5 text-amber-600" />;
      case "POTHOLE": return <Hammer className="w-5 h-5 text-orange-600" />;
      case "STREETLIGHT": return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case "DRAINAGE": return <Waves className="w-5 h-5 text-blue-600" />;
      case "WATERLOG": return <CloudRain className="w-5 h-5 text-sky-600" />;
      case "ANIMALS": return <Dog className="w-5 h-5 text-emerald-600" />;
      case "ENCROACHMENT": return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case "PARKS": return <Trees className="w-5 h-5 text-green-600" />;
      case "TOILETS": return <Bath className="w-5 h-5 text-indigo-600" />;
      case "DEAD_ANIMAL": return <Skull className="w-5 h-5 text-purple-600" />;
      default: return <HelpCircle className="w-5 h-5 text-teal-600" />;
    }
  };

  const myComplaints = complaints.filter(
    (c) => c.citizen_id === citizen?.id || c.citizen_phone === citizen?.phone_number
  );

  const displayedList = (activeTab === "my_tickets" ? myComplaints : complaints).filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.complaint_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Citizen Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-sky-900 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
              Verified Citizen Account
            </span>
            <span className="text-xs text-emerald-200">Delhi Ward 64</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">
            Welcome, {citizen?.full_name || "Citizen"}!
          </h1>
          <p className="text-xs text-emerald-100 mt-0.5">
            Mobile: {citizen?.phone_number} {citizen?.email ? `• ${citizen.email}` : ""}
          </p>
        </div>

        <button
          onClick={() => {
            setSubmittedTicket(null);
            setActiveTab("report");
          }}
          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-400/20 flex items-center gap-2 active:scale-95 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab("my_tickets")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "my_tickets"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <span>My Complaints</span>
          <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
            {myComplaints.length}
          </span>
        </button>

        <button
          onClick={() => {
            setSubmittedTicket(null);
            setActiveTab("report");
          }}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "report"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Raise Complaint (Live GPS)</span>
        </button>

        <button
          onClick={() => setActiveTab("nearby")}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === "nearby"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Nearby Issues & Upvotes</span>
        </button>
      </div>

      {/* TAB 1: RAISE COMPLAINT WITH LIVE LOCATION */}
      {activeTab === "report" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {submittedTicket ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Complaint Registered Successfully!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Assigned to Ward Junior Engineer with high-accuracy GPS coordinates. Track updates in real time.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-sm mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Complaint ID:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {submittedTicket.complaint_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold truncate max-w-[200px]">{submittedTicket.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Officer:</span>
                  <span className="font-bold">{submittedTicket.officer_name}</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveDetailTicket(submittedTicket);
                    setSubmittedTicket(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  View Live Timeline
                </button>
                <button
                  onClick={() => {
                    setSubmittedTicket(null);
                    setActiveTab("my_tickets");
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Go to My Complaints
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Report a Civic Grievance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select issue category, capture live location, and attach photos
                </p>
              </div>

              {/* Category Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  1. Select Issue Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedCatId(c.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        selectedCatId === c.id
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {getCategoryIcon(c.code)}
                      <span className="text-[11px] line-clamp-1">{language === "hi" ? c.name_hi : c.name_en}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Evidence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  2. Photo Evidence (Up to 3 Photos) *
                </label>
                <div className="flex flex-wrap gap-3">
                  {photos.map((src, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-300">
                      <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500">
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] font-bold">Add Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Live Location Picker Component with Draggable Map Pin */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <LiveLocationPicker
                  value={locationData}
                  onChange={setLocationData}
                />
              </div>

              {/* Problem Description + Voice Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    4. Description & Voice Note
                  </label>
                  <button
                    type="button"
                    onClick={handleRecordVoice}
                    className={`text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                      isRecording ? "bg-rose-500 text-white animate-pulse" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {isRecording ? "Recording speech..." : "Speak Description"}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe severity, duration, or any landmark details..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="anon-check"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="anon-check" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Submit Anonymously (Do not show my mobile number publicly)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Submit Grievance to Municipal Board</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2 & 3: COMPLAINTS LIST */}
      {(activeTab === "my_tickets" || activeTab === "nearby") && (
        <div className="space-y-4">
          {/* Filter Pills & Search */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {(["ALL", "SUBMITTED", "IN_PROGRESS", "RESOLVED"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === status
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket # or area..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Cards Feed */}
          <div className="space-y-3">
            {displayedList.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No complaints found under this view.
              </div>
            ) : (
              displayedList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveDetailTicket(item)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm cursor-pointer transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-600">
                          {item.complaint_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.category_name}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                        {item.title}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        item.status === "RESOLVED"
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                          : item.status === "IN_PROGRESS"
                          ? "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1 truncate max-w-[280px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleUpvote(item.id, e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Me Too ({item.upvotes_count})</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DETAILED COMPLAINT MODAL (With Interactive Map & Photos) */}
      {activeDetailTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-emerald-600">
                    {activeDetailTicket.complaint_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                    {activeDetailTicket.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {activeDetailTicket.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailTicket(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            {/* Location & Reverse Geocoded Address Details */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{activeDetailTicket.address}</p>
                  {activeDetailTicket.landmark && (
                    <p className="text-[11px] text-slate-500">Landmark: {activeDetailTicket.landmark}</p>
                  )}
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    GPS: {activeDetailTicket.latitude.toFixed(5)}, {activeDetailTicket.longitude.toFixed(5)}
                  </p>
                </div>
              </div>
            </div>

            {/* Before vs After Photos */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Photo Evidence:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Citizen Photo (Before)</span>
                  {activeDetailTicket.media[0] ? (
                    <img
                      src={activeDetailTicket.media[0].url}
                      alt="Before"
                      className="w-full h-40 object-cover rounded-2xl border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                      No Photo
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-600">Officer Proof (After)</span>
                  {activeDetailTicket.media.find((m) => m.stage === "AFTER") ? (
                    <img
                      src={activeDetailTicket.media.find((m) => m.stage === "AFTER")?.url}
                      alt="After"
                      className="w-full h-40 object-cover rounded-2xl border-2 border-emerald-500"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs p-3 text-center">
                      Pending resolution photo from field officer
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Resolution Timeline:</h4>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 pl-6">
                {activeDetailTicket.timeline.map((t, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white dark:ring-slate-900" />
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>{t.status}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{t.remarks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback / Rating flow if resolved */}
            {activeDetailTicket.status === "RESOLVED" && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Rate Resolution Service:</h4>
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="p-1">
                      <Star className={`w-5 h-5 ${rating >= s ? "fill-current" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedbackSubmit(activeDetailTicket.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    Submit Rating
                  </button>
                  <button
                    onClick={() => {
                      const r = prompt("Why are you reopening this complaint?");
                      if (r) handleReopen(activeDetailTicket.id);
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold"
                  >
                    Not Satisfied? Reopen
                  </button>
                </div>
              </div>
            )}

            {/* Escalate button if pending */}
            {activeDetailTicket.status !== "RESOLVED" && (
              <button
                onClick={() => handleEscalate(activeDetailTicket.id)}
                className="w-full py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Escalate to Zonal Municipal Commissioner</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
