export type UserRole = 'CITIZEN' | 'FIELD_OFFICER' | 'SUPERVISOR' | 'DEPT_ADMIN' | 'SUPER_ADMIN';

export type ComplaintStatus = 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'REOPENED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  phone_number: string;
  full_name: string;
  email?: string;
  role: UserRole;
  preferred_language: 'en' | 'hi';
  ward_id?: string;
  designation?: string;
  department_id?: string;
  employee_id?: string;
}

export interface Ward {
  id: string;
  ward_number: number;
  name_en: string;
  name_hi: string;
  zone_name: string;
  councillor_name: string;
  councillor_phone: string;
  councillor_email: string;
  office_address: string;
  center: {
    lat: number;
    lng: number;
  };
}

export interface SubCategory {
  id: string;
  name_en: string;
  name_hi: string;
  sla_hours: number;
  priority: Priority;
}

export interface Category {
  id: string;
  department_id: string;
  code: string;
  name_en: string;
  name_hi: string;
  icon: string;
  default_sla_hours: number;
  subcategories: SubCategory[];
}

export interface ComplaintMedia {
  id: string;
  stage: 'BEFORE' | 'AFTER' | 'INVESTIGATION';
  type: 'PHOTO' | 'VIDEO' | 'AUDIO';
  url: string;
  uploaded_at: string;
}

export interface TimelineEntry {
  status: ComplaintStatus;
  timestamp: string;
  remarks: string;
}

export interface FeedbackData {
  rating: number;
  review?: string;
  submitted_at: string;
}

export interface CommentItem {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  complaint_number: string;
  citizen_id: string;
  citizen_name: string;
  citizen_phone: string;
  category_id: string;
  category_name: string;
  sub_category_name: string;
  department_id: string;
  ward_id: string;
  ward_name: string;
  zone_name: string;
  assigned_officer_id: string | null;
  officer_name: string;
  officer_phone: string | null;
  title: string;
  description: string;
  voice_note_url?: string | null;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  is_anonymous: boolean;
  status: ComplaintStatus;
  priority: Priority;
  source: string;
  upvotes_count: number;
  created_at: string;
  sla_deadline: string;
  resolved_at?: string;
  is_escalated: boolean;
  media: ComplaintMedia[];
  timeline: TimelineEntry[];
  feedback?: FeedbackData;
  comments: CommentItem[];
  distanceMeters?: number;
}

export interface Announcement {
  id: string;
  ward_id: string | null;
  ward_name: string;
  title: string;
  message: string;
  priority: Priority;
  created_at: string;
}

export interface AdminStats {
  total: number;
  resolved: number;
  inProgress: number;
  pending: number;
  overdue: number;
  slaCompliancePercentage: number;
  avgResolutionHours: number;
  citizenSatisfactionScore: number;
  categoryCounts: Record<string, number>;
  wardCounts: Record<string, number>;
}
