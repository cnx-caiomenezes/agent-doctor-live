-- Migration 004: Create entities Table
-- Description: Organizations (clinics, hospitals, agencies) using the platform
-- Author: System
-- Date: 2025-11-08

CREATE TABLE entities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type entity_type NOT NULL DEFAULT 'other',
    default_instructions TEXT NULL,
    max_participants INTEGER NOT NULL DEFAULT 50,
    recording_retention_days INTEGER NOT NULL DEFAULT 90,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT entities_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT entities_max_participants_range CHECK (max_participants BETWEEN 2 AND 500),
    CONSTRAINT entities_retention_range CHECK (recording_retention_days BETWEEN 1 AND 3650),
    CONSTRAINT entities_instructions_length CHECK (LENGTH(default_instructions) <= 8000)
);

-- Indexes
CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_active ON entities(active) WHERE active = true;
CREATE INDEX idx_entities_created_at ON entities(created_at DESC);

-- Full-text search index on instructions
CREATE INDEX idx_entities_instructions_fts ON entities USING gin(to_tsvector('english', COALESCE(default_instructions, '')));

-- Comments
COMMENT ON TABLE entities IS 'Organizations using the platform (clinics, agencies, etc.)';
COMMENT ON COLUMN entities.id IS 'Primary key';
COMMENT ON COLUMN entities.name IS 'Entity name (e.g., "Clínica Cardio Saúde")';
COMMENT ON COLUMN entities.type IS 'Type of organization';
COMMENT ON COLUMN entities.default_instructions IS 'Default AI instructions for all rooms in this entity (max 8000 chars)';
COMMENT ON COLUMN entities.max_participants IS 'Maximum participants allowed per room (2-500)';
COMMENT ON COLUMN entities.recording_retention_days IS 'Days to retain recordings before purging (1-3650)';
COMMENT ON COLUMN entities.active IS 'Entity active status';
COMMENT ON COLUMN entities.created_at IS 'Entity creation timestamp';
COMMENT ON COLUMN entities.updated_at IS 'Last update timestamp';

-- Add foreign key from users to entities (deferred to maintain migration order)
ALTER TABLE users 
    ADD CONSTRAINT fk_users_entity 
    FOREIGN KEY (entity_id) 
    REFERENCES entities(id) 
    ON DELETE SET NULL;

CREATE INDEX idx_users_entity_fk ON users(entity_id);
