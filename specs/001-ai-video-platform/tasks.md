# Implementation Tasks: AI-Powered Video/Audio Meeting Platform

**Feature Branch**: `001-ai-video-platform`  
**Created**: 2025-01-08  
**Status**: Ready for Implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and MVP delivery. Each phase can be implemented and tested independently.

**MVP Scope**: Phase 3 (User Story 1) = ~65 tasks = Functional entity management system

---

## Phase 1: Project Setup & Infrastructure

**Goal**: Establish monorepo structure, development environment, and shared configurations

**Tasks**:

- [X] T001 Create monorepo root structure with package.json configuring workspaces for manager/, secretary/, agent/, room/, shared/. IMPORTANT: There are already created folders on this directory (agent-doctor-live/manager, agent-doctor-live/secretary, agent-doctor-live/agent, agent-doctor-live/room)
- [X] T002 Create manager/package.json with dependencies: fastify@^4.0.0, @fastify/postgres, @fastify/jwt, zod@^3.0.0, bcrypt@^5.0.0, node:^24.0.0
- [X] T003 [P] Create secretary/package.json with dependencies: fastify@^4.0.0, @fastify/postgres, livekit-server-sdk@^2.0.0, zod@^3.0.0, node:^24.0.0
- [x] T004 [P] Create agent/package.json with dependencies: livekit-agents@^0.8.0, openai@^4.0.0, pg@^8.0.0, ioredis@^5.0.0, node:^24.0.0
- [x] T005 [P] Create room/package.json with dependencies: react@^18.0.0, @livekit/components-react@^2.0.0, vite@^5.0.0, tailwindcss@^3.0.0
- [X] T006 Create shared/package.json for common TypeScript types with type definitions exported
- [X] T007 Create docker-compose.yml with services: postgres:16-alpine (enable pgvector), redis:7-alpine, livekit/livekit-server, minio/minio, mailhog/mailhog
- [X] T008 Create manager/.env.example with 15 variables: PORT, DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_EXPIRES_IN, etc.
- [X] T009 [P] Create secretary/.env.example with 12 variables: PORT, DATABASE_URL, REDIS_URL, LIVEKIT_URL, LIVEKIT_API_KEY, etc.
- [X] T010 [P] Create agent/.env.example with 10 variables: LIVEKIT_URL, OPENAI_API_KEY, DATABASE_URL, REDIS_URL, etc.
- [X] T011 [P] Create room/.env.example with 5 variables: VITE_SECRETARY_API_URL, VITE_LIVEKIT_URL, etc.
- [X] T012 Create root .eslintrc.json with TypeScript rules extending @typescript-eslint/recommended
- [X] T013 Create root .prettierrc.json with configuration: semi:true, singleQuote:true, trailingComma:all, tabWidth:2
- [X] T014 Create manager/tsconfig.json extending root with outDir:dist, target:ES2022, module:NodeNext
- [X] T015 [P] Create secretary/tsconfig.json extending root with same configuration as manager
- [X] T016 [P] Create agent/tsconfig.json extending root with same configuration as manager
- [X] T017 [P] Create room/tsconfig.json with jsx:react-jsx, lib:[ES2022,DOM,DOM.Iterable]
- [X] T018 Create shared/tsconfig.json for type definitions with declaration:true, emitDeclarationOnly:true
- [X] T019 Create root README.md with project overview, architecture diagram, quick start guide
- [X] T020 Create manager/README.md with service-specific documentation and API endpoints
- [X] T021 [P] Create secretary/README.md with scheduling API documentation
- [X] T022 [P] Create agent/README.md with AI agent configuration guide
- [X] T023 [P] Create room/README.md with client setup and component documentation

---

## Phase 2: Foundational Infrastructure (BLOCKS ALL USER STORIES)

**Goal**: Database schema, authentication, shared libraries, and service bootstrapping

**Prerequisites**: Phase 1 must be complete

**Independent Test**: Services start successfully, database migrations run, JWT authentication works, Redis connection established, LiveKit SDK connects

**Tasks**:

### Database Infrastructure

