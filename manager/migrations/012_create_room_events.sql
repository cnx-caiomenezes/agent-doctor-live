-- Migration 012: Create room_events Table
-- Description: Event log for room lifecycle (LiveKit webhooks)
-- Author: System
-- Date: 2025-11-08

CREATE TABLE room_events (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT room_events_type_not_empty CHECK (LENGTH(TRIM(event_type)) > 0),
    
    -- Foreign keys
    CONSTRAINT fk_room_events_room 
        FOREIGN KEY (room_id) 
        REFERENCES rooms(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_room_events_room_id ON room_events(room_id);
CREATE INDEX idx_room_events_type ON room_events(event_type);
CREATE INDEX idx_room_events_created_at ON room_events(created_at DESC);
CREATE INDEX idx_room_events_room_created ON room_events(room_id, created_at DESC);

-- GIN index on event_data JSONB
CREATE INDEX idx_room_events_data ON room_events USING gin(event_data);

-- Comments
COMMENT ON TABLE room_events IS 'Event log for room lifecycle (from LiveKit webhooks)';
COMMENT ON COLUMN room_events.id IS 'Primary key';
COMMENT ON COLUMN room_events.room_id IS 'Foreign key to rooms';
COMMENT ON COLUMN room_events.event_type IS 'Event type (e.g., "room_started", "participant_joined", "participant_left")';
COMMENT ON COLUMN room_events.event_data IS 'Event payload (JSONB)';
COMMENT ON COLUMN room_events.created_at IS 'Event timestamp';
