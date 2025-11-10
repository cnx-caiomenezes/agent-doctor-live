-- Migration 011: Create room_participants Junction Table
-- Description: Participants assigned to specific rooms
-- Author: System
-- Date: 2025-11-08

CREATE TABLE room_participants (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    livekit_participant_identity VARCHAR(255) NULL,  -- Populated when participant joins LiveKit
    joined_at TIMESTAMPTZ NULL,
    left_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT room_participants_unique UNIQUE (room_id, participant_id),
    CONSTRAINT room_participants_timeline_valid CHECK (
        joined_at IS NULL OR left_at IS NULL OR joined_at < left_at
    ),
    
    -- Foreign keys
    CONSTRAINT fk_room_participants_room 
        FOREIGN KEY (room_id) 
        REFERENCES rooms(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_room_participants_participant 
        FOREIGN KEY (participant_id) 
        REFERENCES participants(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_room_participants_room ON room_participants(room_id);
CREATE INDEX idx_room_participants_participant ON room_participants(participant_id);
CREATE INDEX idx_room_participants_livekit_identity ON room_participants(livekit_participant_identity) WHERE livekit_participant_identity IS NOT NULL;
CREATE INDEX idx_room_participants_joined_at ON room_participants(joined_at DESC) WHERE joined_at IS NOT NULL;
CREATE INDEX idx_room_participants_active ON room_participants(room_id) WHERE joined_at IS NOT NULL AND left_at IS NULL;

-- Comments
COMMENT ON TABLE room_participants IS 'Junction table linking participants to rooms';
COMMENT ON COLUMN room_participants.id IS 'Primary key';
COMMENT ON COLUMN room_participants.room_id IS 'Foreign key to rooms';
COMMENT ON COLUMN room_participants.participant_id IS 'Foreign key to participants';
COMMENT ON COLUMN room_participants.livekit_participant_identity IS 'LiveKit participant identity (populated on join)';
COMMENT ON COLUMN room_participants.joined_at IS 'When participant joined the room';
COMMENT ON COLUMN room_participants.left_at IS 'When participant left the room';
COMMENT ON COLUMN room_participants.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN room_participants.updated_at IS 'Last update timestamp';
