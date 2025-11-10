-- Migration 001: Enable PostgreSQL Extensions
-- Description: Enable pgvector for embedding storage and uuid-ossp for UUID generation
-- Author: System
-- Date: 2025-11-08

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN
        RAISE EXCEPTION 'pgvector extension failed to install';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
    ) THEN
        RAISE EXCEPTION 'uuid-ossp extension failed to install';
    END IF;
END
$$;

-- Add comments
COMMENT ON EXTENSION vector IS 'Vector similarity search for AI embeddings';
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions';
