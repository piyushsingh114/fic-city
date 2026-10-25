import { dbStore } from "../data/dbStore.js";

// AI "Fic City Assistant" - Natural Language Processing & Function Calling Engine
export class AiChatbotService {
  constructor() {
    this.userStates = new Map(); // userId -> { step, draftComplaint }
  }

  // System prompt guidelines
  getSystemPrompt() {
    return `You are Fic City Assistant (फिक सिटी सहायक), an empathetic, highly efficient municipal AI assistant for the citizens of Delhi.
Your job is to:
1. Help citizens lodge civic complaints (garbage, potholes, streetlights, sewage, waterlogging, stray animals, etc.).
2. Track existing complaints with live status and officer details.
3. Check for duplicate complaints nearby to prevent redundant tickets.
4. Provide official FAQ answers, Ward councillor contacts, and helpline numbers.
5. Communicate politely in English, Hindi (हिंदी), or Hinglish based on the user's input.
Never hallucinate complaint numbers. Always confirm with the user before filing a final complaint.`;
  }

  // NLP Category Classifier
  detectCategory(text) {
    const lower = text.toLowerCase();
    
    // Garbage
    if (lower.includes("garbage") || lower.includes("trash") || lower.includes("kachra") || lower.includes("कचरा") || lower.includes("dhalao") || lower.includes("waste") || lower.includes("safai") || lower.includes("सफाई")) {
      return { category_id: "cat-1", category_name: "Garbage & Sanitation", sub_category: "Garbage Dump Overflow (Dhalao)", priority: "HIGH" };
    }
    // Pothole / Road
    if (lower.includes("pothole") || lower.includes("gaddha") || lower.includes("गड्ढा") || lower.includes("road") || lower.includes("sadak") || lower.includes("सड़क") || lower.includes("footpath") || lower.includes("divider")) {
      return { category_id: "cat-2", category_name: "Pothole & Road Damage", sub_category: "Dangerous Deep Pothole", priority: "HIGH" };
    }
    // Streetlight
    if (lower.includes("light") || lower.includes("streetlight") || lower.includes("dark") || lower.includes("bijli") || lower.includes("बत्ती") || lower.includes("अंधेरा") || lower.includes("pole") || lower.includes("wire")) {
      return { category_id: "cat-3", category_name: "Streetlight & Poles", sub_category: "Streetlight Not Working / Dark", priority: "MEDIUM" };
    }
    // Drainage / Manhole
    if (lower.includes("manhole") || lower.includes("sewer") || lower.includes("drain") || lower.includes("naali") || lower.includes("नाली") || lower.includes("सीवर") || lower.includes("choke")) {
      return { category_id: "cat-4", category_name: "Drainage & Sewage", sub_category: "Open Missing Manhole Cover", priority: "CRITICAL" };
    }
    // Water Logging
    if (lower.includes("waterlog") || lower.includes("flooding") || lower.includes("paani") || lower.includes("जलभराव") || lower.includes("पानी भरा")) {
      return { category_id: "cat-5", category_name: "Water Logging", sub_category: "Monsoon Waterlogging on Main Road", priority: "HIGH" };
    }
    // Stray animals
    if (lower.includes("dog") || lower.includes("kutta") || lower.includes("कुत्ता") || lower.includes("cow") || lower.includes("cattle") || lower.includes("monkey") || lower.includes("बंदर") || lower.includes("गाय")) {
      return { category_id: "cat-6", category_name: "Stray Animals & Menace", sub_category: "Aggressive Stray Dog Menace", priority: "HIGH" };
    }
    // Encroachment
    if (lower.includes("encroachment") || lower.includes("illegal") || lower.includes("kabza") || lower.includes("कब्जा") || lower.includes("अवैध")) {
      return { category_id: "cat-7", category_name: "Illegal Construction / Encroachment", sub_category: "Public Land / Footpath Encroachment", priority: "HIGH" };
    }
    // Dead animal
    if (lower.includes("dead animal") || lower.includes("mar gaya") || lower.includes("मरा हुआ पशु") || lower.includes("dead cow") || lower.includes("dead dog")) {
      return { category_id: "cat-10", category_name: "Dead Animal Removal", sub_category: "Dead Animal on Public Road", priority: "CRITICAL" };
    }
    // Fogging / Dengue
    if (lower.includes("fogging") || lower.includes("mosquito") || lower.includes("machhar") || lower.includes("मच्छर") || lower.includes("dengue") || lower.includes("malaria")) {
      return { category_id: "cat-11", category_name: "Mosquito & Fogging Drive", sub_category: "Request Colony Fogging for Dengue", priority: "MEDIUM" };
    }

    return { category_id: "cat-12", category_name: "Others / Civic Queries", sub_category: "General Civic Grievance", priority: "LOW" };
  }

