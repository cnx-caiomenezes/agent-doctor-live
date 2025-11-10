-- Migration 007: Create professional_entities Junction Table
-- Description: Many-to-many relationship between professionals and entities
-- Author: System
-- Date: 2025-11-08

CREATE TABLE professional_entities (
    id BIGSERIAL PRIMARY KEY,
    professional_id BIGINT NOT NULL,
    entity_id BIGINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT professional_entities_unique UNIQUE (professional_id, entity_id),
    
    -- Foreign keys
    CONSTRAINT fk_professional_entities_professional 
        FOREIGN KEY (professional_id) 
        REFERENCES professionals(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_professional_entities_entity 
        FOREIGN KEY (entity_id) 
        REFERENCES entities(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_professional_entities_professional ON professional_entities(professional_id);
CREATE INDEX idx_professional_entities_entity ON professional_entities(entity_id);
CREATE INDEX idx_professional_entities_active ON professional_entities(active) WHERE active = true;
CREATE INDEX idx_professional_entities_professional_active ON professional_entities(professional_id, active) WHERE active = true;
CREATE INDEX idx_professional_entities_entity_active ON professional_entities(entity_id, active) WHERE active = true;

-- Comments
COMMENT ON TABLE professional_entities IS 'Many-to-many relationship between professionals and entities';
COMMENT ON COLUMN professional_entities.id IS 'Primary key';
COMMENT ON COLUMN professional_entities.professional_id IS 'Foreign key to professionals';
COMMENT ON COLUMN professional_entities.entity_id IS 'Foreign key to entities';
COMMENT ON COLUMN professional_entities.active IS 'Link active status (can deactivate without deleting)';
COMMENT ON COLUMN professional_entities.created_at IS 'Link creation timestamp';
COMMENT ON COLUMN professional_entities.updated_at IS 'Last update timestamp';
