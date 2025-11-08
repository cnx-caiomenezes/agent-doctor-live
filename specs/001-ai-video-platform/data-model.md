# Data Model: AI-Powered Video/Audio Meeting Platform

**Feature**: AI-Powered Video/Audio Meeting Platform  
**Branch**: `001-ai-video-platform`  
**Created**: 2025-11-08  
**Database**: PostgreSQL (shared across all services)

---

## Overview

This document describes the complete data model for the AI-powered meeting platform. The database is shared across all services (Manager, Secretary, Agent) with logical separation via table naming conventions or schemas.

**Database Strategy**: Single PostgreSQL instance with:

- Logical separation via table prefixes or schemas
- Shared entities accessible by multiple services
- pgvector extension enabled for knowledge base

---

## Entity Relationship Diagram

```text
┌─────────────┐
│    User     │──┐
└─────────────┘  │
                 │ belongs_to
┌─────────────┐  │
│   Entity    │◄─┘
└─────────────┘
       │
       │ has_many
       ▼
┌─────────────┐
│ Department  │
└─────────────┘
       │
       │ has_many (via ProfessionalEntity)
       ▼
┌──────────────┐       ┌───────────────────┐
│ Professional │◄─────►│ ProfessionalEntity│
└──────────────┘       └───────────────────┘
       │                        │
       │ references             │ belongs_to
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│ Participant │          │ Department  │
└─────────────┘          └─────────────┘
       │
       │ belongs_to_many (via RoomParticipant)
       ▼
┌─────────────┐       ┌──────────────────┐
│    Room     │◄─────►│ RoomParticipant  │
└─────────────┘       └──────────────────┘
       │
       ├───► has_many
       │      ┌──────────────┐
       ├─────►│  RoomEvent   │
       │      └──────────────┘
       │
       ├───── has_many
       │      ┌────────────────────┐
       ├─────►│ AgentSessionEvent  │
       │      └────────────────────┘
       │
       ├───── has_many
       │      ┌─────────────┐
       ├─────►│ AgentUsage  │
       │      └─────────────┘
       │
       └───── has_many
              ┌──────────────┐
              │  Recording   │
              └──────────────┘

┌──────────────┐
│    Entity    │─────► has_many
└──────────────┘       ┌──────────────────┐
                       │ KnowledgeBase    │
                       └──────────────────┘
```

---

## Manager Service Entities

### 1. User

**Purpose**: Backoffice authentication and user management for administrators and staff

**Table**: `users`

**Ownership**: Manager service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(254) | UNIQUE, NOT NULL | User email for authentication |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt hashed password (cost factor 10) |
| `phone_number` | VARCHAR(20) | NOT NULL, INDEX | Phone number for contact |
| `role` | ENUM | NOT NULL | 'MANAGER' or 'ENTITY_ADMIN' |
| `entity_id` | INTEGER | NULLABLE, FK → Entity.id | Associated entity (NULL for MANAGER role) |
| `active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_entity ON users(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_users_active ON users(active) WHERE active = true;
```

**Validation Rules**:

- Email must be valid format (RFC 5322)
- Password must be hashed with bcrypt (cost ≥ 10)
- Phone number must be E.164 format
- `entity_id` MUST be NULL when `role = 'MANAGER'`
- `entity_id` MUST NOT be NULL when `role = 'ENTITY_ADMIN'`

**Business Rules**:

- MANAGER role has access to all entities
- ENTITY_ADMIN role has access only to their assigned entity
- Soft delete via `active` flag (never hard delete for audit)

---

### 2. Entity

**Purpose**: Organizations (clinics, companies, institutions) using the platform

**Table**: `entities`

**Ownership**: Manager service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique entity identifier |
| `name` | VARCHAR(200) | NOT NULL | Organization name |
| `type` | VARCHAR(100) | NOT NULL | E.g., "medical_clinic", "design_agency", "educational_institution" |
| `default_instructions` | TEXT | NULLABLE | Default AI agent instructions for all meetings |
| `max_participants` | INTEGER | NOT NULL, DEFAULT 50 | Maximum participants per room |
| `recording_retention_days` | INTEGER | NOT NULL, DEFAULT 30 | Recording retention policy (30, 90, or 365) |
| `active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_entities_active ON entities(active) WHERE active = true;
CREATE INDEX idx_entities_type ON entities(type);
```

