# API Contracts: AI-Powered Video/Audio Meeting Platform

**Feature**: AI-Powered Video/Audio Meeting Platform  
**Branch**: `001-ai-video-platform`  
**Created**: 2025-11-08  
**Version**: 1.0.0

---

## Overview

This document defines the API contracts for all services in the AI-powered meeting platform. Each API is documented using OpenAPI 3.0 specification format with detailed request/response schemas, authentication requirements, and validation rules.

**Services**:

1. **Manager API** - Entity/organization configuration, user management, knowledge base
2. **Secretary API** - Meeting scheduling, participant management, room access
3. **LiveKit Integration** - Video/audio infrastructure (SDK-based, no REST API)
4. **Room Client** - Frontend interface (WebSocket/WebRTC, no REST API)

---

## Manager API

**Base URL**: `https://manager.conexa.com.br/api/v1`  
**Authentication**: JWT Bearer token (RS256)  
**Port**: 3000 (development)

### Authentication Endpoints

#### POST /auth/login

**Purpose**: Authenticate backoffice users (MANAGER, ENTITY_ADMIN)

**Request**:

```yaml
operationId: loginUser
tags: [Authentication]
security: [] # Public endpoint
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [email, password]
        properties:
          email:
            type: string
            format: email
            maxLength: 254
            example: "admin@clinica.com.br"
          password:
            type: string
            format: password
            minLength: 8
            example: "SecurePass123!"
responses:
  200:
    description: Login successful
    content:
      application/json:
        schema:
          type: object
          required: [accessToken, refreshToken, user]
          properties:
            accessToken:
              type: string
              description: JWT access token (expires in 15 minutes)
              example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
            refreshToken:
              type: string
              description: JWT refresh token (expires in 7 days)
              example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
            user:
              type: object
              required: [id, email, role]
              properties:
                id:
                  type: integer
                  example: 1
                email:
                  type: string
                  example: "admin@clinica.com.br"
                role:
                  type: string
                  enum: [MANAGER, ENTITY_ADMIN]
                  example: "ENTITY_ADMIN"
                entityId:
                  type: integer
                  nullable: true
                  description: NULL for MANAGER role
                  example: 10
  401:
    description: Invalid credentials
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  422:
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
```

**Validation Rules**:

- Email must be valid RFC 5322 format
- Password minimum 8 characters
- Rate limit: 5 attempts per 15 minutes per IP

---

#### POST /auth/refresh

**Purpose**: Refresh expired access token

**Request**:

```yaml
operationId: refreshToken
tags: [Authentication]
security: [] # Public endpoint (uses refresh token in body)
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [refreshToken]
        properties:
          refreshToken:
            type: string
            example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
responses:
  200:
    description: Token refreshed
    content:
      application/json:
        schema:
          type: object
          required: [accessToken]
          properties:
            accessToken:
              type: string
              example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  401:
    description: Invalid or expired refresh token
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

---

### Entity Management Endpoints

#### GET /entities

**Purpose**: List all entities (filtered by role)

**Request**:

```yaml
operationId: listEntities
tags: [Entities]
security:
  - bearerAuth: []
parameters:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
    description: Page number
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
    description: Items per page
  - name: search
    in: query
    schema:
      type: string
      maxLength: 100
    description: Search by entity name
  - name: type
    in: query
    schema:
      type: string
      maxLength: 100
    description: Filter by entity type
responses:
  200:
    description: List of entities
    content:
      application/json:
        schema:
          type: object
          required: [data, pagination]
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/Entity'
            pagination:
              $ref: '#/components/schemas/Pagination'
  401:
    description: Unauthorized
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

**Authorization Rules**:

- MANAGER: Returns all entities
- ENTITY_ADMIN: Returns only their assigned entity

---

#### POST /entities

**Purpose**: Create new entity

**Request**:

```yaml
operationId: createEntity
tags: [Entities]
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [name, type]
        properties:
          name:
            type: string
            minLength: 3
            maxLength: 200
            example: "Clínica Cardio Saúde"
          type:
            type: string
            maxLength: 100
            example: "medical_clinic"
            description: "Examples: medical_clinic, design_agency, educational_institution"
          defaultInstructions:
            type: string
            maxLength: 8000
            nullable: true
            example: "Provide medical consultation guidelines following Brazilian medical protocols."
          maxParticipants:
            type: integer
            minimum: 2
            maximum: 1000
            default: 50
            example: 50
          recordingRetentionDays:
            type: integer
            enum: [30, 90, 365]
            default: 30
            example: 90
responses:
  201:
    description: Entity created successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Entity'
  401:
    description: Unauthorized
  403:
    description: Forbidden (ENTITY_ADMIN cannot create entities)
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  422:
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
```

