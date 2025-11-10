-- Migration 002: Create ENUM Types
-- Description: Define ENUM types for user roles, participant types, and room status
-- Author: System
-- Date: 2025-11-08

-- User role ENUM
CREATE TYPE user_role AS ENUM (
    'MANAGER',        -- Platform administrator with full access
    'ENTITY_ADMIN',   -- Entity administrator managing their organization
    'PROFESSIONAL'    -- Professional user (medical/consulting)
);

COMMENT ON TYPE user_role IS 'User role for authorization and access control';

-- Participant type ENUM
CREATE TYPE participant_type AS ENUM (
    'HUMAN',  -- Human participant (client, professional, organizer)
    'AGENT'   -- AI agent participant
);

COMMENT ON TYPE participant_type IS 'Type of participant in a meeting room';

-- Room status ENUM
CREATE TYPE room_status AS ENUM (
    'SCHEDULED',  -- Room scheduled but not started
    'ACTIVE',     -- Room currently in progress
    'COMPLETED',  -- Room finished successfully
    'CANCELLED'   -- Room cancelled before completion
);

COMMENT ON TYPE room_status IS 'Current status of a meeting room';

-- Entity type ENUM (optional but useful for filtering)
CREATE TYPE entity_type AS ENUM (
    'medical_clinic',
    'hospital',
    'design_agency',
    'consulting_firm',
    'other'
);

COMMENT ON TYPE entity_type IS 'Type of entity/organization';