  // Semantic/Keyword RAG search over FAQs
  searchKnowledgeBase(query) {
    const terms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let bestMatch = null;
    let highestScore = 0;

    for (const faq of dbStore.faqs) {
      let score = 0;
      const corpus = `${faq.question_en} ${faq.question_hi} ${faq.answer_en} ${faq.answer_hi}`.toLowerCase();
      for (const t of terms) {
        if (corpus.includes(t)) score += 1;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }
    return highestScore >= 2 ? bestMatch : null;
  }

  // Core Processing Method
  async processMessage({ userId, message, mediaUrl = null, location = null }) {
    const user = dbStore.users.find(u => u.id === userId) || { full_name: "Citizen", preferred_language: "en" };
    const lang = user.preferred_language || "en";
    const cleanMsg = message.trim();
    const lower = cleanMsg.toLowerCase();

    let state = this.userStates.get(userId) || { step: "IDLE", draft: {} };

    // 1. Check for Complaint Number pattern (e.g. FC-2026-000101 or 101)
    const ticketMatch = cleanMsg.match(/FC-2026-(\d+)/i) || cleanMsg.match(/#?(\d{6})/i);
    if (ticketMatch || lower.includes("track") || lower.includes("status") || lower.includes("स्थिति") || lower.includes("शिकायत नंबर")) {
      let targetId = ticketMatch ? (ticketMatch[0].startsWith("FC-") ? ticketMatch[0] : `FC-2026-${ticketMatch[1]}`) : null;
      
      if (!targetId) {
        // Find latest complaint for this user
        const userTickets = dbStore.getComplaints({ citizen_id: userId });
        if (userTickets.length > 0) {
          targetId = userTickets[0].complaint_number;
        }
      }

      if (targetId) {
        const complaint = dbStore.getComplaintById(targetId);
        if (complaint) {
          const isResolved = complaint.status === "RESOLVED";
          const text = lang === "hi"
            ? `📌 **शिकायत #${complaint.complaint_number} की स्थिति:**\n- **समस्या:** ${complaint.title}\n- **वर्तमान स्थिति:** ${complaint.status}\n- **प्रभारी अधिकारी:** ${complaint.officer_name}\n- **समाधान समय सीमा:** ${new Date(complaint.sla_deadline).toLocaleString()}\n\n${isResolved ? "✅ यह समस्या हल हो चुकी है। कृपया 1-5 स्टार रेटिंग दें!" : "निरीक्षण कार्य जारी है।"}`
            : `📌 **Complaint #${complaint.complaint_number} Status:**\n- **Issue:** ${complaint.title}\n- **Current Status:** ${complaint.status}\n- **Assigned Officer:** ${complaint.officer_name}\n- **SLA Deadline:** ${new Date(complaint.sla_deadline).toLocaleString()}\n\n${isResolved ? "✅ This complaint is resolved! Please rate the service (1-5 stars)." : "Work is currently in progress."}`;

          return {
            text,
            action: "COMPLAINT_DETAILS",
            data: complaint,
            quickReplies: isResolved ? ["Rate Resolution 5⭐", "Reopen Ticket"] : ["Escalate Complaint", "Call Officer", "Back to Home"]
          };
        }
      }
    }

    // 2. Escalation trigger
    if (lower.includes("escalate") || lower.includes("delay") || lower.includes("late") || lower.includes("शिकायत आगे बढ़ाएं") || lower.includes("देरी")) {
      const userTickets = dbStore.getComplaints({ citizen_id: userId });
      if (userTickets.length > 0) {
        const ticket = userTickets[0];
        dbStore.escalateComplaint(ticket.id, "Citizen escalated via Fic City Assistant");
        return {
          text: lang === "hi"
            ? `⚠️ आपकी शिकायत #${ticket.complaint_number} को जोनल कमिश्नर स्तर पर एस्केलेट कर दिया गया है। उच्च अधिकारी को तत्काल अलर्ट भेजा गया है।`
            : `⚠️ Your complaint #${ticket.complaint_number} has been escalated to the Zonal Municipal Commissioner. Priority updated to CRITICAL.`,
          action: "ESCALATION_DONE",
          quickReplies: ["Track Complaint", "View Ward Info", "Report Another Issue"]
        };
      }
    }

    // 3. Ward & Councillor Info
    if (lower.includes("ward") || lower.includes("councillor") || lower.includes("parshad") || lower.includes("पार्षद") || lower.includes("वार्ड")) {
      const defaultWard = dbStore.wards[0];
      const text = lang === "hi"
        ? `🏛️ **वार्ड विवरण (Ward 64 - ${defaultWard.name_hi}):**\n- **जोन:** ${defaultWard.zone_name}\n- **पार्षद:** ${defaultWard.councillor_name}\n- **फोन:** ${defaultWard.councillor_phone}\n- **कार्यालय:** ${defaultWard.office_address}`
        : `🏛️ **Ward Information (Ward 64 - ${defaultWard.name_en}):**\n- **Zone:** ${defaultWard.zone_name}\n- **Councillor:** ${defaultWard.councillor_name}\n- **Phone:** ${defaultWard.councillor_phone}\n- **Office:** ${defaultWard.office_address}`;

      return {
        text,
        action: "WARD_INFO",
        data: defaultWard,
        quickReplies: ["Report Issue in Ward", "Helpline Numbers", "Main Menu"]
      };
    }

    // 4. Multi-turn Reporting Conversation Flow
    if (state.step === "AWAITING_LOCATION") {
      state.draft.address = cleanMsg;
      state.step = "AWAITING_CONFIRMATION";
      this.userStates.set(userId, state);

      const d = state.draft;
      const text = lang === "hi"
        ? `📝 **शिकायत सारांश:**\n• **श्रेणी:** ${d.category_name}\n• **विवरण:** ${d.description}\n• **स्थान:** ${d.address}\n\nक्या मैं इस शिकायत को दर्ज कर दूँ?`
        : `📝 **Complaint Summary:**\n• **Category:** ${d.category_name}\n• **Description:** ${d.description}\n• **Location:** ${d.address}\n\nShall I submit this complaint now?`;

      return {
        text,
        action: "CONFIRM_SUBMISSION",
        data: d,
        quickReplies: [lang === "hi" ? "हाँ, दर्ज करें" : "Yes, Submit", lang === "hi" ? "रद्द करें" : "Cancel"]
      };
    }

    if (state.step === "AWAITING_CONFIRMATION") {
      if (lower.includes("yes") || lower.includes("submit") || lower.includes("हाँ") || lower.includes("कर दो")) {
        const d = state.draft;
        const newTicket = dbStore.createComplaint({
          citizen_id: userId,
          category_id: d.category_id,
          sub_category_name: d.sub_category,
          title: d.title || d.description.slice(0, 60),
          description: d.description,
          latitude: location ? location.lat : 28.6514,
          longitude: location ? location.lng : 77.1907,
          address: d.address || "Karol Bagh, New Delhi",
          priority: d.priority || "MEDIUM",
          source: "AI_BOT",
          media: mediaUrl ? [{ id: `med-${Date.now()}`, stage: "BEFORE", type: "PHOTO", url: mediaUrl }] : []
        });

        this.userStates.delete(userId);

        const text = lang === "hi"
          ? `🎉 **शिकायत सफलतापूर्वक दर्ज हो गई!**\n\n📌 **शिकायत संख्या:** **${newTicket.complaint_number}**\n- **अधिकारी:** ${newTicket.officer_name}\n- **अनुमानित समाधान समय:** ${new Date(newTicket.sla_deadline).toLocaleString()}\n\nआप कभी भी स्थिति पूछ सकते हैं!`
          : `🎉 **Complaint Registered Successfully!**\n\n📌 **Complaint Number:** **${newTicket.complaint_number}**\n- **Assigned Officer:** ${newTicket.officer_name}\n- **Target Resolution Time:** ${new Date(newTicket.sla_deadline).toLocaleString()}\n\nYou can track this anytime by typing the Complaint ID!`;

        return {
          text,
          action: "COMPLAINT_CREATED",
          data: newTicket,
          quickReplies: ["Track This Complaint", "Report Another Issue", "Back to Home"]
        };
      } else {
        this.userStates.delete(userId);
        return {
          text: lang === "hi" ? "शिकायत रद्द कर दी गई। मैं आपकी और क्या मदद कर सकता हूँ?" : "Complaint registration cancelled. How else can I assist you?",
          action: "CANCELLED",
          quickReplies: ["Report Issue", "Check FAQs", "Ward Info"]
        };
      }
    }

    // 5. New Issue lodging via conversation
    if (
      lower.includes("report") ||
      lower.includes("complain") ||
      lower.includes("शिकायत") ||
      lower.includes("pothole") ||
      lower.includes("garbage") ||
      lower.includes("kachra") ||
      lower.includes("light") ||
      lower.includes("water") ||
      lower.includes("dog")
    ) {
      const detected = this.detectCategory(cleanMsg);
      state = {
        step: "AWAITING_LOCATION",
        draft: {
          category_id: detected.category_id,
          category_name: detected.category_name,
          sub_category: detected.sub_category,
          priority: detected.priority,
          description: cleanMsg,
          title: cleanMsg.length > 50 ? cleanMsg.slice(0, 50) + "..." : cleanMsg
        }
      };
      this.userStates.set(userId, state);

      // Check for nearby duplicates
      const nearby = dbStore.getNearbyComplaints(28.6514, 77.1907, 400);
      let duplicateAlert = "";
      if (nearby.length > 0) {
        duplicateAlert = lang === "hi"
          ? `\n\n💡 *ध्यान दें:* आपके क्षेत्र में पहले से 1 मिलती-जुलती शिकायत (#${nearby[0].complaint_number}) दर्ज है। आप चाहें तो उस पर "Me Too" अपवोट भी कर सकते हैं।`
          : `\n\n💡 *Notice:* We found 1 similar open complaint (#${nearby[0].complaint_number}) nearby. You can also upvote it with 'Me Too'.`;
      }

      const text = lang === "hi"
        ? `मैंने आपकी समस्या को **${detected.category_name}** के रूप में पहचाना है।${duplicateAlert}\n\nकृपया समस्या का सटीक **स्थान या लैंडमार्क (पता)** बताएं:`
        : `I've categorized this under **${detected.category_name}**.${duplicateAlert}\n\nPlease specify the exact **location, landmark, or street name**:`;

      return {
        text,
        action: "REQUEST_LOCATION",
        quickReplies: ["Karol Bagh Metro", "Rohini Sector 7 Market", "Civil Lines Rajpur Road", "Use My Current GPS"]
      };
    }

    // 6. RAG over FAQs
    const faqMatch = this.searchKnowledgeBase(cleanMsg);
    if (faqMatch) {
      return {
        text: lang === "hi" ? `💡 **अक्सर पूछे जाने वाले प्रश्न:**\n\n${faqMatch.answer_hi}` : `💡 **Official Information:**\n\n${faqMatch.answer_en}`,
        action: "FAQ_ANSWER",
        quickReplies: ["Report Issue", "Track Complaint", "Contact Officer"]
      };
    }

    // Default Fallback
    const welcomeText = lang === "hi"
      ? `नमस्ते! मैं आपका **फिक सिटी सहायक** हूँ। मैं आपकी क्या मदद कर सकता हूँ?\n\n• नई नागरिक समस्या दर्ज करें (कचरा, सड़क, लाइट)\n• शिकायत की स्थिति ट्रैक करें\n• अपने वार्ड और पार्षद की जानकारी प्राप्त करें`
      : `Hello! I am your **Fic City Assistant**. How can I help you today?\n\n• Report a civic issue (garbage, pothole, streetlights)\n• Track your complaint status\n• Find your Ward & Councillor info`;

    return {
      text: welcomeText,
      action: "GENERAL_GREETING",
      quickReplies: ["Report an Issue", "Track My Complaint", "Find My Ward", "Helpline Numbers"]
    };
  }
}

export const aiChatbotService = new AiChatbotService();
