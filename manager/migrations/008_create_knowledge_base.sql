-- Migration 008: Create knowledge_base Table
-- Description: Document chunks with vector embeddings for AI context retrieval
-- Author: System
-- Date: 2025-11-08

CREATE TABLE knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    entity_id BIGINT NOT NULL,
    department_id BIGINT NULL,  -- NULL means applies to entire entity
    filename VARCHAR(500) NOT NULL,
    s3_key VARCHAR(1000) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,  -- OpenAI text-embedding-3-small dimensions
    chunk_index INTEGER NOT NULL,
    total_chunks INTEGER NOT NULL,
    metadata JSONB NULL DEFAULT '{}'::jsonb,
    indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT knowledge_base_filename_not_empty CHECK (LENGTH(TRIM(filename)) > 0),
    CONSTRAINT knowledge_base_s3_key_not_empty CHECK (LENGTH(TRIM(s3_key)) > 0),
    CONSTRAINT knowledge_base_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
    CONSTRAINT knowledge_base_chunk_index_positive CHECK (chunk_index >= 0),
    CONSTRAINT knowledge_base_total_chunks_positive CHECK (total_chunks > 0),
    CONSTRAINT knowledge_base_chunk_index_valid CHECK (chunk_index < total_chunks),
    
    -- Foreign keys
    CONSTRAINT fk_knowledge_base_entity 
        FOREIGN KEY (entity_id) 
        REFERENCES entities(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_knowledge_base_department 
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_knowledge_base_entity_id ON knowledge_base(entity_id);
CREATE INDEX idx_knowledge_base_department_id ON knowledge_base(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_knowledge_base_filename ON knowledge_base(filename);
CREATE INDEX idx_knowledge_base_s3_key ON knowledge_base(s3_key);
CREATE INDEX idx_knowledge_base_indexed_at ON knowledge_base(indexed_at DESC);

-- HNSW index for fast vector similarity search (cosine distance)
CREATE INDEX idx_knowledge_base_embedding_hnsw ON knowledge_base 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- GIN index on metadata JSONB
CREATE INDEX idx_knowledge_base_metadata ON knowledge_base USING gin(metadata);

-- Full-text search on content
CREATE INDEX idx_knowledge_base_content_fts ON knowledge_base 
    USING gin(to_tsvector('english', content));

-- Composite index for common query pattern
CREATE INDEX idx_knowledge_base_entity_dept ON knowledge_base(entity_id, department_id);

-- Comments
COMMENT ON TABLE knowledge_base IS 'Document chunks with vector embeddings for AI context retrieval';
COMMENT ON COLUMN knowledge_base.id IS 'Primary key';
COMMENT ON COLUMN knowledge_base.entity_id IS 'Foreign key to entities';
COMMENT ON COLUMN knowledge_base.department_id IS 'Foreign key to departments (NULL = applies to all departments)';
COMMENT ON COLUMN knowledge_base.filename IS 'Original filename of uploaded document';
COMMENT ON COLUMN knowledge_base.s3_key IS 'S3/MinIO object key for original file';
COMMENT ON COLUMN knowledge_base.content IS 'Text content of this chunk';
COMMENT ON COLUMN knowledge_base.embedding IS '768-dimensional vector embedding from OpenAI';
COMMENT ON COLUMN knowledge_base.chunk_index IS 'Index of this chunk (0-based)';
COMMENT ON COLUMN knowledge_base.total_chunks IS 'Total number of chunks for this document';
COMMENT ON COLUMN knowledge_base.metadata IS 'Additional metadata (page numbers, headers, etc.)';
COMMENT ON COLUMN knowledge_base.indexed_at IS 'When this chunk was indexed/embedded';
COMMENT ON COLUMN knowledge_base.created_at IS 'Chunk creation timestamp';
COMMENT ON COLUMN knowledge_base.updated_at IS 'Last update timestamp';