**Authorization**:

- Only MANAGER role can create entities

---

#### GET /entities/{id}

**Purpose**: Get entity details by ID

**Request**:

```yaml
operationId: getEntity
tags: [Entities]
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
    description: Entity ID
responses:
  200:
    description: Entity details
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Entity'
  401:
    description: Unauthorized
  403:
    description: Forbidden (ENTITY_ADMIN accessing other entity)
  404:
    description: Entity not found
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

---

#### PUT /entities/{id}

**Purpose**: Update entity configuration

**Request**:

```yaml
operationId: updateEntity
tags: [Entities]
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          name:
            type: string
            minLength: 3
            maxLength: 200
          type:
            type: string
            maxLength: 100
          defaultInstructions:
            type: string
            maxLength: 8000
            nullable: true
          maxParticipants:
            type: integer
            minimum: 2
            maximum: 1000
          recordingRetentionDays:
            type: integer
            enum: [30, 90, 365]
          active:
            type: boolean
responses:
  200:
    description: Entity updated successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Entity'
  401:
    description: Unauthorized
  403:
    description: Forbidden
  404:
    description: Entity not found
  422:
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
```

**Authorization**:

- MANAGER: Can update any entity
- ENTITY_ADMIN: Can only update their assigned entity

---

### Department Management Endpoints

#### GET /entities/{entityId}/departments

**Purpose**: List departments for an entity

**Request**:

```yaml
operationId: listDepartments
tags: [Departments]
security:
  - bearerAuth: []
parameters:
  - name: entityId
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
  - name: active
    in: query
    schema:
      type: boolean
      default: true
    description: Filter by active status
responses:
  200:
    description: List of departments
    content:
      application/json:
        schema:
          type: object
          required: [data]
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/Department'
  401:
    description: Unauthorized
  403:
    description: Forbidden
  404:
    description: Entity not found
```

---

#### POST /entities/{entityId}/departments

**Purpose**: Create department within entity

**Request**:

```yaml
operationId: createDepartment
tags: [Departments]
security:
  - bearerAuth: []
parameters:
  - name: entityId
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [name]
        properties:
          name:
            type: string
            minLength: 2
            maxLength: 100
            example: "Cardiologia"
          instructions:
            type: string
            maxLength: 8000
            nullable: true
            example: "Focus on cardiovascular health. Reference latest Brazilian cardiology guidelines."
responses:
  201:
    description: Department created successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Department'
  401:
    description: Unauthorized
  403:
    description: Forbidden
  404:
    description: Entity not found
  409:
    description: Department name already exists in entity
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  422:
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
```

**Validation**:

- Department name must be unique per entity

---

#### PUT /entities/{entityId}/departments/{id}

**Purpose**: Update department

**Request**:

```yaml
operationId: updateDepartment
tags: [Departments]
security:
  - bearerAuth: []
parameters:
  - name: entityId
    in: path
    required: true
    schema:
      type: integer
  - name: id
    in: path
    required: true
    schema:
      type: integer
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          name:
            type: string
            minLength: 2
            maxLength: 100
          instructions:
            type: string
            maxLength: 8000
            nullable: true
          active:
            type: boolean
responses:
  200:
    description: Department updated successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Department'
  401:
    description: Unauthorized
  403:
    description: Forbidden
  404:
    description: Department not found
  422:
    description: Validation error
```

---

### Professional Management Endpoints

#### GET /professionals

**Purpose**: List professionals (with entity filtering)

**Request**:

```yaml
operationId: listProfessionals
tags: [Professionals]
security:
  - bearerAuth: []
parameters:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
  - name: entityId
    in: query
    schema:
      type: integer
    description: Filter by entity ID
  - name: departmentId
    in: query
    schema:
      type: integer
    description: Filter by department ID
  - name: search
    in: query
    schema:
      type: string
      maxLength: 100
    description: Search by name, email, or phone
  - name: active
    in: query
    schema:
      type: boolean
      default: true
responses:
  200:
    description: List of professionals
    content:
      application/json:
        schema:
          type: object
          required: [data, pagination]
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/Professional'
            pagination:
              $ref: '#/components/schemas/Pagination'
  401:
    description: Unauthorized
```

---

#### POST /professionals

**Purpose**: Create professional

**Request**:

```yaml
operationId: createProfessional
tags: [Professionals]
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [name, phoneNumber]
        properties:
          name:
            type: string
            minLength: 3
            maxLength: 200
            example: "Dr. João Silva"
          email:
            type: string
            format: email
            maxLength: 254
            nullable: true
            example: "joao.silva@clinica.com.br"
          phoneNumber:
            type: string
            pattern: '^\+[1-9]\d{1,14}$'
            example: "+5511999999999"
            description: E.164 format
          externalId:
            type: string
            maxLength: 254
            nullable: true
            example: "CRM-123456-SP"
          licenseNumber:
            type: string
            maxLength: 100
            nullable: true
            example: "CRM 123456"
