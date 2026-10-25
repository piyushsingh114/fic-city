import React, { useState, useEffect } from "react";
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
  Filter,
  ArrowRight,
  Shield,
  ChevronRight,
  MessageSquare,
  Star,
  RefreshCw,
  PhoneCall,
  User,
  Sparkles,
  ChevronLeft,
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
import {
  Category,
  Complaint,
  Ward,
  Announcement,
  ComplaintStatus
} from "../types";
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
} from "../services/api";

interface CitizenViewProps {
  language: "en" | "hi";
  onOpenBot?: () => void;
  selectedComplaintId?: string | null;
  onClearSelectedComplaint?: () => void;
}

export const CitizenView: React.FC<CitizenViewProps> = ({
  language,
  onOpenBot,
  selectedComplaintId,
  onClearSelectedComplaint
}) => {
  const [activeTab, setActiveTab] = useState<"home" | "report" | "my_tickets" | "map" | "ward">("home");
  const [categories, setCategories] = useState<Category[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [activeDetailTicket, setActiveDetailTicket] = useState<Complaint | null>(null);

  // New Complaint Form State
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("Karol Bagh, DB Gupta Road, Delhi");
  const [landmark, setLandmark] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<Complaint | null>(null);

  // Feedback State
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [commentInput, setCommentInput] = useState("");

  // Filters
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

      if (selectedComplaintId) {
        const found = comps.find((c) => c.id === selectedComplaintId || c.complaint_number === selectedComplaintId);
        if (found) setActiveDetailTicket(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedComplaintId && complaints.length > 0) {
      const found = complaints.find(
        (c) => c.id === selectedComplaintId || c.complaint_number === selectedComplaintId
      );
      if (found) {
        setActiveDetailTicket(found);
      }
    }
  }, [selectedComplaintId, complaints]);

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
          ? "यहाँ गली में दो दिनों से कचरा नहीं उठा है और बदबू आ रही है।"
          : "Overflowing garbage dump outside market creating severe stench and blockage."
      );
    }, 1500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) {
      alert(language === "hi" ? "कृपया एक श्रेणी चुनें" : "Please select a category");
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find((c) => c.id === selectedCatId);
      const newTicket = await createComplaint({
        category_id: selectedCatId,
        title: title || `${selectedCategory?.name_en || 'Civic'} Issue`,
        description,
        address,
        landmark,
        latitude: 28.6514,
        longitude: 77.1907,
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
      // Reset form
      setSelectedCatId("");
      setTitle("");
      setDescription("");
      setPhotos([]);
      setLandmark("");
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
      alert(language === "hi" ? "आपकी रेटिंग दर्ज कर ली गई है!" : "Feedback submitted successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleReopen = async (complaintId: string) => {
    if (!reopenReason.trim()) {
      alert("Please state why resolution was unsatisfactory.");
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
      alert(language === "hi" ? "शिकायत उच्च अधिकारी को एस्केलेट कर दी गई है!" : "Complaint escalated to Zonal Commissioner!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (complaintId: string) => {
    if (!commentInput.trim()) return;
    try {
      await addComment(complaintId, commentInput, "Citizen");
      const updated = { ...activeDetailTicket! };
      updated.comments.push({
        id: `comm-${Date.now()}`,
        user: "Citizen",
        text: commentInput,
        timestamp: new Date().toISOString()
      });
      setActiveDetailTicket(updated);
      setCommentInput("");
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

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.complaint_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ward_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {/* Top Citizen Sub-header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-4 sm:p-6 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                Ward 64 - Karol Bagh
              </span>
              <span className="text-xs text-emerald-200">Zone: Central</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-1">
              {language === "hi" ? "नमस्ते, नागरिक!" : "Namaste, Citizen!"}
            </h1>
            <p className="text-xs text-emerald-100">
              {language === "hi"
                ? "स्वच्छ और सुरक्षित दिल्ली के लिए सीधे नगर निगम से जुड़ें"
                : "Report civic problems directly to Municipal Corporation of Delhi"}
            </p>
          </div>

          <button
            onClick={() => {
              setSubmittedTicket(null);
              setActiveTab("report");
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === "hi" ? "+ शिकायत दर्ज करें" : "+ Report Issue"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-around sm:justify-start gap-2 sm:gap-6 text-xs font-bold overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab("home")}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "home"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{language === "hi" ? "होम" : "Home"}</span>
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "report"
                ? "border-emerald-600 text-emerald-700 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === "hi" ? "शिकायत दर्ज करें" : "Raise Issue"}</span>
          </button>

          <button
            onClick={() => setActiveTab("my_tickets")}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "my_tickets"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{language === "hi" ? "मेरी शिकायतें" : "My Complaints"}</span>
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">
              {complaints.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ward")}
            className={`py-2 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "ward"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{language === "hi" ? "वार्ड निर्देशिका" : "Ward Info"}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex-1">
        {/* ================= TAB 1: HOME ================= */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* Announcement Banner */}
            {announcements.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Municipal Notice
                    </span>
                    <span className="text-xs text-amber-800 font-bold">
                      {announcements[0].ward_name}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">
                    {announcements[0].title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {announcements[0].message}
                  </p>
                </div>
              </div>
            )}

            {/* Quick 12 Civic Categories Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>{language === "hi" ? "नागरिक सेवाएं एवं श्रेणियां" : "Civic Complaint Categories"}</span>
                </h3>
                <span className="text-[11px] text-slate-500">12 Categories</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCatId(cat.id);
                      setActiveTab("report");
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all group text-center active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                      {getCategoryIcon(cat.code)}
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 mt-2 line-clamp-1 leading-tight">
                      {language === "hi" ? cat.name_hi : cat.name_en}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                      SLA: {cat.default_sla_hours}h
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nearby Active Complaints in Ward */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>{language === "hi" ? "आस-पास की समस्याएं (वार्ड 64)" : "Nearby Issues in Your Ward"}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === "hi" ? "दोबारा शिकायत दर्ज करने से बचें, 'Me Too' दबाएं" : "Avoid duplicates: Upvote with 'Me Too' instead"}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("my_tickets")}
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {complaints.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveDetailTicket(item)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {item.media[0] ? (
                        <img
                          src={item.media[0].url}
                          alt="Evidence"
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-emerald-700">
                            {item.complaint_number}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {item.category_name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              item.status === "RESOLVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "IN_PROGRESS"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={(e) => handleUpvote(item.id, e)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                        title="Upvote / Me Too"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Me Too ({item.upvotes_count})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: RAISE COMPLAINT ================= */}
        {activeTab === "report" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            {submittedTicket ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {language === "hi" ? "शिकायत सफलतापूर्वक दर्ज हो गई!" : "Complaint Registered Successfully!"}
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {language === "hi"
                    ? "आपकी समस्या संबंधित वार्ड अधिकारी को सौंप दी गई है। आप एसएमएस व ऐप से प्रगति देख सकते हैं।"
                    : "Your civic issue has been assigned to the municipal field officer. You will receive updates via SMS."}
                </p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-sm mx-auto text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Complaint Number:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {submittedTicket.complaint_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ward:</span>
                    <span className="font-bold">{submittedTicket.ward_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Officer:</span>
                    <span className="font-bold">{submittedTicket.officer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resolution SLA:</span>
                    <span className="font-bold text-amber-700">
                      {new Date(submittedTicket.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(submittedTicket.sla_deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={() => {
                      setActiveDetailTicket(submittedTicket);
                      setSubmittedTicket(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                  >
                    View Status Timeline
                  </button>
                  <button
                    onClick={() => {
                      setSubmittedTicket(null);
                      setActiveTab("home");
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {language === "hi" ? "नई नागरिक समस्या दर्ज करें" : "Raise a Civic Complaint"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {language === "hi"
                      ? "फोटो, जीपीएस लोकेशन व संक्षिप्त विवरण देकर तुरंत टिकट बनाएं"
                      : "Provide photo, GPS location, and description for rapid resolution"}
                  </p>
                </div>

                {/* Category Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    1. {language === "hi" ? "समस्या की श्रेणी चुनें *" : "Select Issue Category *"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {categories.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setSelectedCatId(c.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          selectedCatId === c.id
                            ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {getCategoryIcon(c.code)}
                        <span className="text-[11px] line-clamp-1">{language === "hi" ? c.name_hi : c.name_en}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    2. {language === "hi" ? "फोटो अपलोड करें (अधिकतम 3) *" : "Upload Photos (Up to 3) *"}
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
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-500">
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

                {/* Location with Auto-GPS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      3. {language === "hi" ? "स्थान व लैंडमार्क *" : "Location & Address *"}
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddress("Ward 64, DB Gupta Road, Karol Bagh, Delhi - 110005")}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      Auto-Detect GPS
                    </button>
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Enter street, area, colony..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Nearest landmark (e.g. Near Metro Gate 2)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Description + Voice input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      4. {language === "hi" ? "समस्या का विवरण" : "Description & Remarks"}
                    </label>
                    <button
                      type="button"
                      onClick={handleRecordVoice}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
                        isRecording ? "bg-rose-500 text-white animate-pulse" : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      <Mic className="w-3 h-3" />
                      {isRecording ? "Listening..." : "Speak Description"}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe problem details (size of pothole, days of garbage overflow, etc.)..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Anonymous Checkbox */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="anon-check"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="anon-check" className="text-xs text-slate-700 font-medium cursor-pointer">
                    {language === "hi" ? "गुमनाम शिकायत दर्ज करें (फोन नंबर छिपाएं)" : "Submit Anonymously (Hide my phone number from public)"}
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>{language === "hi" ? "शिकायत सबमिट करें" : "Submit Complaint"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ================= TAB 3: MY COMPLAINTS ================= */}
        {activeTab === "my_tickets" && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {(["ALL", "SUBMITTED", "IN_PROGRESS", "RESOLVED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === status
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID or title..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Complaint Cards Feed */}
            <div className="space-y-3">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No complaints found under this filter.
                </div>
              ) : (
                filteredComplaints.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveDetailTicket(item)}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm cursor-pointer transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            {item.complaint_number}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {item.category_name}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                          {item.title}
                        </h4>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                          item.status === "RESOLVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "IN_PROGRESS"
                            ? "bg-sky-100 text-sky-800"
                            : item.status === "REOPENED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold">
                          Officer: {item.officer_name}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: WARD DIRECTORY ================= */}
        {activeTab === "ward" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {language === "hi" ? "दिल्ली नगर निगम वार्ड निर्देशिका" : "MCD Ward & Councillor Directory"}
              </h2>
              <p className="text-xs text-slate-500">
                Direct contacts for your local representatives and municipal zonal offices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wards.map((w) => (
                <div key={w.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Ward {w.ward_number}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{w.zone_name}</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {language === "hi" ? w.name_hi : w.name_en}
                    </h3>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      Councillor: {w.councillor_name}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <a href={`tel:${w.councillor_phone}`} className="font-bold text-emerald-700 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" /> {w.councillor_phone}
                      </a>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <strong>Office:</strong> {w.office_address}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= DETAILED COMPLAINT MODAL ================= */}
      {activeDetailTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-emerald-700">
                    {activeDetailTicket.complaint_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      activeDetailTicket.status === "RESOLVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {activeDetailTicket.status}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {activeDetailTicket.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveDetailTicket(null);
                  if (onClearSelectedComplaint) onClearSelectedComplaint();
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Before vs After Photos Comparison */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                Photo Evidence & Verification Proof:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Before Photo */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Before (Citizen Submission)
                  </span>
                  {activeDetailTicket.media.find((m) => m.stage === "BEFORE") ? (
                    <img
                      src={activeDetailTicket.media.find((m) => m.stage === "BEFORE")?.url}
                      alt="Before evidence"
                      className="w-full h-44 object-cover rounded-2xl border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-44 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                      No Photo Attached
                    </div>
                  )}
                </div>

                {/* After Photo Proof */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-700">
                    After (Officer Resolution Proof)
                  </span>
                  {activeDetailTicket.media.find((m) => m.stage === "AFTER") ? (
                    <img
                      src={activeDetailTicket.media.find((m) => m.stage === "AFTER")?.url}
                      alt="After proof"
                      className="w-full h-44 object-cover rounded-2xl border-2 border-emerald-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-full h-44 rounded-2xl bg-amber-50/70 border border-dashed border-amber-300 flex flex-col items-center justify-center text-amber-800 text-xs p-3 text-center">
                      <Clock className="w-6 h-6 text-amber-600 mb-1" />
                      <span>Pending resolution proof from field officer</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Progress Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-3">Resolution Timeline:</h4>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-6">
                {activeDetailTicket.timeline.map((t, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{t.status}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(t.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.remarks}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Officer Details & Contact */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Assigned Officer:
                </span>
                <p className="text-xs font-bold text-slate-900">
                  {activeDetailTicket.officer_name}
                </p>
                <p className="text-[11px] text-slate-500">{activeDetailTicket.ward_name}</p>
              </div>
              {activeDetailTicket.officer_phone && (
                <a
                  href={`tel:${activeDetailTicket.officer_phone}`}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  Call Officer
                </a>
              )}
            </div>

            {/* Citizen Feedback or Reopen flow if resolved */}
            {activeDetailTicket.status === "RESOLVED" && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                <h4 className="text-xs font-black text-emerald-900">
                  Citizen Feedback & Verification:
                </h4>
                {activeDetailTicket.feedback ? (
                  <div className="text-xs text-emerald-800">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: activeDetailTicket.feedback.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="mt-1 font-medium">{activeDetailTicket.feedback.review}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-800 font-medium">
                      Rate this resolution (1 to 5 Stars):
                    </p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`p-1 ${rating >= star ? "text-amber-500" : "text-slate-300"}`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Write your review..."
                      className="w-full text-xs p-2 rounded-xl bg-white border border-emerald-300"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleFeedbackSubmit(activeDetailTicket.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                      >
                        Submit 5-Star Rating
                      </button>
                      <button
                        onClick={() => {
                          const r = prompt("Why are you reopening this complaint?");
                          if (r) handleReopen(activeDetailTicket.id);
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100"
                      >
                        Not Satisfied? Reopen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Escalation Button if Overdue or In Progress */}
            {activeDetailTicket.status !== "RESOLVED" && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleEscalate(activeDetailTicket.id)}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Escalate to Municipal Commissioner
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
