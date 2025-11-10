-- Migration 016: Create Triggers
-- Description: Automated trigger functions for timestamps, durations, and purge dates
-- Author: System
-- Date: 2025-11-08

-- ============================================================
-- Trigger Function: update_updated_at_column
-- Description: Automatically update updated_at timestamp on row modification
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Apply update_updated_at trigger to all tables with updated_at column
-- ============================================================
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_professional_entities_updated_at
    BEFORE UPDATE ON professional_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_room_participants_updated_at
    BEFORE UPDATE ON room_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_agent_usage_updated_at
    BEFORE UPDATE ON agent_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_recordings_updated_at
    BEFORE UPDATE ON recordings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Trigger Function: calculate_agent_duration
-- Description: Calculate duration_seconds when agent session ends
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_agent_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_usage_calculate_duration
    BEFORE UPDATE ON agent_usage
    FOR EACH ROW
    EXECUTE FUNCTION calculate_agent_duration();

-- ============================================================
-- Trigger Function: set_recording_purge_date
-- Description: Calculate purge_at based on entity's recording_retention_days
-- ============================================================
CREATE OR REPLACE FUNCTION set_recording_purge_date()
RETURNS TRIGGER AS $$
DECLARE
    retention_days INTEGER;
BEGIN
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        -- Get retention days from entity through room
        SELECT e.recording_retention_days INTO retention_days
        FROM rooms r
        JOIN entities e ON r.entity_id = e.id
        WHERE r.id = NEW.room_id;
        
        IF retention_days IS NOT NULL THEN
            NEW.purge_at = NEW.completed_at + (retention_days || ' days')::INTERVAL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recordings_set_purge_date
    BEFORE UPDATE ON recordings
    FOR EACH ROW
    EXECUTE FUNCTION set_recording_purge_date();

-- ============================================================
-- Comments on trigger functions
-- ============================================================
COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';
COMMENT ON FUNCTION calculate_agent_duration() IS 'Trigger function to calculate agent session duration_seconds when ended_at is set';
COMMENT ON FUNCTION set_recording_purge_date() IS 'Trigger function to calculate recording purge_at based on entity retention policy';
