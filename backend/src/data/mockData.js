// Realistic Seed Data for Fic City (MCD Delhi inspired)

export const initialDepartments = [
  { id: "dept-1", code: "SAN", name_en: "Sanitation & Solid Waste", name_hi: "स्वच्छता एवं ठोस अपशिष्ट", helpline: "1800-11-2231" },
  { id: "dept-2", code: "ROADS", name_en: "PWD & Road Infrastructure", name_hi: "सड़क एवं लोक निर्माण विभाग", helpline: "1800-11-2232" },
  { id: "dept-3", code: "ELEC", name_en: "Street Lighting & Electrical", name_hi: "स्ट्रीट लाइट एवं विद्युत विभाग", helpline: "1800-11-2233" },
  { id: "dept-4", code: "SEW", name_en: "Drainage & Sewerage Board", name_hi: "जल निकासी एवं सीवेज बोर्ड", helpline: "1800-11-2234" },
  { id: "dept-5", code: "WATER", name_en: "Delhi Jal Board (Water)", name_hi: "दिल्ली जल बोर्ड", helpline: "1916" },
  { id: "dept-6", code: "VET", name_en: "Veterinary & Animal Care", name_hi: "पशु चिकित्सा एवं नियंत्रण", helpline: "1800-11-2236" },
  { id: "dept-7", code: "BLDG", name_en: "Building & Encroachment Cell", name_hi: "अवैध निर्माण एवं अतिक्रमण रोकथाम", helpline: "1800-11-2237" },
  { id: "dept-8", code: "HORT", name_en: "Horticulture & Parks", name_hi: "उद्यान एवं पार्क विभाग", helpline: "1800-11-2238" },
  { id: "dept-9", code: "HLTH", name_en: "Public Health & Fogging", name_hi: "जन स्वास्थ्य एवं फॉगिंग", helpline: "1800-11-2239" }
];

export const initialWards = [
  {
    id: "ward-64",
    ward_number: 64,
    name_en: "Karol Bagh",
    name_hi: "करोल बाग",
    zone_name: "Central Zone",
    councillor_name: "Smt. Sunita Sharma",
    councillor_phone: "+91 98101 23456",
    councillor_email: "sunita.ward64@mcd.delhi.gov.in",
    office_address: "Zonal Municipal Office, DB Gupta Road, Karol Bagh, Delhi - 110005",
    center: { lat: 28.6514, lng: 77.1907 }
  },
  {
    id: "ward-23",
    ward_number: 23,
    name_en: "Rohini Sector 7",
    name_hi: "रोहिणी सेक्टर 7",
    zone_name: "North Zone",
    councillor_name: "Shri Manoj Kumar",
    councillor_phone: "+91 98112 34567",
    councillor_email: "manoj.ward23@mcd.delhi.gov.in",
    office_address: "Sector 7 Community Center, Rohini, Delhi - 110085",
    center: { lat: 28.7112, lng: 77.1215 }
  },
  {
    id: "ward-102",
    ward_number: 102,
    name_en: "Civil Lines",
    name_hi: "सिविल लाइंस",
    zone_name: "North Zone",
    councillor_name: "Smt. Anjali Verma",
    councillor_phone: "+91 98103 45678",
    councillor_email: "anjali.ward102@mcd.delhi.gov.in",
    office_address: "Old Secretariat Complex, Civil Lines, Delhi - 110054",
    center: { lat: 28.6804, lng: 77.2251 }
  },
  {
    id: "ward-145",
    ward_number: 145,
    name_en: "Lajpat Nagar",
    name_hi: "लाजपत नगर",
    zone_name: "South Zone",
    councillor_name: "Shri Rajesh Gupta",
    councillor_phone: "+91 98104 56789",
    councillor_email: "rajesh.ward145@mcd.delhi.gov.in",
    office_address: "Central Market Complex, Lajpat Nagar II, Delhi - 110024",
    center: { lat: 28.5684, lng: 77.2435 }
  },
  {
    id: "ward-88",
    ward_number: 88,
    name_en: "Dwarka Sector 12",
    name_hi: "द्वारका सेक्टर 12",
    zone_name: "West Zone",
    councillor_name: "Shri Sandeep Tyagi",
    councillor_phone: "+91 98105 67890",
    councillor_email: "sandeep.ward88@mcd.delhi.gov.in",
    office_address: "Sector 12 DDA Park Building, Dwarka, Delhi - 110078",
    center: { lat: 28.5921, lng: 77.0460 }
  },
  {
    id: "ward-160",
    ward_number: 160,
    name_en: "Mayur Vihar Phase 1",
    name_hi: "मयूर विहार फेज 1",
    zone_name: "East Zone",
    councillor_name: "Smt. Kavita Devi",
    councillor_phone: "+91 98106 78901",
    councillor_email: "kavita.ward160@mcd.delhi.gov.in",
    office_address: "Pocket 1 Community Hall, Mayur Vihar, Delhi - 110091",
    center: { lat: 28.6083, lng: 77.2954 }
  }
];