responses:
  201:
    description: Professional created successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Professional'
  401:
    description: Unauthorized
  409:
    description: Professional with same externalId already exists
  422:
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
```

---

#### POST /professionals/{id}/entities

**Purpose**: Link professional to entity/department

**Request**:

```yaml
operationId: linkProfessionalToEntity
tags: [Professionals]
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
    description: Professional ID
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [entityId]
        properties:
          entityId:
            type: integer
            example: 10
          departmentId:
            type: integer
            nullable: true
            example: 5
responses:
  201:
    description: Professional linked successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ProfessionalEntity'
  401:
    description: Unauthorized
  403:
    description: Forbidden (ENTITY_ADMIN linking to different entity)
  404:
    description: Professional or entity not found
  409:
    description: Link already exists
  422:
    description: Validation error (department not in entity)
```

**Authorization**:

- MANAGER: Can link to any entity
- ENTITY_ADMIN: Can only link to their entity

---

### Knowledge Base Endpoints

#### POST /knowledge-base/upload

**Purpose**: Upload document to vector database for AI agent context

**Request**:

```yaml
operationId: uploadKnowledgeBase
tags: [KnowledgeBase]
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    multipart/form-data:
      schema:
        type: object
        required: [file, entityId]
        properties:
          file:
            type: string
            format: binary
            description: PDF document (max 10MB)
          entityId:
            type: integer
            example: 10
          departmentId:
            type: integer
            nullable: true
            example: 5
responses:
  202:
    description: Document accepted for processing (async job)
    content:
      application/json:
        schema:
          type: object
          required: [jobId, status]
          properties:
            jobId:
              type: string
              format: uuid
              example: "550e8400-e29b-41d4-a716-446655440000"
            status:
              type: string
              enum: [processing]
              example: "processing"
            message:
              type: string
              example: "Document is being processed. Embeddings will be available shortly."
  401:
    description: Unauthorized
  403:
    description: Forbidden (ENTITY_ADMIN uploading to different entity)
  413:
    description: File too large (max 10MB)
  422:
    description: Validation error (unsupported file type)
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
```

**Processing Flow**:

1. File uploaded and stored in temporary location
2. Background job created for:
   - PDF text extraction
   - Text chunking (512 tokens per chunk, 50 token overlap)
   - Embedding generation (all-MiniLM-L12-v2 or all-mpnet-base-v2)
   - Vector storage in PostgreSQL (pgvector)
3. Job status can be checked via GET /knowledge-base/jobs/{jobId}

---

#### GET /knowledge-base/jobs/{jobId}

**Purpose**: Check document processing status

**Request**:

```yaml
operationId: getKnowledgeBaseJobStatus
tags: [KnowledgeBase]
security:
  - bearerAuth: []
parameters:
  - name: jobId
    in: path
    required: true
    schema:
      type: string
      format: uuid
responses:
  200:
    description: Job status
    content:
      application/json:
        schema:
          type: object
          required: [jobId, status]
          properties:
            jobId:
              type: string
              format: uuid
            status:
              type: string
              enum: [processing, completed, failed]
              example: "completed"
            progress:
              type: integer
              minimum: 0
              maximum: 100
              example: 100
            chunks:
              type: integer
              example: 42
              description: Number of chunks created (if completed)
            error:
              type: string
              nullable: true
              example: "PDF extraction failed: corrupted file"
  401:
    description: Unauthorized
  404:
    description: Job not found
```

---

#### GET /knowledge-base

**Purpose**: List knowledge base entries for entity

**Request**:

```yaml
operationId: listKnowledgeBase
tags: [KnowledgeBase]
security:
  - bearerAuth: []
parameters:
  - name: entityId
    in: query
    required: true
    schema:
      type: integer
  - name: departmentId
    in: query
    schema:
      type: integer
      nullable: true
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
responses:
  200:
    description: List of knowledge base entries
    content:
      application/json:
        schema:
          type: object
          required: [data, pagination]
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/KnowledgeBase'
            pagination:
              $ref: '#/components/schemas/Pagination'
  401:
    description: Unauthorized
  403:
    description: Forbidden
```

---

## Secretary API

**Base URL**: `https://secretary.conexa.com.br/api/v1`  
**Authentication**: Magic Link + Password (for participants), JWT (for organizers)  
**Port**: 3001 (development)

### Room Scheduling Endpoints

#### POST /rooms

**Purpose**: Schedule a new meeting room