**Validation Rules**:

- `max_participants` must be between 2 and 1000
- `recording_retention_days` must be one of: 30, 90, 365
- `name` must be unique per active entity
- `default_instructions` max length: 8000 characters (token limit consideration)

**Business Rules**:

- Recording retention policy automatically applied to all entity meetings
- Max participants limit enforced at room creation and join time
- Default instructions combined with room-specific custom prompts

---

### 3. Department

**Purpose**: Areas/specialties within entities (e.g., Cardiology, HR, Sales)

**Table**: `departments`

**Ownership**: Manager service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique department identifier |
| `entity_id` | INTEGER | NOT NULL, FK → Entity.id | Parent entity |
| `name` | VARCHAR(100) | NOT NULL | Department name |
| `instructions` | TEXT | NULLABLE | Department-specific AI agent instructions |
| `active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_departments_entity ON departments(entity_id);
CREATE INDEX idx_departments_active ON departments(entity_id, active) WHERE active = true;
```

**Validation Rules**:

- `name` must be unique per entity
- `instructions` max length: 8000 characters

**Business Rules**:

- Department instructions are additive to entity default instructions
- Final agent prompt = entity.default_instructions + department.instructions + room.custom_prompt

---

### 4. Professional

**Purpose**: Doctors, consultants, staff members (can work for multiple entities)

**Table**: `professionals`

**Ownership**: Manager service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique professional identifier |
| `name` | VARCHAR(200) | NOT NULL | Professional full name |
| `email` | VARCHAR(254) | NULLABLE | Professional email (optional) |
| `phone_number` | VARCHAR(20) | NOT NULL, INDEX | Contact phone number |
| `external_id` | VARCHAR(254) | NULLABLE, INDEX | External system identifier |
| `license_number` | VARCHAR(100) | NULLABLE | Professional license (CRM, CREFITO, etc.) |
| `active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_professionals_phone ON professionals(phone_number);
CREATE INDEX idx_professionals_email ON professionals(email) WHERE email IS NOT NULL;
CREATE INDEX idx_professionals_external ON professionals(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_professionals_active ON professionals(active) WHERE active = true;
```

**Validation Rules**:

- Phone number must be E.164 format
- Email must be valid format if provided
- `external_id` must be unique if provided

**Business Rules**:

- Professionals can work for multiple entities (N:N via ProfessionalEntity)
- Can be "avulso" (independent) if not linked to any entity

---

### 5. ProfessionalEntity

**Purpose**: N:N relationship between Professionals and Entities with department assignment

**Table**: `professional_entities`

**Ownership**: Manager service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique relationship identifier |
| `professional_id` | INTEGER | NOT NULL, FK → Professional.id | Professional reference |
| `entity_id` | INTEGER | NOT NULL, FK → Entity.id | Entity reference |
| `department_id` | INTEGER | NULLABLE, FK → Department.id | Department assignment |
| `active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_prof_entity_professional ON professional_entities(professional_id);
CREATE INDEX idx_prof_entity_entity ON professional_entities(entity_id);
CREATE INDEX idx_prof_entity_department ON professional_entities(department_id) WHERE department_id IS NOT NULL;
CREATE UNIQUE INDEX idx_prof_entity_unique ON professional_entities(professional_id, entity_id, department_id) WHERE active = true;
```

**Validation Rules**:

- `department_id` must belong to the same `entity_id`
- Cannot have duplicate active relationships for same (professional, entity, department)

**Business Rules**:

- Professional can be assigned to multiple departments in same entity
- Professional can work for multiple entities with different department assignments

---

### 6. KnowledgeBase

**Purpose**: Vector database for AI agent context retrieval (using pgvector)

**Table**: `knowledge_base`