export const initialCategories = [
  {
    id: "cat-1",
    department_id: "dept-1",
    code: "GARBAGE",
    name_en: "Garbage & Sanitation",
    name_hi: "कचरा और स्वच्छता",
    icon: "Trash2",
    default_sla_hours: 24,
    subcategories: [
      { id: "sub-1-1", name_en: "Garbage Dump Overflow (Dhalao)", name_hi: "कचरा ढलाव ओवरफ्लो", sla_hours: 12, priority: "HIGH" },
      { id: "sub-1-2", name_en: "Street Sweeping Not Done", name_hi: "सड़क की सफाई नहीं हुई", sla_hours: 24, priority: "MEDIUM" },
      { id: "sub-1-3", name_en: "Door-to-Door Tipper Not Arrived", name_hi: "डोर-टू-डोर टिपर नहीं आया", sla_hours: 24, priority: "MEDIUM" },
      { id: "sub-1-4", name_en: "Open Burning of Waste / Leaves", name_hi: "कचरा या पत्ते जलाना", sla_hours: 6, priority: "CRITICAL" }
    ]
  },
  {
    id: "cat-2",
    department_id: "dept-2",
    code: "POTHOLE",
    name_en: "Pothole & Road Damage",
    name_hi: "सड़क के गड्ढे और मरम्मत",
    icon: "Hammer",
    default_sla_hours: 48,
    subcategories: [
      { id: "sub-2-1", name_en: "Dangerous Deep Pothole", name_hi: "खतरनाक गहरा गड्ढा", sla_hours: 24, priority: "HIGH" },
      { id: "sub-2-2", name_en: "Damaged Road Surface", name_hi: "टूटी हुई सड़क की सतह", sla_hours: 72, priority: "MEDIUM" },
      { id: "sub-2-3", name_en: "Broken Footpath / Paver Blocks", name_hi: "टूटा हुआ फुटपाथ", sla_hours: 72, priority: "LOW" },
      { id: "sub-2-4", name_en: "Illegal Speed Breaker", name_hi: "अवैध स्पीड ब्रेकर", sla_hours: 48, priority: "MEDIUM" }
    ]
  },
  {
    id: "cat-3",
    department_id: "dept-3",
    code: "STREETLIGHT",
    name_en: "Streetlight & Poles",
    name_hi: "स्ट्रीट लाइट और पोल",
    icon: "Lightbulb",
    default_sla_hours: 24,
    subcategories: [
      { id: "sub-3-1", name_en: "Streetlight Not Working / Dark", name_hi: "स्ट्रीट लाइट बंद है", sla_hours: 24, priority: "MEDIUM" },
      { id: "sub-3-2", name_en: "Exposed Naked Electric Wires", name_hi: "बिजली के खुले नंगे तार", sla_hours: 4, priority: "CRITICAL" },
      { id: "sub-3-3", name_en: "Tilted / Collapsed Electric Pole", name_hi: "झुका हुआ या गिरा पोल", sla_hours: 8, priority: "HIGH" }
    ]
  },
  {
    id: "cat-4",
    department_id: "dept-4",
    code: "DRAINAGE",
    name_en: "Drainage & Sewage",
    name_hi: "नाली और सीवेज",
    icon: "Waves",
    default_sla_hours: 24,
    subcategories: [
      { id: "sub-4-1", name_en: "Open Missing Manhole Cover", name_hi: "खुला मैनहोल / ढक्कन गायब", sla_hours: 4, priority: "CRITICAL" },
      { id: "sub-4-2", name_en: "Overflowing Sewage on Road", name_hi: "सड़क पर सीवेज ओवरफ्लो", sla_hours: 12, priority: "HIGH" },
      { id: "sub-4-3", name_en: "Choked Storm Water Drain", name_hi: "नाली जाम / अवरुद्ध", sla_hours: 24, priority: "MEDIUM" }
    ]
  },
  {
    id: "cat-5",
    department_id: "dept-5",
    code: "WATERLOG",
    name_en: "Water Logging",
    name_hi: "जल भराव",
    icon: "CloudRain",
    default_sla_hours: 12,
    subcategories: [
      { id: "sub-5-1", name_en: "Monsoon Waterlogging on Main Road", name_hi: "मुख्य सड़क पर जलभराव", sla_hours: 6, priority: "HIGH" },
      { id: "sub-5-2", name_en: "Residential Colony Water Accumulation", name_hi: "कॉलोनी में पानी भरा होना", sla_hours: 12, priority: "MEDIUM" }
    ]
  },
  {
    id: "cat-6",
    department_id: "dept-6",
    code: "ANIMALS",
    name_en: "Stray Animals & Menace",
    name_hi: "आवारा पशु और उपद्रव",
    icon: "Dog",
    default_sla_hours: 48,
    subcategories: [
      { id: "sub-6-1", name_en: "Aggressive Stray Dog Menace", name_hi: "आक्रामक आवारा कुत्ते", sla_hours: 24, priority: "HIGH" },
      { id: "sub-6-2", name_en: "Stray Cattle Blocking Traffic", name_hi: "सड़क पर आवारा मवेशी/गाय", sla_hours: 12, priority: "HIGH" },
      { id: "sub-6-3", name_en: "Monkey Troops in Colony", name_hi: "कॉलोनी में बंदरों का आतंक", sla_hours: 48, priority: "MEDIUM" }
    ]
  },
  {
    id: "cat-7",
    department_id: "dept-7",
    code: "ENCROACHMENT",
    name_en: "Illegal Construction / Encroachment",
    name_hi: "अवैध निर्माण और अतिक्रमण",
    icon: "ShieldAlert",
    default_sla_hours: 72,
    subcategories: [
      { id: "sub-7-1", name_en: "Public Land / Footpath Encroachment", name_hi: "सरकारी जमीन या फुटपाथ कब्जा", sla_hours: 48, priority: "HIGH" },
      { id: "sub-7-2", name_en: "Unauthorized Building Construction", name_hi: "अनधिकृत भवन निर्माण", sla_hours: 72, priority: "MEDIUM" }
    ]
  },
  {
    id: "cat-8",
    department_id: "dept-8",
    code: "PARKS",
    name_en: "Parks & Gardens",
    name_hi: "पार्क और उद्यान",
    icon: "Trees",
    default_sla_hours: 48,
    subcategories: [
      { id: "sub-8-1", name_en: "Fallen Tree / Dangerous Branch", name_hi: "गिरा हुआ पेड़ / खतरनाक डाली", sla_hours: 8, priority: "HIGH" },
      { id: "sub-8-2", name_en: "Park Grass Uncut & Dirty", name_hi: "पार्क में घास की कटाई व सफाई", sla_hours: 48, priority: "LOW" },
      { id: "sub-8-3", name_en: "Broken Children Play Equipment", name_hi: "बच्चों के टूटे झूले", sla_hours: 72, priority: "LOW" }
    ]
  },
  {
    id: "cat-9",
    department_id: "dept-1",
    code: "TOILETS",
    name_en: "Public Toilets & Sanitation",
    name_hi: "सार्वजनिक शौचालय",
    icon: "Bath",
    default_sla_hours: 12,
    subcategories: [
      { id: "sub-9-1", name_en: "Public Toilet Dirty / Unusable", name_hi: "शौचालय गंदा या अनुपयोगी", sla_hours: 8, priority: "HIGH" },
      { id: "sub-9-2", name_en: "No Water in Public Toilet", name_hi: "सार्वजनिक शौचालय में पानी नहीं", sla_hours: 6, priority: "HIGH" }
    ]
  },
  {
    id: "cat-10",
    department_id: "dept-6",
    code: "DEAD_ANIMAL",
    name_en: "Dead Animal Removal",
    name_hi: "मृत पशु हटाना",
    icon: "Skull",
    default_sla_hours: 6,
    subcategories: [
      { id: "sub-10-1", name_en: "Dead Animal on Public Road", name_hi: "सड़क पर मृत पशु", sla_hours: 4, priority: "CRITICAL" }
    ]
  },
  {
    id: "cat-11",
    department_id: "dept-9",
    code: "FOGGING",
    name_en: "Mosquito & Fogging Drive",
    name_hi: "मच्छर और फॉगिंग",
    icon: "Sparkles",
    default_sla_hours: 48,
    subcategories: [
      { id: "sub-11-1", name_en: "Request Colony Fogging for Dengue", name_hi: "डेंगू रोकथाम हेतु फॉगिंग की मांग", sla_hours: 36, priority: "MEDIUM" },
      { id: "sub-11-2", name_en: "Larva / Stagnant Water Breeding", name_hi: "मच्छर का लार्वा व ठहरा पानी", sla_hours: 24, priority: "HIGH" }
    ]
  },
  {
    id: "cat-12",
    department_id: "dept-1",
    code: "OTHERS",
    name_en: "Others / Civic Queries",
    name_hi: "अन्य नागरिक शिकायतें",
    icon: "HelpCircle",
    default_sla_hours: 72,
    subcategories: [
      { id: "sub-12-1", name_en: "General Civic Grievance", name_hi: "सामान्य नागरिक शिकायत", sla_hours: 72, priority: "LOW" }
    ]
  }
];

