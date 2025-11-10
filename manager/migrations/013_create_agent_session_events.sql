-- Migration 013: Create agent_session_events Table
-- Description: Detailed event log for AI agent sessions
-- Author: System
-- Date: 2025-11-08

CREATE TABLE agent_session_events (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    agent_participant_id BIGINT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT agent_session_events_type_not_empty CHECK (LENGTH(TRIM(event_type)) > 0),
    
    -- Foreign keys
    CONSTRAINT fk_agent_session_events_room 
        FOREIGN KEY (room_id) 
        REFERENCES rooms(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_agent_session_events_participant 
        FOREIGN KEY (agent_participant_id) 
        REFERENCES participants(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_agent_session_events_room_id ON agent_session_events(room_id);
CREATE INDEX idx_agent_session_events_agent_id ON agent_session_events(agent_participant_id);
CREATE INDEX idx_agent_session_events_type ON agent_session_events(event_type);
CREATE INDEX idx_agent_session_events_created_at ON agent_session_events(created_at DESC);
CREATE INDEX idx_agent_session_events_room_created ON agent_session_events(room_id, created_at DESC);

-- GIN index on event_data JSONB
CREATE INDEX idx_agent_session_events_data ON agent_session_events USING gin(event_data);

-- Comments
COMMENT ON TABLE agent_session_events IS 'Detailed event log for AI agent sessions (transcripts, responses, context retrievals)';
COMMENT ON COLUMN agent_session_events.id IS 'Primary key';
COMMENT ON COLUMN agent_session_events.room_id IS 'Foreign key to rooms';
COMMENT ON COLUMN agent_session_events.agent_participant_id IS 'Foreign key to participants (must be type AGENT)';
COMMENT ON COLUMN agent_session_events.event_type IS 'Event type (e.g., "speech_recognized", "context_retrieved", "response_generated")';
COMMENT ON COLUMN agent_session_events.event_data IS 'Event payload (transcripts, embeddings, context chunks, etc.)';
COMMENT ON COLUMN agent_session_events.created_at IS 'Event timestamp';