**Ownership**: Manager service (writes), Agent service (reads)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique chunk identifier |
| `entity_id` | INTEGER | NOT NULL, FK → Entity.id | Owner entity |
| `department_id` | INTEGER | NULLABLE, FK → Department.id | Specific department context |
| `document_name` | VARCHAR(255) | NOT NULL | Original document filename |
| `chunk_text` | TEXT | NOT NULL | Text chunk for retrieval |
| `embedding` | VECTOR(768) | NOT NULL | Vector embedding (768 dimensions) |
| `metadata` | JSONB | NOT NULL | Document metadata (page, section, etc.) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_kb_entity ON knowledge_base(entity_id);
CREATE INDEX idx_kb_department ON knowledge_base(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_kb_embedding ON knowledge_base USING hnsw (embedding vector_cosine_ops);
```

**Validation Rules**:

- `chunk_text` max length: 2000 characters (512 tokens)
- `embedding` must be 768-dimensional vector
- `metadata` must contain: `{"page": number, "chunk_index": number, "total_chunks": number}`

**Business Rules**:

- Embeddings generated using `all-mpnet-base-v2` model
- Chunks overlap by 50 tokens for context continuity
- Similarity search uses cosine distance
- Department-specific chunks override entity-wide chunks

---

## Secretary Service Entities

### 7. Room

**Purpose**: Scheduled or active meeting rooms

**Table**: `rooms`

**Ownership**: Secretary service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | Unique room identifier (UUID) |
| `livekit_room_id` | VARCHAR(255) | NOT NULL, UNIQUE | LiveKit room name |
| `title` | VARCHAR(200) | NOT NULL | Meeting title |
| `description` | TEXT | NULLABLE | Meeting description |
| `entity_id` | INTEGER | NULLABLE, FK → Entity.id | Associated entity (NULL for avulso) |
| `department_id` | INTEGER | NULLABLE, FK → Department.id | Associated department |
| `custom_prompt` | TEXT | NULLABLE | Room-specific AI instructions |
| `organizer_id` | INTEGER | NULLABLE, FK → User.id | Meeting organizer |
| `scheduled_at` | TIMESTAMP | NOT NULL | Scheduled start time |
| `started_at` | TIMESTAMP | NULLABLE | Actual start time |
| `ended_at` | TIMESTAMP | NULLABLE | Actual end time |
| `status` | ENUM | NOT NULL, DEFAULT 'SCHEDULED' | 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELED' |
| `max_participants` | INTEGER | NOT NULL | Capacity limit for this room |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_rooms_entity ON rooms(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_rooms_department ON rooms(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_rooms_organizer ON rooms(organizer_id) WHERE organizer_id IS NOT NULL;
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_scheduled ON rooms(scheduled_at);
CREATE INDEX idx_rooms_livekit ON rooms(livekit_room_id);
```

**Validation Rules**:

- `max_participants` inherits from entity.max_participants (cannot exceed)
- `custom_prompt` max length: 4000 characters
- `scheduled_at` must be in the future when creating
- `department_id` must belong to the same `entity_id`

**Business Rules**:

- Status transitions: SCHEDULED → ACTIVE → COMPLETED or CANCELED
- `started_at` auto-set when first participant joins
- `ended_at` auto-set when last participant leaves or organizer ends meeting
- Room cannot be deleted if has recordings (data retention policy)

---

### 8. Participant

**Purpose**: Generic participants (clients, professionals, agents) in meetings

**Table**: `participants`

**Ownership**: Secretary service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique participant identifier |
| `name` | VARCHAR(100) | NOT NULL | Participant display name |
| `type` | ENUM | NOT NULL | 'CLIENT', 'PROFESSIONAL', 'AGENT' |
| `phone_number` | VARCHAR(20) | NOT NULL, INDEX | Contact phone number |
| `email` | VARCHAR(254) | NULLABLE | Contact email |
| `external_id` | VARCHAR(254) | NULLABLE, INDEX | External system identifier |
| `professional_id` | INTEGER | NULLABLE, FK → Professional.id | Reference when type='PROFESSIONAL' |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_participants_phone ON participants(phone_number);
CREATE INDEX idx_participants_email ON participants(email) WHERE email IS NOT NULL;
CREATE INDEX idx_participants_external ON participants(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_participants_type ON participants(type);
CREATE INDEX idx_participants_professional ON participants(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX idx_participants_phone_type ON participants(phone_number, type);
```

**Validation Rules**:

- `professional_id` MUST be NOT NULL when `type = 'PROFESSIONAL'`
- `professional_id` MUST be NULL when `type != 'PROFESSIONAL'`
- Phone number must be E.164 format
- Email must be valid format if provided

**Business Rules**:

- When `type='PROFESSIONAL'`, full professional data fetched via `professional_id`
- Participant can join multiple rooms concurrently
- Agent participants auto-created when agent joins room

---

### 9. RoomParticipant

**Purpose**: Relationship between rooms and participants with access credentials

**Table**: `room_participants`

**Ownership**: Secretary service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique relationship identifier |
| `room_id` | VARCHAR(255) | NOT NULL, FK → Room.id | Room reference |
| `participant_id` | INTEGER | NOT NULL, FK → Participant.id | Participant reference |
| `magic_link_token` | VARCHAR(255) | NULLABLE, UNIQUE, INDEX | UUID for magic link |
| `password_hash` | VARCHAR(255) | NULLABLE | Bcrypt hash of 8-digit password |
| `joined_at` | TIMESTAMP | NULLABLE | Actual join timestamp |
| `left_at` | TIMESTAMP | NULLABLE | Actual leave timestamp |
| `is_organizer` | BOOLEAN | NOT NULL, DEFAULT false | Organizer flag |
| `context` | JSONB | NOT NULL, DEFAULT '{}' | Room-specific participant context |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_room_part_room ON room_participants(room_id);
CREATE INDEX idx_room_part_participant ON room_participants(participant_id);
CREATE INDEX idx_room_part_magic ON room_participants(magic_link_token) WHERE magic_link_token IS NOT NULL;
CREATE UNIQUE INDEX idx_room_part_unique ON room_participants(room_id, participant_id);
```

**Validation Rules**:

- Cannot have duplicate (room_id, participant_id) pairs
- `magic_link_token` must be UUID format
- `password_hash` must be bcrypt (cost ≥ 10)

**Business Rules**:

- Magic link valid for 24 hours (tracked in Redis, see Decision 5 in research.md)
- Password is 8 random digits (hashed with bcrypt)
- `context` stores participant-specific meeting info (role, permissions, etc.)
- Organizer can end meeting for all participants

---

### 10. RoomEvent

**Purpose**: General room lifecycle and participant events

**Table**: `room_events`

**Ownership**: Secretary service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique event identifier |
| `room_id` | VARCHAR(255) | NOT NULL, FK → Room.id | Room reference |
| `event_name` | VARCHAR(100) | NOT NULL, INDEX | Event type name |
| `data` | JSONB | NOT NULL | Event-specific data |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Event timestamp |

**Indexes**:

```sql
CREATE INDEX idx_room_events_room ON room_events(room_id);
CREATE INDEX idx_room_events_name ON room_events(event_name);
CREATE INDEX idx_room_events_room_time ON room_events(room_id, created_at DESC);
```

**Event Types**:

- `ROOM_CREATED`: Room scheduled
- `ROOM_STARTED`: First participant joined
- `ROOM_ENDED`: Last participant left or organizer ended
- `PARTICIPANT_JOINED`: Participant entered room
- `PARTICIPANT_LEFT`: Participant exited room
- `CAPACITY_REACHED`: Room hit max participants
- `RECORDING_STARTED`: Recording initiated
- `RECORDING_STOPPED`: Recording stopped

**Validation Rules**:

- `data` must be valid JSON
- `event_name` must be from predefined list

**Business Rules**:

- Events are immutable (append-only log)
- Used for analytics, audit trail, and debugging

---

### 11. AgentSessionEvent

**Purpose**: AI agent-specific interaction events

**Table**: `agent_session_events`

**Ownership**: Agent service (writes), Secretary service (reads)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique event identifier |
| `room_id` | VARCHAR(255) | NOT NULL, FK → Room.id | Room reference |
| `event_name` | VARCHAR(100) | NOT NULL, INDEX | Event type name |
| `data` | JSONB | NOT NULL | Event-specific data |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Event timestamp |

**Indexes**:

```sql
CREATE INDEX idx_agent_events_room ON agent_session_events(room_id);
CREATE INDEX idx_agent_events_name ON agent_session_events(event_name);
CREATE INDEX idx_agent_events_room_time ON agent_session_events(room_id, created_at DESC);
```

**Event Types**:

- `AGENT_JOINED`: Agent connected to room
- `AGENT_LEFT`: Agent disconnected from room
- `SUGGESTION_PROVIDED`: Agent offered contextual tip
- `QUESTION_ANSWERED`: Agent responded to participant query
- `CONTEXT_RETRIEVED`: Agent fetched data from knowledge base
- `TRANSCRIPTION_PROCESSED`: Audio transcribed by agent
- `AGENT_ERROR`: Agent encountered error

**Validation Rules**:

- `data` must contain: `{"participant_id": number, "content": string, "metadata": object}`

**Business Rules**:

- Events logged in real-time by agent
- Used for performance monitoring and training data

---

### 12. AgentUsage

**Purpose**: Agent usage metrics for billing and analytics

**Table**: `agent_usage`

**Ownership**: Agent service (writes), Manager service (reads)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique usage record identifier |
| `room_id` | VARCHAR(255) | NOT NULL, FK → Room.id, INDEX | Room reference |
| `participant_id` | INTEGER | NOT NULL, FK → Participant.id | Agent participant reference |
| `entity_id` | INTEGER | NULLABLE, FK → Entity.id, INDEX | Entity for billing |
| `department_id` | INTEGER | NULLABLE, FK → Department.id | Department context |
| `session_start` | TIMESTAMP | NOT NULL, INDEX | Agent session start |
| `session_end` | TIMESTAMP | NULLABLE | Agent session end (NULL = active) |
| `duration_seconds` | INTEGER | NULLABLE | Calculated duration |
| `data` | JSONB | NOT NULL | Usage metrics (tokens, audio minutes, etc.) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_agent_usage_room ON agent_usage(room_id);
CREATE INDEX idx_agent_usage_participant ON agent_usage(participant_id);
CREATE INDEX idx_agent_usage_entity ON agent_usage(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_agent_usage_department ON agent_usage(department_id) WHERE department_id IS NOT NULL;
CREATE INDEX idx_agent_usage_start ON agent_usage(session_start DESC);
CREATE INDEX idx_agent_usage_entity_date ON agent_usage(entity_id, session_start DESC);
CREATE INDEX idx_agent_usage_active ON agent_usage(room_id, session_end) WHERE session_end IS NULL;
```

**Data JSONB Structure**:

```json
{
  "total_tokens_input": 15000,
  "total_tokens_output": 8500,
  "total_audio_minutes": 45.0,
  "interactions_count": 42,
  "transcription_count": 12,
  "kb_queries_count": 8,
  "suggestions_count": 15,
  "cost_estimate": 2.35,
  "model": "gpt-4",
  "temperature": 0.7
}
```

**Validation Rules**:

- `participant_id` must reference a Participant with `type='AGENT'`
- `duration_seconds` auto-calculated via trigger when `session_end` is set

**Business Rules**:

- One record per agent per room session
- `session_end` NULL indicates active session
- Cost calculated based on tokens + audio minutes (pricing table)
- Used for entity billing and usage reports

---

### 13. Recording

**Purpose**: Meeting recordings stored in S3 with metadata

**Table**: `recordings`

**Ownership**: Secretary service

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique recording identifier |
| `room_id` | VARCHAR(255) | NOT NULL, FK → Room.id, INDEX | Room reference |
| `livekit_egress_id` | VARCHAR(255) | NOT NULL, UNIQUE | LiveKit Egress ID |
| `s3_bucket` | VARCHAR(255) | NOT NULL | S3 bucket name |
| `s3_key` | TEXT | NOT NULL | S3 object key |
| `file_size_bytes` | BIGINT | NULLABLE | Recording file size |
| `duration_seconds` | INTEGER | NULLABLE | Recording duration |
| `retention_days` | INTEGER | NOT NULL | Retention policy from entity |
| `purge_at` | TIMESTAMP | NOT NULL | Auto-delete timestamp |
| `format` | VARCHAR(20) | NOT NULL, DEFAULT 'mp4' | Video format |
| `status` | ENUM | NOT NULL, DEFAULT 'PROCESSING' | 'PROCESSING', 'READY', 'FAILED', 'PURGED' |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT now() | Creation timestamp |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete timestamp (audit) |

**Indexes**:

```sql
CREATE INDEX idx_recordings_room ON recordings(room_id);
CREATE INDEX idx_recordings_egress ON recordings(livekit_egress_id);
CREATE INDEX idx_recordings_purge ON recordings(purge_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_recordings_status ON recordings(status);
```

**Validation Rules**:

- `retention_days` must match entity's policy (30, 90, or 365)
- `purge_at` calculated as `created_at + retention_days`
- `s3_key` must be unique

**Business Rules**:

- Recordings are immutable (cannot edit/delete manually)
- S3 Lifecycle policies automatically delete files at `purge_at`
- `deleted_at` set by cron job after S3 deletion (audit trail)
- Status transitions: PROCESSING → READY or FAILED
- Failed recordings retried up to 3 times

---

## Database Triggers

### Auto-Update Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (Repeat for all tables with updated_at column)
```

### Calculate Agent Duration

```sql
CREATE OR REPLACE FUNCTION calculate_agent_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_end IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_agent_duration
BEFORE INSERT OR UPDATE ON agent_usage
FOR EACH ROW
EXECUTE FUNCTION calculate_agent_duration();
```

### Set Recording Purge Date

```sql
CREATE OR REPLACE FUNCTION set_recording_purge_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.purge_at = NEW.created_at + (NEW.retention_days || ' days')::INTERVAL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_purge_date
BEFORE INSERT ON recordings
FOR EACH ROW
EXECUTE FUNCTION set_recording_purge_date();
```

---

## Data Migration Strategy

### Phase 1: Core Tables (Manager)

1. Create `users` table
2. Create `entities` table
3. Create `departments` table
4. Create `professionals` table
5. Create `professional_entities` table
6. Enable pgvector extension
7. Create `knowledge_base` table

### Phase 2: Meeting Tables (Secretary)

1. Create `rooms` table
2. Create `participants` table
3. Create `room_participants` table
4. Create `room_events` table
5. Create `agent_session_events` table
6. Create `agent_usage` table
7. Create `recordings` table

### Phase 3: Triggers and Functions

1. Create `update_updated_at_column()` function
2. Create triggers for all tables with `updated_at`
3. Create `calculate_agent_duration()` function and trigger
4. Create `set_recording_purge_date()` function and trigger

---

## Data Consistency Rules

### Cross-Service Consistency

1. **Entity Deletion**: Must cascade to:
   - Departments
   - ProfessionalEntity relationships
   - KnowledgeBase entries
   - Rooms (via soft delete)

2. **Room Deletion**: Must check:
   - No active recordings being processed
   - All participants have left
   - Status must be COMPLETED or CANCELED

3. **Participant Deletion**: Must check:
   - No active room sessions
   - Update room_participants.left_at if in active room

### Data Integrity Checks

1. **Department-Entity Consistency**:

```sql
ALTER TABLE departments
ADD CONSTRAINT fk_department_entity
FOREIGN KEY (entity_id) REFERENCES entities(id)
ON DELETE CASCADE;
```

2. **Room-Entity Capacity**:

```sql
ALTER TABLE rooms
ADD CONSTRAINT chk_room_capacity
CHECK (max_participants <= (SELECT max_participants FROM entities WHERE id = entity_id));
```

3. **Recording Retention**:

```sql
ALTER TABLE recordings
ADD CONSTRAINT chk_retention_days
CHECK (retention_days IN (30, 90, 365));
```

---

## Summary

**Total Entities**: 13

**Manager Service** (6 entities):
- User
- Entity
- Department
- Professional
- ProfessionalEntity
- KnowledgeBase

**Secretary Service** (7 entities):
- Room
- Participant
- RoomParticipant
- RoomEvent
- AgentSessionEvent
- AgentUsage
- Recording

**Database Features**:
- PostgreSQL with pgvector extension
- JSONB for flexible metadata
- Soft deletes for audit trail
- Automatic timestamp management
- Data retention automation
- Foreign key constraints for referential integrity

**Next Steps**:
1. Generate migration files from this data model
2. Create TypeScript interfaces/types matching this schema
3. Implement repository layer with these entities
4. Generate API contracts based on entity operations
