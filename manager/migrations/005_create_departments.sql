-- Migration 005: Create departments Table
-- Description: Departments within entities (e.g., Cardiology, Neurology, UI/UX)
-- Author: System
-- Date: 2025-11-08

CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    custom_instructions TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT departments_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT departments_instructions_length CHECK (LENGTH(custom_instructions) <= 8000),
    CONSTRAINT departments_unique_name_per_entity UNIQUE (entity_id, name),
    
    -- Foreign keys
    CONSTRAINT fk_departments_entity 
        FOREIGN KEY (entity_id) 
        REFERENCES entities(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_departments_entity_id ON departments(entity_id);
CREATE INDEX idx_departments_name ON departments(name);
CREATE INDEX idx_departments_active ON departments(active) WHERE active = true;
CREATE INDEX idx_departments_entity_active ON departments(entity_id, active) WHERE active = true;

-- Full-text search on instructions
CREATE INDEX idx_departments_instructions_fts ON departments USING gin(to_tsvector('english', COALESCE(custom_instructions, '')));

-- Comments
COMMENT ON TABLE departments IS 'Departments/specialties within entities';
COMMENT ON COLUMN departments.id IS 'Primary key';
COMMENT ON COLUMN departments.entity_id IS 'Foreign key to entities';
COMMENT ON COLUMN departments.name IS 'Department name (e.g., "Cardiologia", "UI/UX Design")';
COMMENT ON COLUMN departments.custom_instructions IS 'Custom AI instructions for this department (max 8000 chars)';
COMMENT ON COLUMN departments.active IS 'Department active status';
COMMENT ON COLUMN departments.created_at IS 'Department creation timestamp';
COMMENT ON COLUMN departments.updated_at IS 'Last update timestamp';
