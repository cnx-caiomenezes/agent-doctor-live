-- Migration 015: Create recordings Table
-- Description: Recording metadata and S3 locations
-- Author: System
-- Date: 2025-11-08

CREATE TABLE recordings (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    livekit_egress_id VARCHAR(255) NULL,  -- LiveKit egress identifier
    s3_key VARCHAR(1000) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    duration_seconds INTEGER NULL,
    file_size_bytes BIGINT NULL,
    format VARCHAR(50) NOT NULL DEFAULT 'mp4',
    started_at TIMESTAMPTZ NULL,
    completed_at TIMESTAMPTZ NULL,
    purge_at TIMESTAMPTZ NULL,  -- Calculated by trigger based on entity retention policy
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT recordings_s3_key_not_empty CHECK (LENGTH(TRIM(s3_key)) > 0),
    CONSTRAINT recordings_filename_not_empty CHECK (LENGTH(TRIM(filename)) > 0),
    CONSTRAINT recordings_format_not_empty CHECK (LENGTH(TRIM(format)) > 0),
    CONSTRAINT recordings_timeline_valid CHECK (
        started_at IS NULL OR completed_at IS NULL OR started_at < completed_at
    ),
    CONSTRAINT recordings_duration_positive CHECK (
        duration_seconds IS NULL OR duration_seconds > 0
    ),
    CONSTRAINT recordings_size_positive CHECK (
        file_size_bytes IS NULL OR file_size_bytes > 0
    ),
    
    -- Foreign keys
    CONSTRAINT fk_recordings_room 
        FOREIGN KEY (room_id) 
        REFERENCES rooms(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_recordings_room_id ON recordings(room_id);
CREATE INDEX idx_recordings_livekit_egress_id ON recordings(livekit_egress_id) WHERE livekit_egress_id IS NOT NULL;
CREATE INDEX idx_recordings_s3_key ON recordings(s3_key);
CREATE INDEX idx_recordings_started_at ON recordings(started_at DESC) WHERE started_at IS NOT NULL;
CREATE INDEX idx_recordings_completed_at ON recordings(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_recordings_purge_at ON recordings(purge_at ASC) WHERE purge_at IS NOT NULL;
CREATE INDEX idx_recordings_created_at ON recordings(created_at DESC);

-- Comments
COMMENT ON TABLE recordings IS 'Recording metadata and S3 storage locations';
COMMENT ON COLUMN recordings.id IS 'Primary key';
COMMENT ON COLUMN recordings.room_id IS 'Foreign key to rooms';
COMMENT ON COLUMN recordings.livekit_egress_id IS 'LiveKit egress identifier';
COMMENT ON COLUMN recordings.s3_key IS 'S3/MinIO object key';
COMMENT ON COLUMN recordings.filename IS 'Original/generated filename';
COMMENT ON COLUMN recordings.duration_seconds IS 'Recording duration in seconds';
COMMENT ON COLUMN recordings.file_size_bytes IS 'File size in bytes';
COMMENT ON COLUMN recordings.format IS 'Recording format (mp4, webm, etc.)';
COMMENT ON COLUMN recordings.started_at IS 'When recording started';
COMMENT ON COLUMN recordings.completed_at IS 'When recording completed';
COMMENT ON COLUMN recordings.purge_at IS 'When to automatically delete (based on entity retention policy)';
COMMENT ON COLUMN recordings.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN recordings.updated_at IS 'Last update timestamp';
