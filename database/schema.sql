-- ============================================================================
-- FIC CITY - CIVIC COMPLAINT & MUNICIPAL RESOLUTION SYSTEM
-- Complete PostgreSQL + PostGIS Schema (Updated with RBAC & Location Fields)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
CREATE TYPE employee_role_type AS ENUM ('SUPER_ADMIN', 'DEPT_HEAD', 'JE', 'FIELD_STAFF');
CREATE TYPE complaint_status_type AS ENUM ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'REOPENED');
CREATE TYPE priority_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE media_stage_enum AS ENUM ('BEFORE', 'AFTER', 'INVESTIGATION');

-- ----------------------------------------------------------------------------
-- 1. CITIZEN USERS (Public Citizen Accounts)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    ward_id UUID REFERENCES wards(id),
    preferred_language VARCHAR(5) DEFAULT 'en' NOT NULL,
    fcm_token TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2. EMPLOYEES & MUNICIPAL STAFF (Internal RBAC Accounts - No Public Signup)
-- ----------------------------------------------------------------------------
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. MCD-ADMIN-001, JE-SAN-1044
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role employee_role_type DEFAULT 'FIELD_STAFF' NOT NULL,
    department_id UUID REFERENCES departments(id),
    ward_id UUID REFERENCES wards(id),
    designation VARCHAR(100) NOT NULL,
    failed_attempts INT DEFAULT 0 NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    must_change_password BOOLEAN DEFAULT TRUE NOT NULL, -- Forces change on 1st login
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 3. JURISDICTIONS (DEPARTMENTS & WARDS)
-- ----------------------------------------------------------------------------
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- SAN, ROADS, ELEC, SEW, WATER
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

-- ----------------------------------------------------------------------------
-- 4. CATEGORIES & SLA RULES
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
-- 5. COMPLAINTS (With Live Captured Geolocation & Reverse Geocoded Address)
-- ----------------------------------------------------------------------------
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_number VARCHAR(25) UNIQUE NOT NULL, -- e.g. FC-2026-000123
    citizen_id UUID NOT NULL REFERENCES users(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    sub_category_id UUID REFERENCES sub_categories(id),
    ward_id UUID REFERENCES wards(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    assigned_employee_id UUID REFERENCES employees(id),
    
    title VARCHAR(150) NOT NULL,
    description TEXT,
    voice_note_url TEXT,
    
    -- Live Geolocation Capture
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    address TEXT NOT NULL,
    house_flat_no VARCHAR(100),
    landmark VARCHAR(150),
    location_accuracy_meters DECIMAL(6, 2),
    location_captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    is_anonymous BOOLEAN DEFAULT FALSE NOT NULL,
    status complaint_status_type DEFAULT 'SUBMITTED' NOT NULL,
    priority priority_type DEFAULT 'MEDIUM' NOT NULL,
    source VARCHAR(20) DEFAULT 'WEB_PORTAL' NOT NULL,
    
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
    uploaded_by_id UUID NOT NULL,
    media_type VARCHAR(10) DEFAULT 'PHOTO' NOT NULL,
    stage media_stage_enum DEFAULT 'BEFORE' NOT NULL,
    media_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    changed_by_employee_id UUID REFERENCES employees(id),
    old_status complaint_status_type,
    new_status complaint_status_type NOT NULL,
    remarks TEXT,
    proof_media_id UUID REFERENCES complaint_media(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. SECURITY & AUDIT ACTIVITY LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    action VARCHAR(100) NOT NULL, -- STATUS_UPDATE, REASSIGN, USER_CREATE, PASSWORD_RESET
    complaint_id UUID REFERENCES complaints(id),
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 7. INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX idx_complaints_location ON complaints USING GIST(location);
CREATE INDEX idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX idx_complaints_assigned ON complaints(assigned_employee_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_activity_logs_employee ON activity_logs(employee_id);
