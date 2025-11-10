-- Migration 003: Create users Table
-- Description: User authentication and authorization
-- Author: System
-- Date: 2025-11-08

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'PROFESSIONAL',
    entity_id BIGINT NULL,  -- NULL for MANAGER, required for ENTITY_ADMIN
    active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_manager_no_entity CHECK (
        (role = 'MANAGER' AND entity_id IS NULL) OR 
        (role != 'MANAGER')
    ),
    CONSTRAINT users_entity_admin_has_entity CHECK (
        (role = 'ENTITY_ADMIN' AND entity_id IS NOT NULL) OR 
        (role != 'ENTITY_ADMIN')
    )
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_entity_id ON users(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_users_active ON users(active) WHERE active = true;
CREATE INDEX idx_users_last_login ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL;

-- Comments
COMMENT ON TABLE users IS 'User accounts for authentication and authorization';
COMMENT ON COLUMN users.id IS 'Primary key';
COMMENT ON COLUMN users.email IS 'Unique email address for login';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (cost factor 10)';
COMMENT ON COLUMN users.role IS 'User role: MANAGER (platform admin), ENTITY_ADMIN (organization admin), PROFESSIONAL';
COMMENT ON COLUMN users.entity_id IS 'Foreign key to entities table (NULL for MANAGER, required for ENTITY_ADMIN)';
COMMENT ON COLUMN users.active IS 'Account active status';
COMMENT ON COLUMN users.last_login_at IS 'Last successful login timestamp';
COMMENT ON COLUMN users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN users.updated_at IS 'Last update timestamp (managed by trigger)';