export const initialUsers = [
  {
    id: "user-cit-1",
    phone_number: "9876543210",
    full_name: "Amit Sharma",
    email: "amit.sharma@example.com",
    role: "CITIZEN",
    preferred_language: "en",
    ward_id: "ward-64"
  },
  {
    id: "user-cit-2",
    phone_number: "9876543220",
    full_name: "Pooja Malhotra",
    email: "pooja.m@example.com",
    role: "CITIZEN",
    preferred_language: "hi",
    ward_id: "ward-23"
  },
  {
    id: "user-off-1",
    phone_number: "9876543211",
    full_name: "Rajesh Verma",
    email: "rajesh.verma@mcd.gov.in",
    role: "FIELD_OFFICER",
    designation: "Junior Engineer - Sanitation",
    department_id: "dept-1",
    ward_id: "ward-64",
    employee_id: "MCD-SAN-1044",
    preferred_language: "en"
  },
  {
    id: "user-off-2",
    phone_number: "9876543212",
    full_name: "Suresh Yadav",
    email: "suresh.yadav@mcd.gov.in",
    role: "FIELD_OFFICER",
    designation: "Assistant Engineer - PWD Roads",
    department_id: "dept-2",
    ward_id: "ward-23",
    employee_id: "MCD-PWD-0892",
    preferred_language: "en"
  },
  {
    id: "user-admin-1",
    phone_number: "9876543213",
    full_name: "Dr. Priya Malhotra, IAS",
    email: "commissioner@mcd.delhi.gov.in",
    role: "SUPER_ADMIN",
    designation: "Additional Municipal Commissioner",
    department_id: "dept-1",
    preferred_language: "en"
  }
];

