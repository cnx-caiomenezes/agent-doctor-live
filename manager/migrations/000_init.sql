-- Migration 000: Initialize Database
-- Description: Create database if not exists
-- Author: System
-- Date: 2025-11-08

-- Create database if not exists (requires superuser or CREATEDB privilege)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_database WHERE datname = 'agent_doctor_live'
    ) THEN
        CREATE DATABASE agent_doctor_live
            ENCODING = 'UTF8'
            LC_COLLATE = 'en_US.UTF-8'
            LC_CTYPE = 'en_US.UTF-8'
            TEMPLATE = template0;
    END IF;
END
$$;

-- Connect to the database
\c agent_doctor_live;

-- Set timezone
SET timezone = 'UTC';

-- Create comments
COMMENT ON DATABASE agent_doctor_live IS 'Agent Doctor Live - AI-Powered Video Meeting Platform';