**Request**:

```yaml
operationId: scheduleRoom
tags: [Rooms]
security:
  - bearerAuth: []
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [title, scheduledFor, entityId]
        properties:
          title:
            type: string
            minLength: 3
            maxLength: 200
            example: "Consulta Cardiologia - Paciente José"
          scheduledFor:
            type: string
            format: date-time
            example: "2025-11-10T14:00:00Z"
            description: ISO 8601 format
          duration:
            type: integer
            minimum: 15
            maximum: 480
            default: 60
            example: 60
            description: Duration in minutes
          entityId:
            type: integer
            example: 10
          departmentId:
            type: integer
            nullable: true
            example: 5
          customPrompt:
            type: string
            maxLength: 4000
            nullable: true
            example: "Focus on cardiovascular assessment. Patient history: hypertension."
          maxParticipants:
            type: integer
            minimum: 2
            maximum: 1000
            nullable: true
            example: 10
            description: Override entity default if provided
          participants:
            type: array
            minItems: 1
            items:
              type: object
              required: [type]
              properties:
                type:
                  type: string
                  enum: [CLIENT, PROFESSIONAL]
                  example: "CLIENT"
                name:
                  type: string
                  minLength: 2
                  maxLength: 100
                  example: "José Silva"
                email:
                  type: string
                  format: email
                  maxLength: 254
                  nullable: true
                  example: "jose.silva@email.com"
                phoneNumber:
                  type: string
                  pattern: '^\+[1-9]\d{1,14}$'
                  example: "+5511988888888"
                professionalId:
                  type: integer
                  nullable: true
                  example: 42
                  description: Required if type=PROFESSIONAL
responses:
  201:
    description: Room scheduled successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Room'
  401:
    description: Unauthorized
  403:
    description: Forbidden (capacity exceeded)
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  422:
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
```

**Business Logic**:

1. Validate capacity against entity limit
2. Create Room record in database
3. Generate magic link + 8-digit password for each participant
4. Send notifications:
   - Email (if email provided): Meeting details + magic link + password
   - WhatsApp (if only phone provided): Meeting details + magic link + password
5. Create RoomParticipant records
6. Return room details with organizer access

---

#### GET /rooms/{id}

**Purpose**: Get room details

**Request**:

```yaml
operationId: getRoom
tags: [Rooms]
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
responses:
  200:
    description: Room details
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Room'
  401:
    description: Unauthorized
  403:
    description: Forbidden
  404:
    description: Room not found
```

---

#### DELETE /rooms/{id}

**Purpose**: Cancel scheduled meeting

**Request**:

```yaml
operationId: cancelRoom
tags: [Rooms]
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
responses:
  204:
    description: Room cancelled successfully (no content)
  401:
    description: Unauthorized
  403:
    description: Forbidden (not organizer)
  404:
    description: Room not found
  409:
    description: Cannot cancel room in progress
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

**Business Logic**:

1. Validate room is not in progress
2. Mark room as cancelled
3. Send cancellation notifications to all participants

---

#### GET /rooms

**Purpose**: List rooms (for organizer/entity)

**Request**:

```yaml
operationId: listRooms
tags: [Rooms]
security:
  - bearerAuth: []
parameters:
  - name: entityId
    in: query
    required: true
    schema:
      type: integer
  - name: status
    in: query
    schema:
      type: string
      enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
  - name: from
    in: query
    schema:
      type: string
      format: date-time
    description: Filter rooms scheduled from this date
  - name: to
    in: query
    schema:
      type: string
      format: date-time
    description: Filter rooms scheduled until this date
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
  - name: limit
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
responses:
  200:
    description: List of rooms
    content:
      application/json:
        schema:
          type: object
          required: [data, pagination]
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/Room'
            pagination:
              $ref: '#/components/schemas/Pagination'
  401:
    description: Unauthorized
  403:
    description: Forbidden
```

---

### Participant Access Endpoints

#### GET /magic-link/validate

**Purpose**: Validate magic link and show staging area

**Request**:

```yaml
operationId: validateMagicLink
tags: [Access]
security: [] # Public endpoint
parameters:
  - name: token
    in: query
    required: true
    schema:
      type: string
      format: uuid
    description: Magic link token
responses:
  200:
    description: Magic link valid, show staging area
    content:
      application/json:
        schema:
          type: object
          required: [roomId, roomTitle, scheduledFor, participantName]
          properties:
            roomId:
              type: integer
              example: 123
            roomTitle:
              type: string
              example: "Consulta Cardiologia"
            scheduledFor:
              type: string
              format: date-time
              example: "2025-11-10T14:00:00Z"
            participantName:
              type: string
              example: "José Silva"
            requiresPassword:
              type: boolean
              example: true
  404:
    description: Magic link not found or expired
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  410:
    description: Magic link already used (single-use enforcement)
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