export const initialComplaints = [
  {
    id: "comp-101",
    complaint_number: "FC-2026-000101",
    citizen_id: "user-cit-1",
    citizen_name: "Amit Sharma",
    citizen_phone: "9876543210",
    category_id: "cat-1",
    category_name: "Garbage & Sanitation",
    sub_category_name: "Garbage Dump Overflow (Dhalao)",
    department_id: "dept-1",
    ward_id: "ward-64",
    ward_name: "Karol Bagh",
    zone_name: "Central Zone",
    assigned_officer_id: "user-off-1",
    officer_name: "Rajesh Verma (JE)",
    officer_phone: "+91 98765 43211",
    title: "Overflowing garbage dump near Karol Bagh Metro gate 2",
    description: "The dhalao has not been cleared for 2 days. Foul smell spreading into the market and blocking pedestrian path.",
    latitude: 28.6518,
    longitude: 77.1902,
    address: "Opposite Gate 2, Karol Bagh Metro Station, Pusa Road, Delhi",
    landmark: "Metro Gate 2",
    is_anonymous: false,
    status: "IN_PROGRESS",
    priority: "HIGH",
    source: "MOBILE_APP",
    upvotes_count: 14,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), // 14 hours ago
    sla_deadline: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(), // 10 hours left
    is_escalated: false,
    media: [
      {
        id: "med-1",
        stage: "BEFORE",
        type: "PHOTO",
        url: "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString()
      }
    ],
    timeline: [
      { status: "SUBMITTED", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), remarks: "Complaint lodged via Fic City Mobile App" },
      { status: "ASSIGNED", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), remarks: "Assigned to Ward JE Rajesh Verma" },
      { status: "IN_PROGRESS", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), remarks: "Sanitation tipper truck dispatched to location" }
    ],
    comments: [
      { id: "comm-1", user: "Rajesh Verma (Officer)", text: "Truck DL-1M-4321 is on site. Clearance underway.", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() }
    ]
  },
  {
    id: "comp-102",
    complaint_number: "FC-2026-000102",
    citizen_id: "user-cit-2",
    citizen_name: "Pooja Malhotra",
    citizen_phone: "9876543220",
    category_id: "cat-2",
    category_name: "Pothole & Road Damage",
    sub_category_name: "Dangerous Deep Pothole",
    department_id: "dept-2",
    ward_id: "ward-23",
    ward_name: "Rohini Sector 7",
    zone_name: "North Zone",
    assigned_officer_id: "user-off-2",
    officer_name: "Suresh Yadav (AE)",
    officer_phone: "+91 98765 43212",
    title: "Deep pothole causing two-wheelers to slip near Sector 7 market",
    description: "Deep crater formed after recent pipeline digging. Already two motorcyclists fell down yesterday night.",
    latitude: 28.7115,
    longitude: 77.1219,
    address: "Main Ring Road turn, near M2K Cinema, Rohini Sector 7, Delhi",
    landmark: "Near M2K Cinema",
    is_anonymous: false,
    status: "ASSIGNED",
    priority: "HIGH",
    source: "AI_BOT",
    upvotes_count: 28,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    sla_deadline: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    is_escalated: false,
    media: [
      {
        id: "med-2",
        stage: "BEFORE",
        type: "PHOTO",
        url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
      }
    ],
    timeline: [
      { status: "SUBMITTED", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), remarks: "Reported via Fic City Assistant AI" },
      { status: "ASSIGNED", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), remarks: "Assigned to PWD Road Inspection Team" }
    ],
    comments: []
  },
  {
    id: "comp-103",
    complaint_number: "FC-2026-000103",
    citizen_id: "user-cit-1",
    citizen_name: "Amit Sharma",
    citizen_phone: "9876543210",
    category_id: "cat-3",
    category_name: "Streetlight & Poles",
    sub_category_name: "Streetlight Not Working / Dark",
    department_id: "dept-3",
    ward_id: "ward-102",
    ward_name: "Civil Lines",
    zone_name: "North Zone",
    assigned_officer_id: "user-off-1",
    officer_name: "Rajesh Verma (JE)",
    officer_phone: "+91 98765 43211",
    title: "Three streetlights non-functional in Rajpur Road lane",
    description: "Pitch dark stretch makes it unsafe for women walking from Vishwavidyalaya Metro station in the evening.",
    latitude: 28.6812,
    longitude: 77.2248,
    address: "Lane 4, Rajpur Road, Civil Lines, Delhi",
    landmark: "Opposite Girls Senior Secondary School",
    is_anonymous: false,
    status: "RESOLVED",
    priority: "MEDIUM",
    source: "MOBILE_APP",
    upvotes_count: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    sla_deadline: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    is_escalated: false,
    media: [
      {
        id: "med-3a",
        stage: "BEFORE",
        type: "PHOTO",
        url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()
      },
      {
        id: "med-3b",
        stage: "AFTER",
        type: "PHOTO",
        url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      }
    ],
    timeline: [
      { status: "SUBMITTED", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), remarks: "Complaint submitted" },
      { status: "ASSIGNED", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), remarks: "Assigned to Electrical maintenance crew" },
      { status: "IN_PROGRESS", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), remarks: "LED fixture replacement started" },
      { status: "RESOLVED", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), remarks: "Installed 3 new 70W LED luminaires. Photo verified." }
    ],
    feedback: {
      rating: 5,
      review: "Very fast resolution! Light is working brightly now. Thank you Fic City team.",
      submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    comments: []
  },
  {
    id: "comp-104",
    complaint_number: "FC-2026-000104",
    citizen_id: "user-cit-2",
    citizen_name: "Pooja Malhotra",
    citizen_phone: "9876543220",
    category_id: "cat-4",
    category_name: "Drainage & Sewage",
    sub_category_name: "Open Missing Manhole Cover",
    department_id: "dept-4",
    ward_id: "ward-145",
    ward_name: "Lajpat Nagar",
    zone_name: "South Zone",
    assigned_officer_id: null,
    officer_name: "Pending Assignment",
    officer_phone: null,
    title: "Open manhole cover on walking path in Central Market",
    description: "Extremely hazardous! Someone put a tree branch as warning. Pedestrians can fall inside.",
    latitude: 28.5688,
    longitude: 77.2431,
    address: "Block K, Central Market, Lajpat Nagar II, New Delhi",
    landmark: "Outside Haldiram's",
    is_anonymous: false,
    status: "SUBMITTED",
    priority: "CRITICAL",
    source: "MOBILE_APP",
    upvotes_count: 42,
    created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(), // 50 mins ago
    sla_deadline: new Date(Date.now() + 1000 * 60 * 60 * 3.1).toISOString(), // 4 hr SLA
    is_escalated: false,
    media: [
      {
        id: "med-4",
        stage: "BEFORE",
        type: "PHOTO",
        url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 50).toISOString()
      }
    ],
    timeline: [
      { status: "SUBMITTED", timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), remarks: "High-priority critical ticket flagged" }
    ],
    comments: []
  }
];

