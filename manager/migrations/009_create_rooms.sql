-- Migration 009: Create rooms Table
-- Description: Meeting rooms scheduled through secretary
-- Author: System
-- Date: 2025-11-08

CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL,
    department_id BIGINT NULL,  -- NULL if room is not department-specific
    livekit_room_id VARCHAR(255) NULL,  -- Populated when room goes ACTIVE
    title VARCHAR(500) NOT NULL,
    custom_prompt TEXT NULL,
    status room_status NOT NULL DEFAULT 'SCHEDULED',
    scheduled_at TIMESTAMPTZ NULL,
    started_at TIMESTAMPTZ NULL,
    ended_at TIMESTAMPTZ NULL,
    magic_link_token VARCHAR(64) UNIQUE NULL,
    password_hash VARCHAR(255) NOT NULL,  -- 8-digit password (hashed)
    max_participants INTEGER NOT NULL DEFAULT 10,
    recording_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT rooms_title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT rooms_custom_prompt_length CHECK (LENGTH(custom_prompt) <= 8000),
    CONSTRAINT rooms_max_participants_range CHECK (max_participants BETWEEN 2 AND 500),
    CONSTRAINT rooms_timeline_valid CHECK (
        (started_at IS NULL OR ended_at IS NULL OR started_at < ended_at) AND
        (scheduled_at IS NULL OR started_at IS NULL OR scheduled_at <= started_at)
    ),
    
    -- Foreign keys
    CONSTRAINT fk_rooms_entity 
        FOREIGN KEY (entity_id) 
        REFERENCES entities(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_rooms_department 
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_rooms_entity_id ON rooms(entity_id);
CREATE INDEX idx_rooms_department_id ON rooms(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_rooms_livekit_room_id ON rooms(livekit_room_id) WHERE livekit_room_id IS NOT NULL;
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_magic_link_token ON rooms(magic_link_token) WHERE magic_link_token IS NOT NULL;
CREATE INDEX idx_rooms_scheduled_at ON rooms(scheduled_at DESC) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);
CREATE INDEX idx_rooms_status_scheduled_at ON rooms(status, scheduled_at DESC);

-- Full-text search on title and custom_prompt
CREATE INDEX idx_rooms_search_fts ON rooms 
    USING gin(to_tsvector('english', title || ' ' || COALESCE(custom_prompt, '')));

-- Comments
COMMENT ON TABLE rooms IS 'Meeting rooms managed by secretary';
COMMENT ON COLUMN rooms.id IS 'Primary key';
COMMENT ON COLUMN rooms.entity_id IS 'Foreign key to entities';
COMMENT ON COLUMN rooms.department_id IS 'Foreign key to departments (NULL = general room)';
COMMENT ON COLUMN rooms.livekit_room_id IS 'LiveKit room identifier (populated when room goes ACTIVE)';
COMMENT ON COLUMN rooms.title IS 'Meeting title/description';
COMMENT ON COLUMN rooms.custom_prompt IS 'Custom AI prompt for this specific room (overrides department/entity)';
COMMENT ON COLUMN rooms.status IS 'Room status (SCHEDULED, ACTIVE, COMPLETED, CANCELLED)';
COMMENT ON COLUMN rooms.scheduled_at IS 'Scheduled start time';
COMMENT ON COLUMN rooms.started_at IS 'Actual start time (when first participant joins)';
COMMENT ON COLUMN rooms.ended_at IS 'Actual end time (when last participant leaves)';
COMMENT ON COLUMN rooms.magic_link_token IS 'Unique token for magic link access';
COMMENT ON COLUMN rooms.password_hash IS 'Bcrypt hash of 8-digit password';
COMMENT ON COLUMN rooms.max_participants IS 'Maximum number of participants allowed';
COMMENT ON COLUMN rooms.recording_enabled IS 'Whether to record this room';
COMMENT ON COLUMN rooms.created_at IS 'Room creation timestamp';
COMMENT ON COLUMN rooms.updated_at IS 'Last update timestamp';