---

#### POST /rooms/{id}/join

**Purpose**: Validate password and generate LiveKit access token

**Request**:

```yaml
operationId: joinRoom
tags: [Access]
security: [] # Public endpoint (uses magic link token + password)
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [token, password]
        properties:
          token:
            type: string
            format: uuid
            example: "550e8400-e29b-41d4-a716-446655440000"
            description: Magic link token
          password:
            type: string
            pattern: '^\d{8}$'
            example: "12345678"
            description: 8-digit password sent via email/WhatsApp
responses:
  200:
    description: Access granted
    content:
      application/json:
        schema:
          type: object
          required: [accessToken, liveKitUrl, roomName, participantIdentity]
          properties:
            accessToken:
              type: string
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              description: LiveKit access token
            liveKitUrl:
              type: string
              example: "wss://livekit.conexa.com.br"
              description: LiveKit server WebSocket URL
            roomName:
              type: string
              example: "room-123"
              description: LiveKit room name
            participantIdentity:
              type: string
              example: "participant-456"
              description: Unique participant identity for LiveKit
  401:
    description: Invalid password
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  404:
    description: Room or magic link not found
  409:
    description: Room capacity reached
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
  429:
    description: Too many password attempts (rate limit)
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

**Business Logic**:

1. Validate magic link token exists and not expired
2. Validate password (bcrypt comparison)
3. Check room capacity (current participants < max)
4. Generate LiveKit access token with:
   - Room name: `room-{roomId}`
   - Participant identity: `participant-{participantId}`
   - Grant: canPublish, canSubscribe
   - Metadata: participant name, type
5. Mark magic link as used
6. Create RoomEvent (participant joined)
7. Return LiveKit credentials

**Rate Limiting**:

- 5 password attempts per magic link per 15 minutes

---

### Recording Management Endpoints

#### GET /rooms/{id}/recordings

**Purpose**: List recordings for a room

**Request**:

```yaml
operationId: listRecordings
tags: [Recordings]
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
    description: Room ID
responses:
  200:
    description: List of recordings
    content:
      application/json:
        schema:
          type: object
          required: [data]
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/Recording'
  401:
    description: Unauthorized
  403:
    description: Forbidden
  404:
    description: Room not found
```

---

#### GET /recordings/{id}/download

**Purpose**: Generate pre-signed URL for recording download

**Request**:

```yaml
operationId: downloadRecording
tags: [Recordings]
security:
  - bearerAuth: []
parameters:
  - name: id
    in: path
    required: true
    schema:
      type: integer
      minimum: 1
    description: Recording ID
responses:
  200:
    description: Pre-signed download URL
    content:
      application/json:
        schema:
          type: object
          required: [url, expiresAt]
          properties:
            url:
              type: string
              format: uri
              example: "https://s3.amazonaws.com/bucket/recording-123.mp4?signature=..."
              description: Pre-signed S3 URL (valid for 15 minutes)
            expiresAt:
              type: string
              format: date-time
              example: "2025-11-08T15:15:00Z"
  401:
    description: Unauthorized
  403:
    description: Forbidden
  404:
    description: Recording not found
  410:
    description: Recording purged (retention policy expired)
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ErrorResponse'
```

---

### Metrics Endpoints

#### GET /agent-usage

**Purpose**: Get AI agent usage metrics

**Request**:

```yaml
operationId: getAgentUsage
tags: [Metrics]
security:
  - bearerAuth: []
parameters:
  - name: entityId
    in: query
    required: true
    schema:
      type: integer
  - name: departmentId
    in: query
    schema:
      type: integer
      nullable: true
  - name: from
    in: query
    schema:
      type: string
      format: date-time
    description: Start date for metrics
  - name: to
    in: query
    schema:
      type: string
      format: date-time
    description: End date for metrics
responses:
  200:
    description: Agent usage metrics
    content:
      application/json:
        schema:
          type: object
          required: [summary, sessions]
          properties:
            summary:
              type: object
              required: [totalSessions, totalDurationMinutes, totalTokensInput, totalTokensOutput, estimatedCost]
              properties:
                totalSessions:
                  type: integer
                  example: 42
                totalDurationMinutes:
                  type: number
                  format: float
                  example: 2100.5
                totalTokensInput:
                  type: integer
                  example: 500000
                totalTokensOutput:
                  type: integer
                  example: 250000
                estimatedCost:
                  type: number
                  format: float
                  example: 45.50
                  description: Cost in USD
            sessions:
              type: array
              items:
                $ref: '#/components/schemas/AgentUsage'
  401:
    description: Unauthorized
  403:
    description: Forbidden
