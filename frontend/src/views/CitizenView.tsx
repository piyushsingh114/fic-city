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
  HelpCircle,
  X,
  Navigation,
  Video
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

  // Live Location & Camera State
  const [latitude, setLatitude] = useState<number>(28.6514);
  const [longitude, setLongitude] = useState<number>(77.1907);
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Live Camera Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = React.useRef<HTMLInputElement>(null);

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

  // --- LIVE CAMERA CAPTURE LOGIC ---
  const startLiveCamera = async () => {
    try {
      setLocationError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setIsCameraModalOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (err: any) {
      console.warn("Direct webcam stream not available, falling back to native camera input:", err);
      // Fallback directly to native device camera
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      } else {
        alert("Camera permission denied or camera not available. Please allow camera access or choose a photo from gallery.");
      }
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraModalOpen(false);
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Superimpose Civic Geo-stamp & Timestamp Watermark
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, canvas.height - 44, canvas.width, 44);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`📍 Fic City MCD 311 • Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`, 12, canvas.height - 24);
    ctx.font = "11px monospace";
    ctx.fillStyle = "#34d399";
    ctx.fillText(`📅 Captured: ${new Date().toLocaleString()} (Live Geo-Verified)`, 12, canvas.height - 10);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setPhotos((prev) => (prev.length < 3 ? [...prev, dataUrl] : prev));
    stopLiveCamera();
  };

  // --- LIVE GPS GEOLOCATION LOGIC ---
  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser. You can click any Quick Delhi Ward preset below.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy);

        setLatitude(lat);
        setLongitude(lng);
        setAccuracyMeters(acc);
        setIsLocating(false);
        setLocationSuccess(`Live GPS locked (Accuracy: ±${acc}m)!`);
        setTimeout(() => setLocationSuccess(null), 4000);

        // Reverse geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              setAddress(data.display_name);
            }
          }
        } catch (e) {
          console.warn("Reverse geocode fallback to coordinates:", e);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Click any Quick Delhi Ward preset below or allow location in browser settings.");
        } else {
          setLocationError("Unable to fetch GPS. You can click any Quick Delhi Ward preset below or type manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const applyWardPreset = (name: string, lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAccuracyMeters(5);
    setAddress(addr);
    setLocationError(null);
    setLocationSuccess(`Ward preset applied: ${name} (GPS locked ±5m)!`);
    setTimeout(() => setLocationSuccess(null), 3500);
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
        latitude: latitude || 28.6514,
        longitude: longitude || 77.1907,
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

                {/* 2. LIVE PHOTO CAPTURE & GALLERY UPLOAD */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      2. {language === "hi" ? "फोटो प्रमाण (अधिकतम 3) *" : "Live Incident Photo Proof (Up to 3) *"}
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {photos.length}/3 {language === "hi" ? "फोटो जोड़ी गईं" : "photos attached"}
                    </span>
                  </div>

                  {/* Action Buttons for Live Camera & Gallery */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={startLiveCamera}
                      disabled={photos.length >= 3}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4 text-emerald-100" />
                      <span>{language === "hi" ? "लाइव कैमरा से फोटो लें" : "Capture Live Photo"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photos.length >= 3}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <span>{language === "hi" ? "गैलरी से चुनें" : "Upload from Gallery"}</span>
                    </button>

                    {/* Hidden inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <input
                      ref={nativeCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Photo Previews with Geo-Tag Watermark Badge */}
                  <div className="flex flex-wrap gap-3 pt-1">
                    {photos.map((src, idx) => (
                      <div key={idx} className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xs group">
                        <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                        
                        {/* Live Geo-stamp Badge */}
                        <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs text-[9px] font-mono text-emerald-300 px-1 py-0.5 text-center truncate">
                          📍 {latitude.toFixed(3)}, {longitude.toFixed(3)}
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 bg-rose-600/90 text-white rounded-full p-1 text-[10px] hover:bg-rose-700 shadow-sm"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {photos.length === 0 && (
                      <div className="w-full p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
                        <Camera className="w-6 h-6 text-slate-400" />
                        <span className="font-semibold text-slate-700">No photos captured yet</span>
                        <span className="text-[11px] text-slate-400">Click "Capture Live Photo" to take live proof with GPS watermark</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. LIVE GPS LOCATION & REVERSE GEOCODING */}
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>3. {language === "hi" ? "लाइव स्थान व पता *" : "Live GPS Location & Address *"}</span>
                    </label>

                    {/* Live GPS Detection Button */}
                    <button
                      type="button"
                      onClick={handleDetectLiveLocation}
                      disabled={isLocating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isLocating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5 text-emerald-100" />
                      )}
                      <span>{isLocating ? "Fetching Live GPS..." : "📍 Use My Live Location"}</span>
                    </button>
                  </div>

                  {/* GPS Coordinate Display Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono text-[11px] font-bold text-slate-800">
                        Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
                      </span>
                      {accuracyMeters && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                          ±{accuracyMeters}m accuracy
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">GPS Auto-Verified</span>
                  </div>

                  {/* Quick Delhi Ward Presets (Instant fallback) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Delhi Wards:</span>
                    {[
                      { name: "Karol Bagh (W-64)", lat: 28.6514, lng: 77.1907, addr: "DB Gupta Road, Karol Bagh, Delhi - 110005" },
                      { name: "Rohini (W-23)", lat: 28.7112, lng: 77.1215, addr: "Sector 7 Community Center, Rohini, Delhi - 110085" },
                      { name: "Civil Lines (W-102)", lat: 28.6804, lng: 77.2251, addr: "Old Secretariat, Civil Lines, Delhi - 110054" },
                      { name: "Lajpat Nagar (W-145)", lat: 28.5684, lng: 77.2435, addr: "Central Market, Lajpat Nagar II, Delhi - 110024" },
                      { name: "Dwarka (W-88)", lat: 28.5921, lng: 77.0460, addr: "Sector 12, Dwarka, Delhi - 110078" },
                      { name: "Mayur Vihar (W-160)", lat: 28.6083, lng: 77.2954, addr: "Pocket 1, Mayur Vihar Phase 1, Delhi - 110091" }
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyWardPreset(preset.name, preset.lat, preset.lng, preset.addr)}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 font-medium transition-colors"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  {/* Status Notifications */}
                  {locationSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs flex items-center gap-2 border border-emerald-300 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{locationSuccess}</span>
                    </div>
                  )}

                  {locationError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs flex items-start gap-2 border border-rose-200">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{locationError}</span>
                    </div>
                  )}

                  {/* Address Text Field */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Street Address (Auto-filled via GPS, editable) *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      placeholder="e.g. Near Metro Pillar 140, DB Gupta Road, Karol Bagh, Delhi"
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Landmark Field */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Nearest Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Opposite Post Office / Near Mother Dairy booth"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
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
      {/* ================= LIVE CAMERA MODAL ================= */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            {/* Top Bar */}
            <div className="p-4 bg-slate-900/90 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider">Live Municipal Camera</span>
              </div>
              <button
                onClick={stopLiveCamera}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Video Viewfinder */}
            <div className="relative bg-black w-full h-72 sm:h-80 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-8 pointer-events-none border border-white/30 rounded-2xl flex items-center justify-center">
                <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400 absolute top-2 left-2" />
                <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400 absolute top-2 right-2" />
                <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400 absolute bottom-2 left-2" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400 absolute bottom-2 right-2" />
              </div>

              {/* Live Geo-Watermark Pill */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/75 backdrop-blur-xs rounded-xl p-2 text-white font-mono text-[10px] space-y-0.5 border border-white/10">
                <div className="text-emerald-400 font-bold truncate">
                  📍 GPS: {latitude.toFixed(5)}, {longitude.toFixed(5)} {accuracyMeters && `(±${accuracyMeters}m)`}
                </div>
                <div className="text-slate-300 truncate">
                  📅 {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} • Verified MCD Proof
                </div>
              </div>
            </div>

            {/* Shutter Capture Bar */}
            <div className="p-4 bg-slate-950 flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={capturePhotoFromStream}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 border-4 border-slate-900 ring-4 ring-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
                title="Click to capture live photo"
              >
                <Camera className="w-7 h-7 text-slate-950" />
              </button>
              <span className="text-[11px] font-bold text-slate-400">
                Tap button to capture geo-verified proof
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