export const initialFAQs = [
  {
    id: "faq-1",
    question_en: "How do I report a civic problem in Fic City?",
    question_hi: "फिक सिटी ऐप में नागरिक समस्या कैसे दर्ज करें?",
    answer_en: "Click the '+ Report Issue' button on the home screen or ask the AI Assistant. Select the category, upload up to 3 photos, confirm your GPS location, describe the problem, and tap Submit to receive your Complaint ID (e.g. FC-2026-000123).",
    answer_hi: "होम स्क्रीन पर '+ शिकायत दर्ज करें' बटन दबाएं या एआई सहायक से बोलें। श्रेणी चुनें, अधिकतम 3 फोटो अपलोड करें, जीपीएस लोकेशन चुनें और शिकायत जमा करें।"
  },
  {
    id: "faq-2",
    question_en: "What is the standard SLA (resolution time) for complaints?",
    question_hi: "शिकायतों के समाधान की समय सीमा (SLA) क्या है?",
    answer_en: "Critical issues like open manholes and exposed electric wires have a 4-6 hour emergency SLA. Overflowing garbage dumps have a 12-24 hour SLA. Potholes and streetlights are addressed within 24-48 hours.",
    answer_hi: "खुले मैनहोल और बिजली के नंगे तारों का समाधान 4-6 घंटे में होता है। कचरा 12-24 घंटे और गड्ढे/स्ट्रीटलाइट 24-48 घंटे में ठीक किए जाते हैं।"
  },
  {
    id: "faq-3",
    question_en: "What happens if my complaint is not resolved in time?",
    question_hi: "यदि मेरी शिकायत समय पर हल नहीं होती है तो क्या होगा?",
    answer_en: "Fic City automatically escalates overdue complaints to the Zonal Supervisor at Level 1, and to the Municipal Commissioner at Level 2. You can also manually tap 'Escalate' in the complaint detail screen.",
    answer_hi: "समय सीमा समाप्त होने पर शिकायत स्वतः उच्च अधिकारी (सुपरवाइजर और कमिश्नर) को एस्केलेट हो जाती है। आप ऐप से मैन्युअल रूप से भी एस्केलेट कर सकते हैं।"
  },
  {
    id: "faq-4",
    question_en: "Can I reopen a complaint if I am not satisfied with the resolution?",
    question_hi: "क्या मैं असंतुष्ट होने पर शिकायत दोबारा खोल सकता हूँ?",
    answer_en: "Yes! When an officer marks your ticket as Resolved, you will inspect their 'After' photo proof and give a 1-5 star rating. If unsatisfied, tap 'Reopen Complaint' with your remarks.",
    answer_hi: "हाँ! यदि अधिकारी द्वारा हल किया गया कार्य संतोषजनक नहीं है, तो आप 48 घंटे के भीतर 'Reopen' विकल्प चुनकर दोबारा जांच का अनुरोध कर सकते हैं।"
  },
  {
    id: "faq-5",
    question_en: "What is the 'Me Too' / Upvote feature?",
    question_hi: "'मी टू' / अपवोट फीचर क्या है?",
    answer_en: "To prevent multiple citizens filing identical complaints for the same pothole or garbage dump, nearby complaints are shown on your map. Tapping 'Me Too' boosts its priority without filing a duplicate ticket.",
    answer_hi: "एक ही समस्या के लिए अलग-अलग शिकायतें दर्ज करने के बजाय, आप मौजूदा शिकायत पर 'Me Too' दबाकर उसकी प्राथमिकता बढ़ा सकते हैं।"
  }
];

export const initialAnnouncements = [
  {
    id: "ann-1",
    ward_id: "ward-64",
    ward_name: "Karol Bagh",
    title: "Intensive Dengue Fogging Drive",
    message: "Special mosquito fumigation and larvicide spraying will be carried out across blocks 1 to 8 this Sunday 7:00 AM to 11:00 AM.",
    priority: "HIGH",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: "ann-2",
    ward_id: null,
    ward_name: "All Delhi Wards",
    title: "Monsoon Preparedness Helpline 311 Active",
    message: "Citizens can report water logging or blocked stormwater drains 24x7 through Fic City App or toll-free municipal helpline 155304.",
    priority: "MEDIUM",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  }
];