```

---

## Schemas

### Entity

```yaml
Entity:
  type: object
  required: [id, name, type, maxParticipants, recordingRetentionDays, active, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 10
    name:
      type: string
      example: "Clínica Cardio Saúde"
    type:
      type: string
      example: "medical_clinic"
    defaultInstructions:
      type: string
      nullable: true
      example: "Provide medical consultation guidelines."
    maxParticipants:
      type: integer
      example: 50
    recordingRetentionDays:
      type: integer
      enum: [30, 90, 365]
      example: 90
    active:
      type: boolean
      example: true
    createdAt:
      type: string
      format: date-time
      example: "2025-11-01T10:00:00Z"
    updatedAt:
      type: string
      format: date-time
      example: "2025-11-08T14:30:00Z"
```

### Department

```yaml
Department:
  type: object
  required: [id, entityId, name, active, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 5
    entityId:
      type: integer
      example: 10
    name:
      type: string
      example: "Cardiologia"
    instructions:
      type: string
      nullable: true
      example: "Focus on cardiovascular health."
    active:
      type: boolean
      example: true
    createdAt:
      type: string
      format: date-time
      example: "2025-11-01T10:00:00Z"
    updatedAt:
      type: string
      format: date-time
      example: "2025-11-08T14:30:00Z"
```

### Professional

```yaml
Professional:
  type: object
  required: [id, name, phoneNumber, active, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 42
    name:
      type: string
      example: "Dr. João Silva"
    email:
      type: string
      nullable: true
      example: "joao.silva@clinica.com.br"
    phoneNumber:
      type: string
      example: "+5511999999999"
    externalId:
      type: string
      nullable: true
      example: "CRM-123456-SP"
    licenseNumber:
      type: string
      nullable: true
      example: "CRM 123456"
    active:
      type: boolean
      example: true
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
    entities:
      type: array
      description: List of entities this professional is linked to
      items:
        $ref: '#/components/schemas/ProfessionalEntity'
```

### ProfessionalEntity

```yaml
ProfessionalEntity:
  type: object
  required: [id, professionalId, entityId, active, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 100
    professionalId:
      type: integer
      example: 42
    entityId:
      type: integer
      example: 10
    departmentId:
      type: integer
      nullable: true
      example: 5
    active:
      type: boolean
      example: true
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### KnowledgeBase

```yaml
KnowledgeBase:
  type: object
  required: [id, entityId, documentName, chunkText, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 1000
    entityId:
      type: integer
      example: 10
    departmentId:
      type: integer
      nullable: true
      example: 5
    documentName:
      type: string
      example: "cardiology-guidelines-2025.pdf"
    chunkText:
      type: string
      example: "Cardiovascular assessment should include..."
    metadata:
      type: object
      additionalProperties: true
      example:
        page: 42
        section: "Chapter 3: Assessment"
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### Room

```yaml
Room:
  type: object
  required: [id, title, scheduledFor, duration, entityId, status, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 123
    title:
      type: string
      example: "Consulta Cardiologia"
    scheduledFor:
      type: string
      format: date-time
      example: "2025-11-10T14:00:00Z"
    duration:
      type: integer
      example: 60
      description: Duration in minutes
    entityId:
      type: integer
      example: 10
    departmentId:
      type: integer
      nullable: true
      example: 5
    customPrompt:
      type: string
      nullable: true
      example: "Focus on cardiovascular assessment."
    maxParticipants:
      type: integer
      example: 10
    status:
      type: string
      enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
      example: "SCHEDULED"
    liveKitRoomName:
      type: string
      nullable: true
      example: "room-123"
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
    participants:
      type: array
      items:
        $ref: '#/components/schemas/RoomParticipant'
```

### RoomParticipant

```yaml
RoomParticipant:
  type: object
  required: [id, roomId, participantId, magicLink, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 500
    roomId:
      type: integer
      example: 123
    participantId:
      type: integer
      example: 456
    magicLink:
      type: string
      format: uuid
      example: "550e8400-e29b-41d4-a716-446655440000"
    password:
      type: string
      description: Bcrypt hashed 8-digit password (never returned in API)
      example: "$2b$10$..."
    used:
      type: boolean
      example: false
      description: Single-use enforcement
    expiresAt:
      type: string
      format: date-time
      example: "2025-11-10T15:00:00Z"
    context:
      type: object
      additionalProperties: true
      example:
        processedContext: "Patient history notes..."
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
    participant:
      $ref: '#/components/schemas/Participant'
```

### Participant

```yaml
Participant:
  type: object
  required: [id, name, type, phoneNumber, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 456
    name:
      type: string
      example: "José Silva"
    type:
      type: string
      enum: [CLIENT, PROFESSIONAL, AGENT]
      example: "CLIENT"
    phoneNumber:
      type: string
      example: "+5511988888888"
    externalId:
      type: string
      nullable: true
      example: "patient-12345"
    professionalId:
      type: integer
      nullable: true
      example: 42
      description: Set when type=PROFESSIONAL
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### Recording

```yaml
Recording:
  type: object
  required: [id, roomId, fileName, s3Key, durationSeconds, fileSizeBytes, status, createdAt]
  properties:
    id:
      type: integer
      example: 789
    roomId:
      type: integer
      example: 123
    fileName:
      type: string
      example: "recording-2025-11-10-14-00.mp4"
    s3Key:
      type: string
      example: "recordings/entity-10/room-123/recording-789.mp4"
    durationSeconds:
      type: integer
      example: 3600
    fileSizeBytes:
      type: integer
      format: int64
      example: 524288000
    status:
      type: string
      enum: [PROCESSING, READY, PURGED]
      example: "READY"
    purgeAt:
      type: string
      format: date-time
      nullable: true
      example: "2025-12-10T14:00:00Z"
      description: Auto-calculated based on entity retention policy
    createdAt:
      type: string
      format: date-time
```

### AgentUsage

```yaml
AgentUsage:
  type: object
  required: [id, roomId, participantId, sessionStart, data, createdAt, updatedAt]
  properties:
    id:
      type: integer
      example: 1000
    roomId:
      type: integer
      example: 123
    participantId:
      type: integer
      example: 999
      description: Agent participant ID
    entityId:
      type: integer
      nullable: true
      example: 10
    departmentId:
      type: integer
      nullable: true
      example: 5
    sessionStart:
      type: string
      format: date-time
      example: "2025-11-10T14:00:00Z"
    sessionEnd:
      type: string
      format: date-time
      nullable: true
      example: "2025-11-10T15:00:00Z"
    data:
      type: object
      required: [durationSeconds, totalTokensInput, totalTokensOutput, estimatedCost]
      properties:
        durationSeconds:
          type: integer
          example: 3600
        totalTokensInput:
          type: integer
          example: 15000
        totalTokensOutput:
          type: integer
          example: 8500
        totalAudioMinutes:
          type: number
          format: float
          example: 45.5
        interactionsCount:
          type: integer
          example: 42
        transcriptionCount:
          type: integer
          example: 12
        estimatedCost:
          type: number
          format: float
          example: 2.35
          description: Cost in USD
        metadata:
          type: object
          additionalProperties: true
          example:
            model: "gpt-4"
            temperature: 0.7
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
```

### Pagination

```yaml
Pagination:
  type: object
  required: [page, limit, total, pages]
  properties:
    page:
      type: integer
      example: 1
    limit:
      type: integer
      example: 20
    total:
      type: integer
      example: 150
      description: Total items
    pages:
      type: integer
      example: 8
      description: Total pages
```

### ErrorResponse

```yaml
ErrorResponse:
  type: object
  required: [error, message]
  properties:
    error:
      type: string
      example: "UNAUTHORIZED"
    message:
      type: string
      example: "Invalid credentials"
    details:
      type: object
      additionalProperties: true
      nullable: true
```

### ValidationErrorResponse

```yaml
ValidationErrorResponse:
  type: object
  required: [error, message, validationErrors]
  properties:
    error:
      type: string
      example: "VALIDATION_ERROR"
    message:
      type: string
      example: "Request validation failed"
    validationErrors:
      type: array
      items:
        type: object
        required: [field, message]
        properties:
          field:
            type: string
            example: "email"
          message:
            type: string
            example: "Invalid email format"
          value:
            description: The invalid value submitted
```

---

## Security Schemes

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT access token (RS256 signed)
```

---

## Rate Limiting

**Global Limits**:

- 100 requests per minute per IP (Manager API)
- 200 requests per minute per IP (Secretary API)
- 5 login attempts per 15 minutes per IP
- 5 password attempts per magic link per 15 minutes

**Headers**:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699459200
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Malformed request syntax |
| 401 | UNAUTHORIZED | Authentication required or invalid credentials |
| 403 | FORBIDDEN | Authenticated but insufficient permissions |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Resource conflict (duplicate, state conflict) |
| 410 | GONE | Resource no longer available (purged) |
| 413 | PAYLOAD_TOO_LARGE | Request body exceeds size limit |
| 422 | VALIDATION_ERROR | Request validation failed |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Unexpected server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## Webhooks (LiveKit → Secretary)

**Webhook URL**: `https://secretary.conexa.com.br/webhooks/livekit`  
**Authentication**: HMAC signature validation (using LiveKit API secret)

### Events Handled

#### room_started

**Payload**:

```json
{
  "event": "room_started",
  "room": {
    "name": "room-123",
    "sid": "RM_abc123",
    "creationTime": "1699459200"
  }
}
```

**Action**: Update Room.status = IN_PROGRESS

---

#### room_finished

**Payload**:

```json
{
  "event": "room_finished",
  "room": {
    "name": "room-123",
    "sid": "RM_abc123",
    "creationTime": "1699459200"
  }
}
```

**Action**: Update Room.status = COMPLETED, trigger recording download

---

#### participant_joined

**Payload**:

```json
{
  "event": "participant_joined",
  "room": {
    "name": "room-123",
    "sid": "RM_abc123"
  },
  "participant": {
    "identity": "participant-456",
    "sid": "PA_def456",
    "name": "José Silva"
  }
}
```

**Action**: Create RoomEvent record

---

#### participant_left

**Payload**:

```json
{
  "event": "participant_left",
  "room": {
    "name": "room-123",
    "sid": "RM_abc123"
  },
  "participant": {
    "identity": "participant-456",
    "sid": "PA_def456"
  }
}
```

**Action**: Create RoomEvent record

---

#### egress_ended (Recording completed)

**Payload**:

```json
{
  "event": "egress_ended",
  "egressInfo": {
    "egressId": "EG_abc123",
    "roomName": "room-123",
    "status": "EGRESS_COMPLETE",
    "fileResults": [
      {
        "filename": "recording-123.mp4",
        "size": "524288000",
        "duration": "3600.5"
      }
    ]
  }
}
```

**Action**: Create Recording record, copy file to S3, set purge_at based on entity retention policy

---

## Implementation Notes

### Authentication Flow

**Manager/Secretary APIs**:

1. User logs in with email/password → POST /auth/login
2. Server validates credentials, generates JWT access token (15 min expiry) + refresh token (7 days)
3. Client includes `Authorization: Bearer {accessToken}` header in subsequent requests
4. When access token expires, client calls POST /auth/refresh with refresh token
5. Server validates refresh token, issues new access token

**Participant Access**:

1. Participant receives magic link via email/WhatsApp: `https://room.conexa.com.br/join?token={uuid}`
2. Frontend calls GET /magic-link/validate?token={uuid} to verify link
3. Frontend shows staging area (camera/microphone test)
4. Participant enters 8-digit password
5. Frontend calls POST /rooms/{id}/join with token + password
6. Backend validates password, generates LiveKit access token
7. Frontend connects to LiveKit server with access token

### Database Migrations

**Strategy**: Sequenced SQL migrations with version control

**Example Migration** (001_create_users_table.sql):

```sql
-- Up migration
CREATE TYPE user_role AS ENUM ('MANAGER', 'ENTITY_ADMIN');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(254) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  role user_role NOT NULL,
  entity_id INTEGER REFERENCES entities(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT chk_manager_no_entity CHECK (
    (role = 'MANAGER' AND entity_id IS NULL) OR
    (role = 'ENTITY_ADMIN' AND entity_id IS NOT NULL)
  )
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_entity ON users(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_users_active ON users(active) WHERE active = true;

-- Down migration
DROP TABLE users;
DROP TYPE user_role;
```

### Environment Variables

**Manager Service** (.env.example):

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agent_doctor_live

# JWT
JWT_ACCESS_SECRET=<RS256-private-key>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=<RS256-private-key>
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:3002,https://room.conexa.com.br
```

**Secretary Service** (.env.example):

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/agent_doctor_live

# Redis
REDIS_URL=redis://localhost:6379

# LiveKit
LIVEKIT_API_KEY=<api-key>
LIVEKIT_API_SECRET=<api-secret>
LIVEKIT_URL=wss://livekit.conexa.com.br

# Magic Links
MAGIC_LINK_BASE_URL=https://room.conexa.com.br/join
MAGIC_LINK_EXPIRY_HOURS=24

# Notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@conexa.com.br
SMTP_PASSWORD=<password>
WHATSAPP_API_URL=https://api.whatsapp.com/v1
WHATSAPP_API_TOKEN=<token>

# S3 (Recordings)
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=conexa-recordings

# CORS
CORS_ORIGINS=http://localhost:3002,https://room.conexa.com.br
```

---

## Next Steps

After API contracts are defined:

1. **Generate TypeScript types** from schemas (using tools like `openapi-typescript`)
2. **Implement repository layer** based on data-model.md
3. **Implement Fastify routes** with Zod validation schemas
4. **Write integration tests** for critical endpoints
5. **Generate Postman collection** for manual testing
6. **Document webhook testing** procedures
