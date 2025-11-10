-- Migration 014: Create agent_usage Table
-- Description: AI agent usage metrics for billing and analytics
-- Author: System
-- Date: 2025-11-08

CREATE TABLE agent_usage (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    agent_participant_id BIGINT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ NULL,
    duration_seconds INTEGER NULL,  -- Calculated by trigger
    openai_tokens_used INTEGER NOT NULL DEFAULT 0,
    openai_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0.0,
    context_chunks_retrieved INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT agent_usage_timeline_valid CHECK (
        ended_at IS NULL OR started_at < ended_at
    ),
    CONSTRAINT agent_usage_duration_valid CHECK (
        duration_seconds IS NULL OR duration_seconds >= 0
    ),
    CONSTRAINT agent_usage_tokens_positive CHECK (openai_tokens_used >= 0),
    CONSTRAINT agent_usage_cost_positive CHECK (openai_cost_usd >= 0),
    CONSTRAINT agent_usage_chunks_positive CHECK (context_chunks_retrieved >= 0),
    
    -- Foreign keys
    CONSTRAINT fk_agent_usage_room 
        FOREIGN KEY (room_id) 
        REFERENCES rooms(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_agent_usage_participant 
        FOREIGN KEY (agent_participant_id) 
        REFERENCES participants(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_agent_usage_room_id ON agent_usage(room_id);
CREATE INDEX idx_agent_usage_agent_id ON agent_usage(agent_participant_id);
CREATE INDEX idx_agent_usage_started_at ON agent_usage(started_at DESC);
CREATE INDEX idx_agent_usage_ended_at ON agent_usage(ended_at DESC) WHERE ended_at IS NOT NULL;
CREATE INDEX idx_agent_usage_active ON agent_usage(room_id) WHERE ended_at IS NULL;

-- Comments
COMMENT ON TABLE agent_usage IS 'AI agent usage metrics for billing and analytics';
COMMENT ON COLUMN agent_usage.id IS 'Primary key';
COMMENT ON COLUMN agent_usage.room_id IS 'Foreign key to rooms';
COMMENT ON COLUMN agent_usage.agent_participant_id IS 'Foreign key to participants (must be type AGENT)';
COMMENT ON COLUMN agent_usage.started_at IS 'When agent started processing';
COMMENT ON COLUMN agent_usage.ended_at IS 'When agent stopped processing';
COMMENT ON COLUMN agent_usage.duration_seconds IS 'Total agent session duration (calculated by trigger)';
COMMENT ON COLUMN agent_usage.openai_tokens_used IS 'Total OpenAI tokens consumed';
COMMENT ON COLUMN agent_usage.openai_cost_usd IS 'Estimated cost in USD';
COMMENT ON COLUMN agent_usage.context_chunks_retrieved IS 'Number of knowledge base chunks retrieved';
COMMENT ON COLUMN agent_usage.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN agent_usage.updated_at IS 'Last update timestamp';