- [ ] T024 Create manager/migrations/000_init.sql with DO block creating database if not exists
- [ ] T025 Create manager/migrations/001_enable_extensions.sql executing CREATE EXTENSION IF NOT EXISTS pgvector
- [ ] T026 Create manager/migrations/002_create_enums.sql with user_role ENUM (MANAGER, ENTITY_ADMIN, PROFESSIONAL), participant_type ENUM (HUMAN, AGENT), room_status ENUM (SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
- [ ] T027 Create manager/migrations/003_create_users.sql following data-model.md schema with bcrypt password, unique email, role, entity_id FK
- [ ] T028 Create manager/migrations/004_create_entities.sql with name, type, default_instructions TEXT, max_participants, recording_retention_days, active, timestamps
- [ ] T029 Create manager/migrations/005_create_departments.sql with entity_id FK, name, instructions TEXT, active, timestamps
- [ ] T030 Create manager/migrations/006_create_professionals.sql with entity_id FK, name, email, phone, specialty, active, timestamps
- [ ] T031 Create manager/migrations/007_create_professional_entities.sql junction table with professional_id, entity_id, active, timestamps, unique constraint
- [ ] T032 Create manager/migrations/008_create_knowledge_base.sql with entity_id FK, department_id FK nullable, filename, s3_key, content TEXT, embedding VECTOR(768), chunk_index, total_chunks, metadata JSONB, indexed_at, timestamps
- [ ] T033 Create secretary/migrations/009_create_rooms.sql with entity_id FK, organizer_id FK, title, description, scheduled_start, scheduled_end, custom_instructions TEXT, max_participants, access_token UUID, magic_link_token UUID, status room_status, livekit_room_id, actual_participants, timestamps
- [ ] T034 Create secretary/migrations/010_create_participants.sql with type participant_type, name, email, phone, livekit_identity, metadata JSONB, timestamps
- [ ] T035 Create secretary/migrations/011_create_room_participants.sql with room_id FK, participant_id FK, password_hash, joined_at, left_at, duration_seconds, unique constraint
- [ ] T036 Create secretary/migrations/012_create_room_events.sql with room_id FK, event_type, event_data JSONB, timestamp
- [ ] T037 Create secretary/migrations/013_create_agent_session_events.sql with room_id FK, participant_id FK, event_type, interaction_type, content TEXT, timestamp
- [ ] T038 Create secretary/migrations/014_create_agent_usage.sql with room_id FK, participant_id FK (agent), started_at, ended_at, duration_seconds, prompt_tokens, completion_tokens, total_tokens, cost_usd
- [ ] T039 Create secretary/migrations/015_create_recordings.sql with room_id FK, livekit_egress_id, s3_key, duration_seconds, file_size_bytes, started_at, ended_at, purge_at, metadata JSONB, timestamps
- [ ] T040 Create secretary/migrations/016_create_indexes.sql with 50+ indexes from data-model.md including HNSW index on knowledge_base.embedding, composite indexes on foreign keys, text search indexes
- [ ] T041 Create secretary/migrations/017_create_triggers.sql with update_updated_at trigger for all tables, calculate_agent_duration trigger, set_recording_purge_date trigger
- [ ] T042 Create manager/scripts/run-migrations.ts script executing SQL files in order with error handling and rollback capability

### Manager Service Bootstrap

- [ ] T043 Create manager/src/server.ts with Fastify instance, CORS, helmet, rate limiter, error handler, graceful shutdown
- [ ] T044 Create manager/src/config/database.ts with Fastify Postgres plugin registration using DATABASE_URL, connection pool config max:20
- [ ] T045 Create manager/src/config/redis.ts with ioredis client connection, namespace prefixes (session:, cache:), error handling
- [ ] T046 Create manager/src/config/jwt.ts with @fastify/jwt plugin registration using RS256 algorithm, 15min access token, 7day refresh token
- [ ] T047 Create manager/src/middleware/auth.ts with JWT verification, role-based access control (MANAGER, ENTITY_ADMIN), entity ownership validation
- [ ] T048 Create manager/src/middleware/error-handler.ts with DoutorVirtualException mapping, Zod validation errors, PostgreSQL errors, generic error responses
- [ ] T049 Create manager/src/middleware/rate-limit.ts with @fastify/rate-limit plugin, 100 req/min default, 5 req/15min for /auth/login
- [ ] T050 Create manager/src/utils/logger.ts with pino logger instance, structured logging, log levels (info, debug, warn, error)
- [ ] T051 Create manager/src/utils/password.ts with bcrypt hash (cost factor 10), compare functions
- [ ] T052 Create manager/src/types/request.ts extending FastifyRequest with user: {id, email, role, entityId}

### Secretary Service Bootstrap

- [ ] T053 Create secretary/src/server.ts with Fastify instance, CORS, helmet, rate limiter, error handler, graceful shutdown
- [ ] T054 Create secretary/src/config/database.ts with Fastify Postgres plugin registration using DATABASE_URL
- [ ] T055 Create secretary/src/config/redis.ts with ioredis client connection, namespace prefixes (magic-link:, room-state:)
- [ ] T056 Create secretary/src/config/livekit.ts with LiveKit RoomServiceClient initialization using LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
- [ ] T057 Create secretary/src/middleware/auth.ts with JWT verification for authenticated endpoints
- [ ] T058 Create secretary/src/middleware/error-handler.ts with same structure as manager error handler
- [ ] T059 Create secretary/src/utils/logger.ts with pino logger instance
- [ ] T060 Create secretary/src/utils/magic-link.ts with UUID generation, bcrypt 8-digit password hashing, Redis storage (TTL 24h)
- [ ] T061 Create secretary/src/utils/email.ts with nodemailer SMTP client, sendMagicLink(email, link, password) function
- [ ] T062 Create secretary/src/utils/whatsapp.ts with Twilio client (or mock), sendMagicLink(phone, link, password) function

### Agent Service Bootstrap

- [ ] T063 Create agent/src/index.ts with LiveKit Agent worker initialization, room event listeners (connected, disconnected, participant_joined)
- [ ] T064 Create agent/src/config/database.ts with pg Pool connection using DATABASE_URL, query helper functions
- [ ] T065 Create agent/src/config/redis.ts with ioredis client, cache TTL 15min for entity/department context
- [ ] T066 Create agent/src/config/openai.ts with OpenAI client initialization using OPENAI_API_KEY
- [ ] T067 Create agent/src/utils/logger.ts with pino logger instance
- [ ] T068 Create agent/src/utils/embeddings.ts with OpenAI text-embedding-3-small model, 768-dimensional vectors

### Shared Types Library

- [ ] T069 Create shared/src/types/entities.ts with Entity, Department, Professional, KnowledgeBase interfaces matching database schemas
- [ ] T070 Create shared/src/types/rooms.ts with Room, Participant, RoomParticipant, Recording interfaces
- [ ] T071 Create shared/src/types/agent.ts with AgentSessionEvent, AgentUsage interfaces
- [ ] T072 Create shared/src/types/auth.ts with UserRole, JWTPayload, LoginResponse interfaces
- [ ] T073 Create shared/src/schemas/validation.ts with Zod schemas for all API request/response validation

---

## Phase 3: User Story 1 - Entity Administrator Config (P1)

**Working Directory**: `/agent-doctor-live/manager`

**Goal**: MANAGER and ENTITY_ADMIN users can login, configure entities, create departments, manage professionals, upload knowledge base documents

**Prerequisites**: Phase 2 complete (database, auth, bootstrap)

**Independent Test**:

1. Admin logs in with POST /auth/login → receives JWT tokens
2. Admin creates entity with POST /entities → receives 201 with entity.id
3. Admin sets default AI instructions → entity.default_instructions saved
4. Admin creates department with POST /entities/{id}/departments → department created
5. Admin uploads PDF with POST /knowledge-base/upload → file processed, chunks embedded in pgvector
6. Admin queries knowledge base with GET /knowledge-base?q=cardiology → returns relevant chunks

**Delivers MVP**: Functional entity management system with AI knowledge base

**Tasks**:

### Data Seed

- [ ] T074 [US1] Create manager/seeds/001_default_users.sql with 3 users: manager@conexa.local (MANAGER), admin@clinica.local (ENTITY_ADMIN, entity_id=1), admin@design.local (ENTITY_ADMIN, entity_id=2)
- [ ] T075 [US1] Create manager/seeds/002_default_entities.sql with 2 entities: "Clínica Cardio Saúde" (medical_clinic, max_participants=50), "Design Studio XYZ" (design_agency, max_participants=30)

### Models (Data Access Layer)

- [ ] T076 [P] [US1] Create manager/src/models/User.ts with findById, findByEmail, create, updatePassword methods using Fastify Postgres plugin
- [ ] T077 [P] [US1] Create manager/src/models/Entity.ts with findAll(filters), findById, create, update, delete methods
- [ ] T078 [P] [US1] Create manager/src/models/Department.ts with findByEntityId, findById, create, update, delete methods
- [ ] T079 [P] [US1] Create manager/src/models/Professional.ts with findByEntityId, findById, create, update, delete methods
- [ ] T080 [P] [US1] Create manager/src/models/ProfessionalEntity.ts with link, unlink, findByProfessionalId methods
- [ ] T081 [P] [US1] Create manager/src/models/KnowledgeBase.ts with create, findByEntityId, searchSimilar(embedding, limit) using pgvector <=> operator, delete methods

### Services (Business Logic Layer)

- [ ] T082 [US1] Create manager/src/services/AuthService.ts with login(email, password) → validate, compare bcrypt, generate JWT tokens, return LoginResponse
- [ ] T083 [US1] Create manager/src/services/AuthService.ts with refreshToken(refreshToken) → verify JWT, issue new access token
- [ ] T084 [US1] Create manager/src/services/EntityService.ts with listEntities(user, pagination, filters) → apply role-based filtering (MANAGER sees all, ENTITY_ADMIN sees only their entity)
- [ ] T085 [US1] Create manager/src/services/EntityService.ts with getEntity(id, user) → validate access, return entity with departments count
- [ ] T086 [US1] Create manager/src/services/EntityService.ts with createEntity(data, user) → validate MANAGER role, validate max_participants range, insert entity, return created
- [ ] T087 [US1] Create manager/src/services/EntityService.ts with updateEntity(id, data, user) → validate access (MANAGER or own entity), update, return updated
- [ ] T088 [US1] Create manager/src/services/DepartmentService.ts with listDepartments(entityId, user) → validate entity access, return departments
- [ ] T089 [US1] Create manager/src/services/DepartmentService.ts with createDepartment(entityId, data, user) → validate entity access, validate unique name per entity, insert department
- [ ] T090 [US1] Create manager/src/services/DepartmentService.ts with updateDepartment(id, data, user) → validate ownership via entity, update instructions
- [ ] T091 [US1] Create manager/src/services/ProfessionalService.ts with listProfessionals(entityId, user) → validate entity access, return professionals
- [ ] T092 [US1] Create manager/src/services/ProfessionalService.ts with createProfessional(data, user) → validate entity access, validate email format, insert professional
- [ ] T093 [US1] Create manager/src/services/ProfessionalService.ts with linkToEntity(professionalId, entityId, user) → validate access, insert professional_entities junction record
- [ ] T094 [US1] Create manager/src/services/KnowledgeBaseService.ts with uploadDocument(file, entityId, departmentId, user) → validate entity access, upload to S3/MinIO, queue processing job
- [ ] T095 [US1] Create manager/src/services/KnowledgeBaseService.ts with processDocument(s3Key) → download PDF, extract text, chunk (512 tokens, 128 overlap), generate embeddings with OpenAI, insert knowledge_base records with VECTOR embeddings
- [ ] T096 [US1] Create manager/src/services/KnowledgeBaseService.ts with searchKnowledgeBase(query, entityId, departmentId, user, limit=5) → generate query embedding, pgvector similarity search with <=> operator, return top chunks with similarity scores
- [ ] T097 [US1] Create manager/src/services/KnowledgeBaseService.ts with listDocuments(entityId, departmentId, user, pagination) → validate access, return grouped by filename with metadata

### Controllers (API Endpoints)

- [ ] T098 [US1] Create manager/src/controllers/AuthController.ts with POST /api/v1/auth/login endpoint → call AuthService.login, return 200 with tokens or 401
- [ ] T099 [US1] Create manager/src/controllers/AuthController.ts with POST /api/v1/auth/refresh endpoint → call AuthService.refreshToken, return 200 with new access token or 401
- [ ] T100 [US1] Create manager/src/controllers/EntityController.ts with GET /api/v1/entities endpoint → auth middleware, call EntityService.listEntities, return 200 with pagination
- [ ] T101 [US1] Create manager/src/controllers/EntityController.ts with GET /api/v1/entities/:id endpoint → auth middleware, call EntityService.getEntity, return 200 or 404
- [ ] T102 [US1] Create manager/src/controllers/EntityController.ts with POST /api/v1/entities endpoint → auth middleware (MANAGER only), validate with Zod, call EntityService.createEntity, return 201
- [ ] T103 [US1] Create manager/src/controllers/EntityController.ts with PUT /api/v1/entities/:id endpoint → auth middleware, validate with Zod, call EntityService.updateEntity, return 200
- [ ] T104 [US1] Create manager/src/controllers/DepartmentController.ts with GET /api/v1/entities/:entityId/departments endpoint → auth middleware, call DepartmentService.listDepartments, return 200
- [ ] T105 [US1] Create manager/src/controllers/DepartmentController.ts with POST /api/v1/entities/:entityId/departments endpoint → auth middleware, validate, call DepartmentService.createDepartment, return 201
- [ ] T106 [US1] Create manager/src/controllers/DepartmentController.ts with PUT /api/v1/departments/:id endpoint → auth middleware, validate, call DepartmentService.updateDepartment, return 200
- [ ] T107 [US1] Create manager/src/controllers/ProfessionalController.ts with GET /api/v1/entities/:entityId/professionals endpoint → auth middleware, call ProfessionalService.listProfessionals, return 200
- [ ] T108 [US1] Create manager/src/controllers/ProfessionalController.ts with POST /api/v1/entities/:entityId/professionals endpoint → auth middleware, validate, call ProfessionalService.createProfessional, return 201
- [ ] T109 [US1] Create manager/src/controllers/ProfessionalController.ts with POST /api/v1/professionals/:id/entities endpoint → auth middleware, validate, call ProfessionalService.linkToEntity, return 201
- [ ] T110 [US1] Create manager/src/controllers/KnowledgeBaseController.ts with POST /api/v1/knowledge-base/upload endpoint → auth middleware, multipart file parser, validate PDF, call KnowledgeBaseService.uploadDocument, return 202 with job_id
- [ ] T111 [US1] Create manager/src/controllers/KnowledgeBaseController.ts with GET /api/v1/knowledge-base/jobs/:jobId endpoint → auth middleware, check job status in Redis, return 200 with processing|completed|failed status
- [ ] T112 [US1] Create manager/src/controllers/KnowledgeBaseController.ts with GET /api/v1/knowledge-base endpoint → auth middleware, query params (q, entity_id, department_id), call KnowledgeBaseService.searchKnowledgeBase, return 200 with chunks

### Views (Server-Side Rendered with HTMX)

- [ ] T113 [P] [US1] Create manager/src/views/layouts/base.html with DOCTYPE, head (HTMX CDN, TailwindCSS CDN), body with navbar, main container, footer
- [ ] T114 [P] [US1] Create manager/src/views/auth/login.html with form (email input, password input, submit button) posting to /api/v1/auth/login, hx-post, hx-target replacing body with dashboard
- [ ] T115 [P] [US1] Create manager/src/views/dashboard/index.html with statistics cards (total entities, total meetings, active users), recent activity table
- [ ] T116 [P] [US1] Create manager/src/views/entities/list.html with table (name, type, max participants, actions: edit, departments), search input with hx-get debounce, pagination controls
- [ ] T117 [P] [US1] Create manager/src/views/entities/form.html with form (name input, type select, default_instructions textarea, max_participants number, recording_retention_days select), hx-post /api/v1/entities or hx-put for edit
- [ ] T118 [P] [US1] Create manager/src/views/entities/show.html with entity details card, default instructions display, edit button, departments list, knowledge base section
- [ ] T119 [P] [US1] Create manager/src/views/departments/list.html with table (name, instructions preview, professionals count, edit), hx-get filtering by entity
- [ ] T120 [P] [US1] Create manager/src/views/departments/form.html with form (name input, instructions textarea max 8000 chars), hx-post /api/v1/entities/:entityId/departments
- [ ] T121 [P] [US1] Create manager/src/views/professionals/list.html with table (name, email, phone, specialty, entities linked, actions), hx-get filtering
- [ ] T122 [P] [US1] Create manager/src/views/professionals/form.html with form (name, email, phone, specialty), hx-post /api/v1/entities/:entityId/professionals
- [ ] T123 [P] [US1] Create manager/src/views/knowledge-base/upload.html with file input (accept PDF only), upload button, progress bar, hx-post /api/v1/knowledge-base/upload with multipart encoding
- [ ] T124 [P] [US1] Create manager/src/views/knowledge-base/list.html with documents table (filename, upload date, chunks count, delete button), search input with semantic search, results showing chunks with similarity scores

### View Routing & Rendering

- [ ] T125 [US1] Create manager/src/controllers/ViewController.ts with GET / → redirect to /login if unauthenticated, else redirect to /dashboard
- [ ] T126 [US1] Create manager/src/controllers/ViewController.ts with GET /login → render auth/login.html
- [ ] T127 [US1] Create manager/src/controllers/ViewController.ts with GET /dashboard → auth middleware, render dashboard/index.html with stats from services
- [ ] T128 [US1] Create manager/src/controllers/ViewController.ts with GET /entities → auth middleware, render entities/list.html with pagination
- [ ] T129 [US1] Create manager/src/controllers/ViewController.ts with GET /entities/new → auth middleware (MANAGER only), render entities/form.html in create mode
- [ ] T130 [US1] Create manager/src/controllers/ViewController.ts with GET /entities/:id/edit → auth middleware, load entity, render entities/form.html in edit mode
- [ ] T131 [US1] Create manager/src/controllers/ViewController.ts with GET /entities/:id → auth middleware, load entity with departments, render entities/show.html
- [ ] T132 [US1] Create manager/src/controllers/ViewController.ts with GET /entities/:entityId/departments → auth middleware, render departments/list.html
- [ ] T133 [US1] Create manager/src/controllers/ViewController.ts with GET /entities/:entityId/professionals → auth middleware, render professionals/list.html
- [ ] T134 [US1] Create manager/src/controllers/ViewController.ts with GET /knowledge-base → auth middleware, render knowledge-base/list.html
- [ ] T135 [US1] Create manager/src/controllers/ViewController.ts with GET /knowledge-base/upload → auth middleware, render knowledge-base/upload.html

### Integration & Workers

- [ ] T136 [US1] Create manager/src/workers/document-processor.ts background worker listening to Redis queue, processing PDF uploads, generating embeddings, inserting knowledge_base records
- [ ] T137 [US1] Create manager/src/utils/pdf-parser.ts with extractTextFromPDF(buffer) using pdf-parse library, returning full text content
- [ ] T138 [US1] Create manager/src/utils/text-chunker.ts with chunkText(text, maxTokens=512, overlap=128) splitting by sentences, returning chunk array with metadata

---

## Phase 4: User Story 2 - Schedule Meeting (P1)

**Working Directory**: `/agent-doctor-live/secretary`

**Goal**: Users schedule meetings with participants (email/phone), receive magic links + passwords via email/WhatsApp

**Prerequisites**: Phase 2 complete, Phase 3 User models created (for organizer_id FK)

**Independent Test**:
1. User calls POST /api/v1/rooms with title, scheduled_start, participants → receives 201 with room.id
2. System generates UUID magic_link_token, 8-digit password (bcrypt), stores in room_participants
3. System sends emails via SMTP to participants with magic link URL + password
4. System sends WhatsApp messages to phone participants with magic link + password
5. User calls GET /api/v1/rooms → sees their scheduled meetings
6. User calls DELETE /api/v1/rooms/{id} → room status becomes CANCELLED

**Delivers MVP Increment**: Add scheduling capability to entity management (Phase 3 + Phase 4 = functional scheduling system)

**Tasks**:

### Models (Data Access Layer)

- [ ] T139 [P] [US2] Create secretary/src/models/Room.ts with create, findById, findByOrganizer, update, updateStatus, delete methods
- [ ] T140 [P] [US2] Create secretary/src/models/Participant.ts with createOrFind(type, email, phone, name), findById, findByEmail, findByPhone methods
- [ ] T141 [P] [US2] Create secretary/src/models/RoomParticipant.ts with createBatch, findByRoomId, findByToken, updateJoinedAt, calculateDuration methods
- [ ] T142 [P] [US2] Create secretary/src/models/RoomEvent.ts with logEvent(roomId, eventType, eventData), findByRoomId methods
- [ ] T143 [P] [US2] Create secretary/src/models/Recording.ts with create, findByRoomId, findById, updateMetadata methods

### Services (Business Logic Layer)

- [ ] T144 [US2] Create secretary/src/services/RoomService.ts with createRoom(data, user) → validate entity exists, validate max_participants <= entity.max_participants, generate access_token UUID, generate magic_link_token UUID, insert room with status=SCHEDULED, return room
- [ ] T145 [US2] Create secretary/src/services/RoomService.ts with getRoomById(id, user) → fetch room with entity, return room or throw 404
- [ ] T146 [US2] Create secretary/src/services/RoomService.ts with listRooms(user, filters, pagination) → filter by organizer_id or entity_id based on role, return rooms with participant counts
- [ ] T147 [US2] Create secretary/src/services/RoomService.ts with cancelRoom(id, user) → validate organizer or MANAGER role, update status=CANCELLED, log event, notify participants
- [ ] T148 [US2] Create secretary/src/services/ParticipantService.ts with addParticipantsToRoom(roomId, participants[], user) → validate room ownership, loop participants: createOrFind participant, generate 8-digit password, bcrypt hash, insert room_participants with password_hash, store magic link token in Redis with TTL 24h, return participants with magic links
- [ ] T149 [US2] Create secretary/src/services/ParticipantService.ts with getParticipantsByRoom(roomId, user) → validate room access, return participants with join status
- [ ] T150 [US2] Create secretary/src/services/NotificationService.ts with sendMeetingInvitation(room, participant, magicLink, password) → if participant.email: call emailService.sendMagicLink with meeting details, if participant.phone: call whatsappService.sendMagicLink, log notification sent
- [ ] T151 [US2] Create secretary/src/services/NotificationService.ts with sendCancellationNotification(room, participants[]) → loop participants, send cancellation email/whatsapp
- [ ] T152 [US2] Create secretary/src/services/LiveKitService.ts with createLiveKitRoom(roomId, maxParticipants) → call livekit.RoomServiceClient.createRoom with name=room_{roomId}, maxParticipants, emptyTimeout=5min, return livekit_room_id
- [ ] T153 [US2] Create secretary/src/services/LiveKitService.ts with deleteLiveKitRoom(livekitRoomId) → call livekit.RoomServiceClient.deleteRoom

### Controllers (API Endpoints)

- [ ] T154 [US2] Create secretary/src/controllers/RoomController.ts with POST /api/v1/rooms endpoint → auth middleware, validate with Zod (title, scheduled_start, scheduled_end, participants[]), call RoomService.createRoom, call ParticipantService.addParticipantsToRoom, call NotificationService.sendMeetingInvitation for each, return 201
- [ ] T155 [US2] Create secretary/src/controllers/RoomController.ts with GET /api/v1/rooms/:id endpoint → auth middleware, call RoomService.getRoomById, call ParticipantService.getParticipantsByRoom, return 200
- [ ] T156 [US2] Create secretary/src/controllers/RoomController.ts with GET /api/v1/rooms endpoint → auth middleware, query params (status, from_date, to_date, page, limit), call RoomService.listRooms, return 200 with pagination
- [ ] T157 [US2] Create secretary/src/controllers/RoomController.ts with DELETE /api/v1/rooms/:id endpoint → auth middleware, call RoomService.cancelRoom, return 204
- [ ] T158 [US2] Create secretary/src/controllers/ParticipantController.ts with POST /api/v1/rooms/:id/participants endpoint → auth middleware, validate participants[], call ParticipantService.addParticipantsToRoom, call NotificationService.sendMeetingInvitation, return 201

### Views (Server-Side Rendered with HTMX)

- [ ] T159 [P] [US2] Create secretary/src/views/rooms/schedule.html with form (title input, scheduled_start datetime-local, scheduled_end, custom_instructions textarea, max_participants number), participants section with add/remove buttons, submit button
- [ ] T160 [P] [US2] Create secretary/src/views/rooms/list.html with table (title, scheduled_start, participants count, status badge, actions: view, cancel), filters (status, date range), hx-get with filtering
- [ ] T161 [P] [US2] Create secretary/src/views/rooms/show.html with room details card (title, scheduled times, custom instructions, max participants), participants table (name, email/phone, join status, magic link copy button), cancel meeting button
- [ ] T162 [P] [US2] Create secretary/src/views/participants/form-row.html HTMX partial with single participant row (name input, email input, phone input, remove button) for dynamic add/remove

### View Routing

- [ ] T163 [US2] Create secretary/src/controllers/ViewController.ts with GET /schedule → auth middleware, render rooms/schedule.html
- [ ] T164 [US2] Create secretary/src/controllers/ViewController.ts with GET /rooms → auth middleware, render rooms/list.html
- [ ] T165 [US2] Create secretary/src/controllers/ViewController.ts with GET /rooms/:id → auth middleware, load room, render rooms/show.html

### Integration & Webhooks

- [ ] T166 [US2] Create secretary/src/webhooks/livekit.ts with POST /webhooks/livekit endpoint → validate webhook signature, switch event.type: room_started → update room status=ACTIVE, participant_joined → log RoomEvent, participant_left → log RoomEvent + update room_participants.left_at, room_finished → update room status=COMPLETED, egress_ended → create Recording record
- [ ] T167 [US2] Create secretary/src/services/EventLogService.ts with logRoomEvent(roomId, eventType, eventData) → insert room_events record, publish to Redis pub/sub for real-time updates

---

## Phase 5: User Story 3 - Join Meeting (P1)

**Working Directory**: `/agent-doctor-live/room`

**Goal**: Participants click magic link, see staging area, enter password, join LiveKit room with video/audio/chat/screen share

**Prerequisites**: Phase 2 complete, Phase 4 complete (rooms + magic links created)

**Independent Test**:
1. Participant navigates to /join?token={magic_link_token} → sees staging area with camera/mic preview
2. Participant clicks "Join Meeting" → prompted for 8-digit password
3. System validates password with POST /api/v1/magic-link/validate → returns room details + LiveKit token
4. Room component connects to LiveKit → participant sees video grid, can send chat, share screen
5. Participant disconnects → system logs left_at, calculates duration_seconds

**Delivers MVP Increment**: Complete meeting platform (Phase 3 + 4 + 5 = fully functional video platform without AI)

**Tasks**:

### Frontend Infrastructure

- [ ] T168 Create room/vite.config.ts with React plugin, environment variables (VITE_SECRETARY_API_URL, VITE_LIVEKIT_URL), proxy configuration for /api
- [ ] T169 Create room/tailwind.config.js with theme extending conexasaude design tokens (spacing, colors, fontSizes, borderRadius)
- [ ] T170 Create room/src/main.tsx with React.StrictMode, Router provider, error boundary
- [ ] T171 Create room/src/App.tsx with React Router routes: / (landing), /join (staging area), /room/:token (meeting room), /error (error page)
- [ ] T172 Create room/src/config/api.ts with axios instance configured with baseURL=VITE_SECRETARY_API_URL, timeout 10s

### Custom Hooks

- [ ] T173 [P] [US3] Create room/src/hooks/useMagicLink.ts with validateMagicLink(token, password) → POST /api/v1/magic-link/validate, return {room, participant, livekitToken}
- [ ] T174 [P] [US3] Create room/src/hooks/useJoinRoom.ts with joinRoom(roomId, participantId) → POST /api/v1/rooms/{id}/join, return {livekitToken}
- [ ] T175 [P] [US3] Create room/src/hooks/useDeviceSetup.ts with requestPermissions(), enumerateDevices(), selectCamera(deviceId), selectMicrophone(deviceId), testAudio(), testVideo()
- [ ] T176 [P] [US3] Create room/src/hooks/useLocalStorage.ts with setItem(key, value), getItem(key) for persisting device preferences

### Components - Staging Area

- [ ] T177 [P] [US3] Create room/src/components/StagingArea/StagingArea.tsx with camera preview video element, microphone level indicator, device selector dropdowns, "Join Meeting" button triggering password prompt
- [ ] T178 [P] [US3] Create room/src/components/StagingArea/DeviceSelector.tsx with select dropdown for cameras and microphones, onChange calling useDeviceSetup hooks
- [ ] T179 [P] [US3] Create room/src/components/StagingArea/AudioLevelIndicator.tsx with canvas visualizer showing audio waveform or volume bars using Web Audio API
- [ ] T180 [P] [US3] Create room/src/components/StagingArea/PasswordPrompt.tsx with modal dialog, numeric input (8 digits), submit button, loading state, error message display

### Components - Meeting Room

- [ ] T181 [P] [US3] Create room/src/components/MeetingRoom/MeetingRoom.tsx with LiveKitRoom component from @livekit/components-react, layout grid for video tiles, chat sidebar, control bar at bottom
- [ ] T182 [P] [US3] Create room/src/components/MeetingRoom/VideoGrid.tsx with responsive grid layout, mapping participants to VideoTile components, spotlight view for active speaker
- [ ] T183 [P] [US3] Create room/src/components/MeetingRoom/VideoTile.tsx with video track rendering, participant name overlay, muted indicators (mic/camera off icons), connection quality indicator
- [ ] T184 [P] [US3] Create room/src/components/MeetingRoom/ControlBar.tsx with buttons: toggle camera, toggle mic, share screen, leave meeting, open chat, recording indicator (red dot if active)
- [ ] T185 [P] [US3] Create room/src/components/MeetingRoom/ChatPanel.tsx with message list (scrollable), message bubbles with timestamp + sender name, input box with send button, HTMX or LiveKit data channel
- [ ] T186 [P] [US3] Create room/src/components/MeetingRoom/ScreenShare.tsx with screen share track rendering in fullscreen or picture-in-picture mode, stop sharing button
- [ ] T187 [P] [US3] Create room/src/components/MeetingRoom/ParticipantList.tsx with sidebar showing all participants (name, audio/video status), participant count, agent indicator if AI agent present
- [ ] T188 [P] [US3] Create room/src/components/MeetingRoom/AgentPanel.tsx with collapsible sidebar showing AI agent suggestions, tips displayed as cards, timestamps, enable/disable agent toggle
- [ ] T189 [P] [US3] Create room/src/components/MeetingRoom/ConnectionQuality.tsx with network quality indicator (excellent/good/poor), reconnecting spinner if connection lost
- [ ] T190 [P] [US3] Create room/src/components/MeetingRoom/LoadingState.tsx with spinner and "Connecting to meeting..." message

### Pages & Routing

- [ ] T191 [US3] Create room/src/pages/LandingPage.tsx with hero section, "Schedule Meeting" CTA redirecting to secretary UI, "Join Meeting" input for magic link token
- [ ] T192 [US3] Create room/src/pages/StagingAreaPage.tsx with URL param ?token={magic_link_token}, useDeviceSetup hook, rendering StagingArea component, handling password submission with useMagicLink hook
- [ ] T193 [US3] Create room/src/pages/MeetingRoomPage.tsx with URL param /room/:token, receiving livekitToken from location.state (passed from StagingAreaPage), rendering MeetingRoom component with LiveKit connection
- [ ] T194 [US3] Create room/src/pages/ErrorPage.tsx with error message display (invalid token, expired link, room not found, etc.), "Contact Support" button

### API Integration (Secretary Endpoints for Room Client)

- [ ] T195 [US3] Create secretary/src/controllers/MagicLinkController.ts with GET /api/v1/magic-link/validate endpoint → query params (token), check Redis for token (TTL check), if exists: fetch room_participants by magic_link_token, validate room not cancelled, compare bcrypt password from request header, if valid: generate LiveKit token with participant identity, return 200 {room, participant, livekitToken}
- [ ] T196 [US3] Create secretary/src/controllers/MagicLinkController.ts with POST /api/v1/rooms/:id/join endpoint → auth via magic link token, validate room status=ACTIVE or SCHEDULED, check capacity room.actual_participants < room.max_participants, update room_participants.joined_at, increment room.actual_participants, generate LiveKit token, return 200 {livekitToken}
- [ ] T197 [US3] Create secretary/src/services/LiveKitService.ts with generateParticipantToken(roomId, participantId, participantName) → call livekit.AccessToken with identity=participant_{id}, grants: roomJoin, canPublish, canSubscribe, valid for 6 hours, return JWT token

---

## Phase 6: User Story 4 - AI Agent Assistance (P2)

**Working Directory**: `/agent-doctor-live/agent`

**Goal**: AI agent joins room automatically, listens to conversation, provides contextual suggestions based on entity/department instructions + knowledge base

**Prerequisites**: Phase 2 complete, Phase 3 complete (knowledge_base with pgvector), Phase 5 complete (LiveKit rooms active)

**Independent Test**:
1. Room becomes ACTIVE → LiveKit webhook triggers agent dispatch
2. Agent service receives room_started event → fetches entity + department context from database, pre-fetches knowledge base embeddings, connects to LiveKit room as AGENT participant
3. Agent listens to audio → transcribes with Whisper (or LiveKit STT), generates embeddings for conversation context
4. Agent queries pgvector knowledge_base with similarity search → retrieves relevant chunks
5. Agent constructs prompt: entity.default_instructions + department.instructions + custom_instructions + knowledge base context + conversation history
6. Agent sends suggestion to room via LiveKit data channel → Room client displays in AgentPanel
7. Agent logs interaction in agent_session_events table
8. Room ends → agent logs agent_usage (tokens, cost, duration)

**Delivers Full Platform**: All P1 + P2 features complete (AI-enhanced meeting platform)

**Tasks**:

### Agent Core Infrastructure

- [ ] T198 [US4] Create agent/src/agent/MeetingAgent.ts class extending LiveKit Agent with constructor(roomId, entityId, departmentId), connect() method, disconnect() method
- [ ] T199 [US4] Create agent/src/agent/MeetingAgent.ts with onRoomConnected() → log "Agent connected to room {roomId}", fetch entity/department context, cache in Redis for 15min
- [ ] T200 [US4] Create agent/src/agent/MeetingAgent.ts with onParticipantJoined(participant) → log event to agent_session_events table
- [ ] T201 [US4] Create agent/src/agent/MeetingAgent.ts with onParticipantLeft(participant) → log event to agent_session_events table
- [ ] T202 [US4] Create agent/src/agent/MeetingAgent.ts with onTranscription(text, participantId) → append to conversation history (sliding window 10 messages), trigger context analysis

### Context Retrieval & Management

- [ ] T203 [US4] Create agent/src/services/ContextService.ts with getEntityContext(entityId) → check Redis cache key entity:{id}:context, if miss: query database users, entities, departments, cache for 15min, return {entity, departments}
- [ ] T204 [US4] Create agent/src/services/ContextService.ts with searchKnowledgeBase(query, entityId, departmentId, limit=5) → generate embedding with OpenAI text-embedding-3-small, query knowledge_base table with pgvector <=> operator ORDER BY embedding <=> $1 LIMIT $2, return chunks with similarity scores > 0.7
- [ ] T205 [US4] Create agent/src/services/ContextService.ts with buildSystemPrompt(entity, department, room) → concatenate: base agent instructions + entity.default_instructions + department.instructions + room.custom_instructions, return combined prompt
- [ ] T206 [US4] Create agent/src/services/ContextService.ts with getConversationContext(roomId, limit=10) → fetch last 10 messages from Redis list conversation:{roomId}, return as array

### AI Processing

- [ ] T207 [US4] Create agent/src/services/OpenAIService.ts with generateResponse(systemPrompt, conversationHistory, knowledgeBaseChunks) → construct messages array: [{role: 'system', content: systemPrompt + knowledge base context}, ...conversationHistory], call OpenAI chat.completions.create with model=gpt-4o-mini, temperature=0.3, max_tokens=500, return response + usage (prompt_tokens, completion_tokens)
- [ ] T208 [US4] Create agent/src/services/OpenAIService.ts with analyzeIntent(transcription) → lightweight intent classification (question vs statement vs request), return intent type
- [ ] T209 [US4] Create agent/src/services/OpenAIService.ts with generateEmbedding(text) → call OpenAI embeddings.create with model=text-embedding-3-small, return 768-dimensional vector

### Agent Actions & Interaction

- [ ] T210 [US4] Create agent/src/agent/MeetingAgent.ts with processTranscription(text, participantId) → analyzeIntent, if question or medical term detected: searchKnowledgeBase, generateResponse, sendSuggestionToRoom, logInteraction
- [ ] T211 [US4] Create agent/src/agent/MeetingAgent.ts with sendSuggestionToRoom(content, type='suggestion') → use LiveKit data channel to send {type: 'agent_message', content, timestamp}, room client receives and displays in AgentPanel
- [ ] T212 [US4] Create agent/src/agent/MeetingAgent.ts with handleDirectQuestion(question, participantId) → searchKnowledgeBase, generateResponse with higher confidence threshold, send answer, log as interaction_type='answer_to_question'
- [ ] T213 [US4] Create agent/src/agent/MeetingAgent.ts with proactiveTips() → analyze conversation every 30s, detect keywords from knowledge base, send proactive tip if relevant, log as interaction_type='proactive_tip'

### Event Logging & Metrics

- [ ] T214 [US4] Create agent/src/models/AgentSessionEvent.ts with logEvent(roomId, participantId, eventType, interactionType, content) → insert agent_session_events record with timestamp
- [ ] T215 [US4] Create agent/src/models/AgentUsage.ts with startSession(roomId, agentParticipantId) → insert agent_usage record with started_at, return usage_id
- [ ] T216 [US4] Create agent/src/models/AgentUsage.ts with endSession(usageId, promptTokens, completionTokens) → update agent_usage with ended_at, calculate duration_seconds, total_tokens, cost_usd (GPT-4o-mini pricing $0.15/1M input, $0.60/1M output)
- [ ] T217 [US4] Create agent/src/models/AgentUsage.ts with calculateCost(promptTokens, completionTokens) → return (promptTokens * 0.00000015) + (completionTokens * 0.0000006)

### Webhook & Agent Dispatch

- [ ] T218 [US4] Create agent/src/webhooks/dispatcher.ts with handleRoomStarted(event) → receive LiveKit room_started webhook, fetch room from database, check if entity has AI enabled, spawn MeetingAgent instance, connect to room, log agent_session_events
- [ ] T219 [US4] Create agent/src/webhooks/dispatcher.ts with handleRoomFinished(event) → disconnect agent, calculate final usage, log end session, cleanup Redis conversation history
- [ ] T220 [US4] Create agent/src/webhooks/dispatcher.ts with handleParticipantJoined(event) → if participant.type=AGENT: skip, else: notify agent instance, log event
- [ ] T221 [US4] Create agent/src/webhooks/dispatcher.ts with handleParticipantLeft(event) → notify agent instance, log event

### API Endpoints (Secretary - Agent Usage)

- [ ] T222 [US4] Create secretary/src/controllers/AgentUsageController.ts with GET /api/v1/agent-usage endpoint → auth middleware, query params (entity_id, from_date, to_date, page, limit), fetch agent_usage records grouped by room, calculate total cost, return 200 with pagination
- [ ] T223 [US4] Create secretary/src/controllers/AgentUsageController.ts with GET /api/v1/rooms/:id/agent-usage endpoint → auth middleware, fetch agent_usage for specific room, return 200 with token breakdown and cost

---

## Phase 7: Cross-Cutting & Polish

**Goal**: Production readiness - monitoring, logging, documentation, health checks, Postman collection

**Prerequisites**: All user story phases complete

**Tasks**:

### Monitoring & Observability

- [ ] T224 [P] Create manager/src/controllers/HealthController.ts with GET /health endpoint → check database connection, Redis connection, return 200 {status: 'healthy', timestamp, version} or 503
- [ ] T225 [P] Create secretary/src/controllers/HealthController.ts with GET /health endpoint → check database, Redis, LiveKit server connectivity, return 200 or 503
- [ ] T226 [P] Create agent/src/controllers/HealthController.ts with GET /health endpoint → check database, Redis, OpenAI API, return 200 or 503
- [ ] T227 [P] Create manager/src/utils/metrics.ts with Prometheus client, metrics: http_requests_total, http_request_duration_seconds, active_connections, db_pool_size, cache_hit_rate
- [ ] T228 [P] Create manager/src/controllers/MetricsController.ts with GET /metrics endpoint → return Prometheus metrics in text format
- [ ] T229 [P] Create secretary/src/utils/metrics.ts with metrics: rooms_created_total, participants_joined_total, livekit_connection_errors, magic_link_validations_total
- [ ] T230 [P] Create agent/src/utils/metrics.ts with metrics: agent_sessions_total, agent_suggestions_total, knowledge_base_queries_total, openai_tokens_used, openai_cost_usd

### Structured Logging

- [ ] T231 [P] Create manager/src/middleware/request-logger.ts with Fastify plugin logging request method, URL, status code, duration, user ID if authenticated
- [ ] T232 [P] Create secretary/src/middleware/request-logger.ts with same logging structure
- [ ] T233 [P] Update all LOGGER.error() calls to include error stack traces and request context (requestId, userId, method, path)

### Database Performance

- [ ] T234 Create manager/src/config/database.ts with connection pool configuration: max:20, min:5, idleTimeoutMillis:30000, connectionTimeoutMillis:10000
- [ ] T235 Create secretary/src/config/database.ts with same pool configuration
- [ ] T236 Create agent/src/config/database.ts with pg Pool: max:10, min:2 (agent has fewer concurrent queries)

### Documentation

- [ ] T237 Create CONTRIBUTING.md with development setup, branch naming (feat/, fix/, docs/), commit conventions (Conventional Commits), PR process
- [ ] T238 [P] Update manager/README.md with API endpoints table, authentication flow, entity configuration examples, knowledge base upload guide
- [ ] T239 [P] Update secretary/README.md with scheduling API examples, magic link flow diagram, LiveKit webhook integration guide
- [ ] T240 [P] Update agent/README.md with agent architecture diagram, context retrieval strategy, OpenAI integration guide, cost optimization tips
- [ ] T241 [P] Update room/README.md with component tree, LiveKit hooks usage, staging area flow, troubleshooting common issues

### Postman Collection

- [ ] T242 Create postman/Manager-API.json with collection: Authentication folder (login, refresh), Entities folder (list, create, get, update), Departments folder (list, create, update), Professionals folder (list, create, link), Knowledge Base folder (upload, job status, search)
- [ ] T243 Create postman/Secretary-API.json with collection: Rooms folder (create, list, get, cancel), Participants folder (add participants), Magic Link folder (validate), Agent Usage folder (get usage)
- [ ] T244 Create postman/environment-local.json with variables: {{manager_url}}=http://localhost:3000, {{secretary_url}}=http://localhost:3001, {{access_token}}, {{refresh_token}}
- [ ] T245 Add Postman pre-request script to automatically refresh access_token if expired using refresh_token

### Graceful Shutdown

- [ ] T246 [P] Create manager/src/utils/shutdown.ts with graceful shutdown handler: stop accepting new requests, finish pending requests (30s timeout), close database connections, close Redis, exit process
- [ ] T247 [P] Create secretary/src/utils/shutdown.ts with same shutdown handler + close LiveKit connections
- [ ] T248 [P] Create agent/src/utils/shutdown.ts with shutdown handler: disconnect all active agent instances, finish pending OpenAI requests, close connections

### Rate Limiting & Security

- [ ] T249 [P] Update manager/src/middleware/rate-limit.ts with stricter limits for sensitive endpoints: POST /entities (10 req/hour), POST /knowledge-base/upload (5 req/hour)
- [ ] T250 [P] Update secretary/src/middleware/rate-limit.ts with limits: POST /rooms (20 req/hour), GET /magic-link/validate (30 req/min)

### CI/CD Preparation

- [ ] T251 Create .github/workflows/test.yml with GitHub Actions workflow: checkout, setup Node.js 24, install dependencies, run ESLint, run Prettier check, run tests (placeholder)
- [ ] T252 Create .github/workflows/build.yml with workflow: build all services (npm run build), verify TypeScript compilation, cache node_modules

---

## Summary

**Total Tasks**: 252

**Tasks by Phase**:
- Phase 1 (Setup): 23 tasks
- Phase 2 (Foundational): 50 tasks
- Phase 3 (User Story 1 - Entity Config): 65 tasks
- Phase 4 (User Story 2 - Schedule Meeting): 29 tasks
- Phase 5 (User Story 3 - Join Meeting): 30 tasks
- Phase 6 (User Story 4 - AI Agent): 25 tasks
- Phase 7 (Polish): 30 tasks

**MVP Scope** (Phase 1 + 2 + 3): 138 tasks → Functional entity management system with AI knowledge base

**MVP + Scheduling** (Phase 1 + 2 + 3 + 4): 167 tasks → Full scheduling platform with magic links

**MVP + Meeting Platform** (Phase 1 + 2 + 3 + 4 + 5): 197 tasks → Complete video/audio platform without AI agent

**Full Platform** (All Phases): 252 tasks → AI-enhanced meeting platform with agent assistance

**Parallel Opportunities**: ~85 tasks marked with [P] can be executed simultaneously (different files, no blocking dependencies)

**Key Milestones**:
1. After Phase 2: Services boot, database ready, auth works
2. After Phase 3: Entity administrators can configure organizations and upload knowledge base
3. After Phase 4: Users can schedule meetings and send magic links
4. After Phase 5: Participants can join and conduct video meetings
5. After Phase 6: AI agents provide contextual assistance during meetings
6. After Phase 7: Production-ready platform with monitoring and documentation
