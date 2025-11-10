-- Migration 010: Create participants Table
-- Description: Individuals who can participate in rooms (HUMAN or AGENT)
-- Author: System
-- Date: 2025-11-08

CREATE TABLE participants (
    id BIGSERIAL PRIMARY KEY,
    professional_id BIGINT NULL,  -- NULL for non-professional participants (clients, patients)
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    type participant_type NOT NULL DEFAULT 'HUMAN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT participants_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT participants_email_format CHECK (
        email IS NULL OR 
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT participants_contact_for_human CHECK (
        type = 'AGENT' OR email IS NOT NULL OR phone IS NOT NULL
    ),
    
    -- Foreign keys
    CONSTRAINT fk_participants_professional 
        FOREIGN KEY (professional_id) 
        REFERENCES professionals(id) 
        ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_participants_professional_id ON participants(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX idx_participants_name ON participants(name);
CREATE INDEX idx_participants_email ON participants(email) WHERE email IS NOT NULL;
CREATE INDEX idx_participants_phone ON participants(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_participants_type ON participants(type);

-- Full-text search on name
CREATE INDEX idx_participants_name_fts ON participants 
    USING gin(to_tsvector('english', name));

-- Comments
COMMENT ON TABLE participants IS 'Individuals who participate in rooms (clients, professionals, agents)';
COMMENT ON COLUMN participants.id IS 'Primary key';
COMMENT ON COLUMN participants.professional_id IS 'Foreign key to professionals (NULL for non-professional participants)';
COMMENT ON COLUMN participants.name IS 'Participant full name';
COMMENT ON COLUMN participants.email IS 'Participant email address';
COMMENT ON COLUMN participants.phone IS 'Participant phone number';
COMMENT ON COLUMN participants.type IS 'Participant type (HUMAN or AGENT)';
COMMENT ON COLUMN participants.created_at IS 'Participant creation timestamp';
COMMENT ON COLUMN participants.updated_at IS 'Last update timestamp';
