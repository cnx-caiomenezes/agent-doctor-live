-- Migration 006: Create professionals Table
-- Description: Professional users (doctors, designers, consultants)
-- Author: System
-- Date: 2025-11-08

CREATE TABLE professionals (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    specialty VARCHAR(255) NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT professionals_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT professionals_email_format CHECK (
        email IS NULL OR 
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT professionals_contact_required CHECK (
        email IS NOT NULL OR phone IS NOT NULL
    ),
    CONSTRAINT professionals_email_unique UNIQUE (email)
);

-- Indexes
CREATE INDEX idx_professionals_name ON professionals(name);
CREATE INDEX idx_professionals_email ON professionals(email) WHERE email IS NOT NULL;
CREATE INDEX idx_professionals_phone ON professionals(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_professionals_specialty ON professionals(specialty) WHERE specialty IS NOT NULL;
CREATE INDEX idx_professionals_active ON professionals(active) WHERE active = true;

-- Full-text search on name and specialty
CREATE INDEX idx_professionals_search_fts ON professionals 
    USING gin(to_tsvector('english', name || ' ' || COALESCE(specialty, '')));

-- Comments
COMMENT ON TABLE professionals IS 'Professional users (doctors, designers, consultants, etc.)';
COMMENT ON COLUMN professionals.id IS 'Primary key';
COMMENT ON COLUMN professionals.name IS 'Professional full name';
COMMENT ON COLUMN professionals.email IS 'Professional email address (optional)';
COMMENT ON COLUMN professionals.phone IS 'Professional phone number (optional)';
COMMENT ON COLUMN professionals.specialty IS 'Professional specialty (e.g., "Cardiologista", "UI Designer")';
COMMENT ON COLUMN professionals.active IS 'Professional active status';
COMMENT ON COLUMN professionals.created_at IS 'Professional creation timestamp';
COMMENT ON COLUMN professionals.updated_at IS 'Last update timestamp';
