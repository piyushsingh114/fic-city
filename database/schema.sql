-- ============================================================================
-- FIC CITY - CIVIC COMPLAINT & MUNICIPAL RESOLUTION SYSTEM
-- Complete PostgreSQL + PostGIS + pgvector Production Schema
-- Inspired by MCD 311 (Delhi Municipal Corporation)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
CREATE TYPE user_role_type AS ENUM ('CITIZEN', 'FIELD_OFFICER', 'SUPERVISOR', 'DEPT_ADMIN', 'SUPER_ADMIN');
CREATE TYPE complaint_status_type AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'REOPENED');
CREATE TYPE priority_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE media_type_enum AS ENUM ('PHOTO', 'VIDEO', 'AUDIO');
CREATE TYPE media_stage_enum AS ENUM ('BEFORE', 'AFTER', 'INVESTIGATION');
CREATE TYPE submission_source_enum AS ENUM ('MOBILE_APP', 'AI_BOT', 'WEB_PORTAL', 'CALL_CENTER');

-- ----------------------------------------------------------------------------
-- 1. USERS & ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(150),
    role user_role_type DEFAULT 'CITIZEN' NOT NULL,
    preferred_language VARCHAR(5) DEFAULT 'en' NOT NULL, -- 'en' or 'hi'
    fcm_token TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_guest BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2. DEPARTMENTS & WARDS
-- ----------------------------------------------------------------------------
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- 'SAN', 'ROADS', 'ELEC', 'SEW', etc.
    description TEXT,
    helpline_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_number INT UNIQUE NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    zone_name VARCHAR(100) NOT NULL,
    councillor_name VARCHAR(100),
    councillor_phone VARCHAR(20),
    councillor_email VARCHAR(150),
    office_address TEXT,
    boundary GEOMETRY(Polygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id),
    ward_id UUID REFERENCES wards(id),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    active_complaint_count INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES & SUB-CATEGORIES WITH SLA RULES
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id),
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    default_sla_hours INT DEFAULT 48 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE sub_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    sla_hours INT,
    default_priority priority_type DEFAULT 'MEDIUM' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- ----------------------------------------------------------------------------
-- 4. COMPLAINTS & TRACKING
-- ----------------------------------------------------------------------------
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_number VARCHAR(25) UNIQUE NOT NULL, -- e.g. FC-2026-000123
    citizen_id UUID NOT NULL REFERENCES users(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    sub_category_id UUID REFERENCES sub_categories(id),
    ward_id UUID REFERENCES wards(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    assigned_officer_id UUID REFERENCES officers(id),
    
    title VARCHAR(150) NOT NULL,
    description TEXT,
    voice_note_url TEXT,
    
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    address TEXT NOT NULL,
    landmark VARCHAR(150),
    
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    status complaint_status_type DEFAULT 'SUBMITTED' NOT NULL,
    priority priority_type DEFAULT 'MEDIUM' NOT NULL,
    source submission_source_enum DEFAULT 'MOBILE_APP' NOT NULL,
    
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    is_escalated BOOLEAN DEFAULT FALSE NOT NULL,
    escalation_level INT DEFAULT 0 NOT NULL,
    
    upvotes_count INT DEFAULT 0 NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE complaint_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    uploaded_by_id UUID NOT NULL REFERENCES users(id),
    media_type media_type_enum DEFAULT 'PHOTO' NOT NULL,
    stage media_stage_enum DEFAULT 'BEFORE' NOT NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    changed_by_id UUID NOT NULL REFERENCES users(id),
    old_status complaint_status_type,
    new_status complaint_status_type NOT NULL,
    remarks TEXT,
    proof_media_id UUID REFERENCES complaint_media(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    comment_text TEXT NOT NULL,
    is_internal_note BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_complaint_upvote UNIQUE(complaint_id, user_id)
);

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID UNIQUE NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES users(id),
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    feedback_text TEXT,
    is_reopened BOOLEAN DEFAULT FALSE NOT NULL,
    reopen_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE sla_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    escalation_level INT NOT NULL,
    previous_officer_id UUID REFERENCES officers(id),
    escalated_to_officer_id UUID REFERENCES officers(id),
    reason TEXT NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    complaint_id UUID REFERENCES complaints(id),
    title VARCHAR(150) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(20) DEFAULT 'IN_APP',
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    data_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE broadcast_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_id UUID NOT NULL REFERENCES users(id),
    ward_id UUID REFERENCES wards(id), -- NULL means city-wide
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    priority priority_type DEFAULT 'MEDIUM' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 5. AI CHATBOT TABLES & KNOWLEDGE BASE
-- ----------------------------------------------------------------------------
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('USER', 'BOT', 'SYSTEM')),
    message_text TEXT NOT NULL,
    voice_note_url TEXT,
    intent_detected VARCHAR(50),
    tool_calls JSONB,
    tool_results JSONB,
    satisfaction_rating BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE faq_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id),
    department_id UUID REFERENCES departments(id),
    question_en TEXT NOT NULL,
    question_hi TEXT NOT NULL,
    answer_en TEXT NOT NULL,
    answer_hi TEXT NOT NULL,
    embedding vector(1536),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_complaints_location ON complaints USING GIST(location);
CREATE INDEX idx_wards_boundary ON wards USING GIST(boundary);
CREATE INDEX idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX idx_complaints_assigned_officer ON complaints(assigned_officer_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_ward ON complaints(ward_id);
CREATE INDEX idx_complaints_sla_deadline ON complaints(sla_deadline) WHERE status NOT IN ('RESOLVED', 'REJECTED');
CREATE INDEX idx_complaints_complaint_number ON complaints(complaint_number);
CREATE INDEX idx_faq_embedding ON faq_knowledge_base USING hnsw (embedding vector_cosine_ops);
