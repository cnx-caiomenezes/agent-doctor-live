# Developer Quickstart Guide

**Feature**: AI-Powered Video/Audio Meeting Platform  
**Branch**: `001-ai-video-platform`  
**Created**: 2025-11-08  
**Version**: 1.0.0

---

## Overview

This guide will help you set up the complete development environment for the AI-powered meeting platform. The platform consists of 5 services running in a monorepo structure with shared infrastructure dependencies.

**Estimated Setup Time**: 30-45 minutes

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

| Software | Minimum Version | Installation |
|----------|----------------|--------------|
| **Node.js** | 24.0.0+ | [nodejs.org](https://nodejs.org/) or use `nvm` |
| **pnpm** | 9.0.0+ | `npm install -g pnpm` |
| **Docker** | 24.0.0+ | [docker.com](https://docker.com/) |
| **Docker Compose** | 2.20.0+ | Included with Docker Desktop |
| **PostgreSQL Client** | 16.0+ | `psql` command (for manual DB access) |
| **Git** | 2.40.0+ | [git-scm.com](https://git-scm.com/) |

### Optional Software

| Software | Purpose |
|----------|---------|
| **Postman** | API testing |
| **VSCode** | Recommended IDE with extensions |
| **k9s** | Kubernetes dashboard (if testing LiveKit in K8s) |

### System Requirements

- **OS**: Linux, macOS, or Windows with WSL2
- **RAM**: Minimum 8GB (16GB recommended)
- **CPU**: 4+ cores recommended
- **Disk Space**: 10GB free space

---

## Quick Start (TL;DR)

```bash
# Clone repository
git clone https://github.com/conexasaude/agent-doctor-live.git
cd agent-doctor-live

# Checkout feature branch
git checkout 001-ai-video-platform

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, LiveKit)
docker-compose up -d

# Wait for services to be ready (30 seconds)
sleep 30

# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start all services in development mode
pnpm dev

# Services will be available at:
# - Manager:    http://localhost:3000
# - Secretary:  http://localhost:3001
# - Room:       http://localhost:3002
# - LiveKit:    ws://localhost:7880
```

---

## Detailed Setup Instructions

### Step 1: Clone Repository

```bash
# Clone via HTTPS
git clone https://github.com/conexasaude/agent-doctor-live.git

# OR clone via SSH
git clone git@github.com:conexasaude/agent-doctor-live.git

# Navigate to project directory
cd agent-doctor-live

# Checkout feature branch
git checkout 001-ai-video-platform

# Verify branch
git branch --show-current
# Should output: 001-ai-video-platform
```

---

### Step 2: Install Node.js Dependencies

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Verify pnpm installation
pnpm --version
# Should output: 9.x.x or higher

# Install all dependencies for all services
pnpm install

# This will install dependencies for:
# - Root workspace
# - manager/
# - secretary/
# - agent/
# - room/
# - Shared packages

# Expected output:
# Progress: resolved X, reused Y, downloaded Z, added W
# Done in Xs
```

**Troubleshooting**:
- If you see `ERR_PNPM_FETCH_*` errors, check your internet connection
- If you see node version errors, use `nvm use 24` or update Node.js
- If installation hangs, try `pnpm install --no-frozen-lockfile`

---

### Step 3: Configure Environment Variables

Each service requires environment variables. Copy the example files and customize:

#### Manager Service

```bash
cd manager
cp .env.example .env

# Edit .env with your preferred editor
nano .env  # or vim, code, etc.
```

**manager/.env**:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_doctor_live

# JWT Authentication (RS256)
# Generate keys: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -outform PEM -pubout -out public.pem
JWT_ACCESS_SECRET=<paste-private-key-here>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=<paste-private-key-here>
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=manager:

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# File Uploads (Knowledge Base)
UPLOAD_MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_ALLOWED_TYPES=application/pdf

# Embedding Model (for vector database)
EMBEDDING_MODEL=all-MiniLM-L12-v2  # or all-mpnet-base-v2
EMBEDDING_DIMENSIONS=384  # 384 for MiniLM, 768 for mpnet
```

#### Secretary Service

```bash
cd ../secretary
cp .env.example .env
nano .env
```

**secretary/.env**:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_doctor_live

# Redis
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=secretary:

# LiveKit Integration
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_WEBHOOK_SECRET=<generate-random-secret>

# Magic Links
MAGIC_LINK_BASE_URL=http://localhost:3002/join
MAGIC_LINK_EXPIRY_HOURS=24

# Notifications (Email)
SMTP_HOST=mailhog  # Use MailHog for local development
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@conexa.local
EMAIL_ENABLED=true

# Notifications (WhatsApp - Mock in dev)
WHATSAPP_API_URL=http://localhost:3003/mock/whatsapp
WHATSAPP_API_TOKEN=dev-token
WHATSAPP_ENABLED=false

# AWS S3 (Recordings) - Use MinIO for local development
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=conexa-recordings
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

#### Agent Service

```bash
cd ../agent
cp .env.example .env
nano .env
```

**agent/.env**:

```bash
# Server Configuration
PORT=3003
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_doctor_live

# Redis
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=agent:

# LiveKit Agent SDK
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=ws://localhost:7880

# AI Model Configuration
OPENAI_API_KEY=<your-openai-key>  # Required for GPT models
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7

# Vector Database (pgvector)
VECTOR_SIMILARITY_THRESHOLD=0.7
VECTOR_TOP_K_RESULTS=5

# Agent Behavior
AGENT_AUTO_JOIN=true
AGENT_MAX_CONCURRENT_SESSIONS=10
```

#### Room Client

```bash
cd ../room
cp .env.example .env
nano .env
```

**room/.env**:

```bash
# Vite Configuration
VITE_APP_TITLE=Conexa Meeting Room
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_LIVEKIT_URL=ws://localhost:7880

# Feature Flags
VITE_ENABLE_SCREEN_SHARE=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_RECORDING=true
VITE_ENABLE_AI_AGENT=true

# Development
VITE_LOG_LEVEL=debug
```

#### Root Workspace

```bash
cd ..
cp .env.example .env
nano .env
```

**root/.env**:

```bash
# Docker Compose Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=agent_doctor_live

REDIS_PASSWORD=

LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret

MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

---

### Step 4: Start Infrastructure Services

The platform requires PostgreSQL, Redis, LiveKit Server, and MinIO (S3-compatible storage).

```bash
# Start all infrastructure services
docker-compose up -d

# Verify all services are running
docker-compose ps

# Expected output:
# NAME                STATUS              PORTS
# postgres            Up 10 seconds       0.0.0.0:5432->5432/tcp
# redis               Up 10 seconds       0.0.0.0:6379->6379/tcp
# livekit             Up 10 seconds       0.0.0.0:7880->7880/tcp
# minio               Up 10 seconds       0.0.0.0:9000-9001->9000-9001/tcp
# mailhog             Up 10 seconds       0.0.0.0:1025->1025/tcp, 0.0.0.0:8025->8025/tcp

# Wait for services to be ready (30 seconds)
sleep 30

# Check service health
docker-compose logs postgres | tail -20
docker-compose logs redis | tail -20
docker-compose logs livekit | tail -20
```

**docker-compose.yml** (for reference):

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-agent_doctor_live}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: redis
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  livekit:
    image: livekit/livekit-server:latest
    container_name: livekit
    command: --config /etc/livekit.yaml
    ports:
      - "7880:7880"
      - "7881:7881"
      - "7882:7882/udp"
    volumes:
      - ./docker/livekit.yaml:/etc/livekit.yaml
    environment:
      LIVEKIT_API_KEY: ${LIVEKIT_API_KEY:-devkey}
      LIVEKIT_API_SECRET: ${LIVEKIT_API_SECRET:-secret}

  minio:
    image: minio/minio:latest
    container_name: minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}

  mailhog:
    image: mailhog/mailhog:latest
    container_name: mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

**docker/livekit.yaml** (LiveKit configuration):

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: false
redis:
  address: redis:6379
keys:
  devkey: secret
room:
  auto_create: true
  empty_timeout: 300
  enable_recording: true
webhook:
  api_key: devkey
  urls:
    - http://host.docker.internal:3001/webhooks/livekit
logging:
  level: debug
```

**Accessing Infrastructure UIs**:

- **PostgreSQL**: `psql -h localhost -U postgres -d agent_doctor_live`
- **Redis**: `redis-cli -h localhost`
- **MinIO Console**: http://localhost:9001 (user: `minioadmin`, password: `minioadmin`)
- **MailHog**: http://localhost:8025 (email testing)

---

### Step 5: Database Setup

#### Enable pgvector Extension

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d agent_doctor_live

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

# Verify extension
\dx

# Expected output should include:
#  vector | 0.5.1 | public | vector data type and ivfflat and hnsw access methods

# Exit psql
\q
```

#### Run Migrations

```bash
# From project root directory
pnpm db:migrate

# This will:
# 1. Create all tables (users, entities, departments, professionals, etc.)
# 2. Create indexes
# 3. Create triggers (updated_at, purge_at calculations)
# 4. Insert initial data (ENUM types)

# Expected output:
# ✓ Migration 001_create_enums.sql applied
# ✓ Migration 002_create_users.sql applied
# ✓ Migration 003_create_entities.sql applied
# ✓ Migration 004_create_departments.sql applied
# ✓ Migration 005_create_professionals.sql applied
# ✓ Migration 006_create_professional_entities.sql applied
# ✓ Migration 007_create_knowledge_base.sql applied
# ✓ Migration 008_create_rooms.sql applied
# ✓ Migration 009_create_participants.sql applied
# ✓ Migration 010_create_room_participants.sql applied
# ✓ Migration 011_create_room_events.sql applied
# ✓ Migration 012_create_agent_session_events.sql applied
# ✓ Migration 013_create_agent_usage.sql applied
# ✓ Migration 014_create_recordings.sql applied
# ✓ Migration 015_create_triggers.sql applied
# All migrations applied successfully!
```

**Troubleshooting**:
- If migrations fail, check PostgreSQL connection
- If "table already exists" error, run `pnpm db:reset` to drop all tables and rerun
- Check `scripts/migrations/` directory for SQL files

#### Seed Development Data

```bash
# Seed database with test data
pnpm db:seed

# This will create:
# - 1 MANAGER user (email: manager@conexa.local, password: Manager123!)
# - 2 Entities (Clínica Cardio Saúde, Design Studio Pro)
# - 4 Departments (Cardiologia, Clínica Geral, UI/UX, Frontend)
# - 5 Professionals (2 doctors, 3 designers)
# - 3 ENTITY_ADMIN users
# - Sample knowledge base entries

# Expected output:
# ✓ Seeded 1 manager user
# ✓ Seeded 2 entities
# ✓ Seeded 4 departments
# ✓ Seeded 5 professionals
# ✓ Seeded 3 entity admin users
# ✓ Seeded 10 knowledge base chunks
# Seed complete!

# Login credentials will be printed
```

**Default Users**:

| Email | Password | Role | Entity |
|-------|----------|------|--------|
| manager@conexa.local | Manager123! | MANAGER | (all entities) |
| admin@clinica.local | Admin123! | ENTITY_ADMIN | Clínica Cardio Saúde |
| admin@design.local | Admin123! | ENTITY_ADMIN | Design Studio Pro |

---

### Step 6: Create S3 Bucket (MinIO)

```bash
# Install MinIO client
brew install minio/stable/mc  # macOS
# OR
curl -O https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc

# Configure MinIO client
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket for recordings
mc mb local/conexa-recordings

# Set public read policy (for development only)
mc anonymous set download local/conexa-recordings

# Verify bucket
mc ls local/

# Expected output:
# [2025-11-08 10:00:00 UTC]     0B conexa-recordings/
```

---

### Step 7: Start Application Services

#### Option A: Start All Services (Recommended)

```bash
# From project root
pnpm dev

# This will start:
# - Manager service on http://localhost:3000
# - Secretary service on http://localhost:3001
# - Agent service on http://localhost:3003
# - Room client on http://localhost:3002

# Services will hot-reload on file changes
```

**Expected Console Output**:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   🚀 All services started successfully!        │
│                                                 │
│   Manager:    http://localhost:3000            │
│   Secretary:  http://localhost:3001            │
│   Agent:      http://localhost:3003            │
│   Room:       http://localhost:3002            │
│                                                 │
│   LiveKit:    ws://localhost:7880              │
│   MinIO:      http://localhost:9001            │
│   MailHog:    http://localhost:8025            │
│                                                 │
└─────────────────────────────────────────────────┘

[manager]   [10:00:00] Server listening on http://localhost:3000
[secretary] [10:00:00] Server listening on http://localhost:3001
[agent]     [10:00:00] Server listening on http://localhost:3003
[room]      [10:00:00] Local:   http://localhost:3002
```

#### Option B: Start Services Individually

```bash
# Terminal 1 - Manager
cd manager
pnpm dev

# Terminal 2 - Secretary
cd secretary
pnpm dev

# Terminal 3 - Agent
cd agent
pnpm dev

# Terminal 4 - Room Client
cd room
pnpm dev
```

---

### Step 8: Verify Installation

#### Health Checks

```bash
# Check Manager API
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-08T10:00:00.000Z","uptime":5.123}

# Check Secretary API
curl http://localhost:3001/health

# Check Agent API
curl http://localhost:3003/health

# Check LiveKit
curl http://localhost:7880/
# Should return LiveKit version info
```

#### Test Database Connection

```bash
# From project root
pnpm db:test

# Expected output:
# ✓ PostgreSQL connection: OK
# ✓ pgvector extension: OK
# ✓ Redis connection: OK
# ✓ Tables created: 14
# ✓ Seed data: 3 users, 2 entities, 5 professionals
# All checks passed!
```

#### Test Authentication

```bash
# Login as manager
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@conexa.local",
    "password": "Manager123!"
  }'

# Expected response:
# {
#   "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": 1,
#     "email": "manager@conexa.local",
#     "role": "MANAGER",
#     "entityId": null
#   }
# }

# Save accessToken for next requests
export TOKEN="<paste-access-token-here>"

# Test authenticated endpoint
curl http://localhost:3000/api/v1/entities \
  -H "Authorization: Bearer $TOKEN"

# Should return list of entities
```

---

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific service
pnpm test --filter manager
pnpm test --filter secretary

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Expected coverage targets:
# - Statements: > 80%
# - Branches: > 75%
# - Functions: > 80%
# - Lines: > 80%
```

### Linting and Formatting

```bash
# Lint all services
pnpm lint

# Fix lint errors
pnpm lint:fix

# Format code with Prettier
pnpm format

# Type check
pnpm typecheck
```

### Database Operations

```bash
# Reset database (drop all tables and rerun migrations)
pnpm db:reset

# Create new migration
pnpm db:migration:create <migration-name>

# Rollback last migration
pnpm db:migrate:rollback

# View migration status
pnpm db:migrate:status
```

### Viewing Logs

```bash
# View logs for all services
pnpm logs

# View logs for specific service
pnpm logs --filter manager

# View infrastructure logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f livekit
```

---

## Testing the Platform

### Test Scenario 1: Entity Configuration

1. **Login to Manager Interface**:
   - Open http://localhost:3000
   - Login with `manager@conexa.local` / `Manager123!`

2. **Create Entity**:
   - Navigate to "Entities" → "Create New"
   - Fill in:
     - Name: "Test Clinic"
     - Type: "medical_clinic"
     - Max Participants: 50
     - Default Instructions: "Provide medical consultation guidelines."
   - Click "Create"

3. **Verify Entity**:
   - Entity should appear in list
   - Click to view details

### Test Scenario 2: Schedule Meeting

1. **Login to Secretary Interface**:
   - Open http://localhost:3001
   - Login with `admin@clinica.local` / `Admin123!`

2. **Schedule Room**:
   - Navigate to "Schedule Meeting"
   - Fill in:
     - Title: "Cardiology Consultation"
     - Date/Time: Tomorrow at 2:00 PM
     - Department: Cardiologia
     - Add Participant: 
       - Name: "Test Patient"
       - Email: "patient@test.com"
       - Type: CLIENT
   - Click "Schedule"

3. **Check Email**:
   - Open MailHog: http://localhost:8025
   - Verify email received with:
     - Meeting details
     - Magic link
     - 8-digit password

### Test Scenario 3: Join Meeting

1. **Click Magic Link**:
   - From MailHog, click magic link in email
   - Should open http://localhost:3002/join?token=...

2. **Staging Area**:
   - See camera/microphone preview
   - Adjust settings
   - Click "Join Meeting"

3. **Enter Password**:
   - Enter 8-digit password from email
   - Click "Submit"

4. **In Meeting Room**:
   - See video/audio working
   - Test chat
   - Test screen share
   - See AI agent panel (if enabled)

### Test Scenario 4: AI Agent Context

1. **Upload Knowledge Base Document**:
   - Login to Manager as `admin@clinica.local`
   - Navigate to "Knowledge Base" → "Upload"
   - Upload PDF document
   - Wait for processing (check status endpoint)

2. **Schedule Meeting with Department**:
   - Schedule meeting with department that has knowledge base
   - Set custom prompt: "Focus on treatment protocols"

3. **Join Meeting and Test Agent**:
   - Join meeting
   - Ask agent questions related to uploaded document
   - Verify agent responds with context from document

---

## Postman Collection

Import the Postman collection for easy API testing:

```bash
# Collection location
postman/conexa-meeting-platform.postman_collection.json

# Environment variables
postman/local-dev.postman_environment.json
```

**Import Steps**:
1. Open Postman
2. Click "Import"
3. Select `postman/conexa-meeting-platform.postman_collection.json`
4. Select `postman/local-dev.postman_environment.json`
5. Select "Local Dev" environment in top-right dropdown

**Available Requests**:
- Manager API: Auth, Entities, Departments, Professionals, Knowledge Base
- Secretary API: Rooms, Magic Links, Recordings, Metrics
- Pre-configured with auth token management

---

## Troubleshooting

### PostgreSQL Connection Issues

**Problem**: `ECONNREFUSED` when connecting to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL container is running
docker-compose ps postgres

# If not running, start it
docker-compose up -d postgres

# Check logs for errors
docker-compose logs postgres

# Test connection manually
psql -h localhost -U postgres -d agent_doctor_live
```

### Redis Connection Issues

**Problem**: `ECONNREFUSED` when connecting to Redis

**Solution**:
```bash
# Check if Redis container is running
docker-compose ps redis

# Start Redis
docker-compose up -d redis

# Test connection
redis-cli -h localhost ping
# Should respond: PONG
```

### LiveKit Connection Issues

**Problem**: Cannot connect to LiveKit or "Room not found" errors

**Solution**:
```bash
# Check LiveKit logs
docker-compose logs livekit

# Verify LiveKit configuration
cat docker/livekit.yaml

# Test LiveKit API
curl http://localhost:7880/

# Verify API keys match in all .env files
grep LIVEKIT_API_KEY */. env
```

### pgvector Extension Not Found

**Problem**: `extension "vector" does not exist`

**Solution**:
```bash
# Verify you're using pgvector image
docker-compose ps postgres
# Should show: pgvector/pgvector:pg16

# If using wrong image, update docker-compose.yml and recreate
docker-compose down
docker-compose up -d postgres

# Connect and enable extension
psql -h localhost -U postgres -d agent_doctor_live -c "CREATE EXTENSION vector;"
```

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port in .env
PORT=3010
```

### Hot Reload Not Working

**Problem**: Changes not reflected when editing files

**Solution**:
```bash
# Ensure you're running in development mode
NODE_ENV=development pnpm dev

# Clear node_modules and reinstall
pnpm clean
pnpm install

# Restart dev server
pnpm dev
```

### Migration Errors

**Problem**: Migration fails with "table already exists"

**Solution**:
```bash
# Check current migration status
pnpm db:migrate:status

# Reset database (WARNING: destroys all data)
pnpm db:reset

# Rerun migrations
pnpm db:migrate

# Reseed data
pnpm db:seed
```

### Email Not Sending

**Problem**: Emails not appearing in MailHog

**Solution**:
```bash
# Check MailHog container
docker-compose ps mailhog

# Start MailHog
docker-compose up -d mailhog

# Check secretary .env
grep SMTP_HOST secretary/.env
# Should be: mailhog

grep SMTP_PORT secretary/.env
# Should be: 1025

# Verify MailHog UI accessible
open http://localhost:8025
```

### AI Agent Not Joining

**Problem**: AI agent doesn't join room automatically

**Solution**:
```bash
# Check agent service is running
pnpm logs --filter agent

# Verify OPENAI_API_KEY is set
grep OPENAI_API_KEY agent/.env

# Check agent auto-join setting
grep AGENT_AUTO_JOIN agent/.env
# Should be: true

# Check LiveKit webhook is configured
# Verify secretary is receiving webhook events
pnpm logs --filter secretary | grep webhook
```

---

## IDE Setup (VSCode)

### Recommended Extensions

Install these VSCode extensions for optimal development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "orta.vscode-jest",
    "humao.rest-client",
    "rangav.vscode-thunder-client"
  ]
}
```

### Workspace Settings

**.vscode/settings.json**:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Launch Configurations

**.vscode/launch.json**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Manager",
      "cwd": "${workspaceFolder}/manager",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Secretary",
      "cwd": "${workspaceFolder}/secretary",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Agent",
      "cwd": "${workspaceFolder}/agent",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Room (Chrome)",
      "url": "http://localhost:3002",
      "webRoot": "${workspaceFolder}/room/src"
    }
  ],
  "compounds": [
    {
      "name": "Debug All Services",
      "configurations": ["Debug Manager", "Debug Secretary", "Debug Agent", "Debug Room (Chrome)"]
    }
  ]
}
```

---

## Performance Optimization Tips

### Development Mode

1. **Use SWC for faster TypeScript compilation**:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "swc": true
     }
   }
   ```

2. **Enable incremental builds**:
   ```json
   {
     "compilerOptions": {
       "incremental": true
     }
   }
   ```

3. **Use pnpm workspace filtering**:
   ```bash
   # Only build changed packages
   pnpm --filter "./packages/**" build
   ```

### Database Performance

1. **Add indexes for frequent queries** (already done in migrations)

2. **Use connection pooling** (Fastify Postgres plugin handles this)

3. **Monitor slow queries**:
   ```sql
   -- Enable slow query logging
   ALTER SYSTEM SET log_min_duration_statement = 100;
   SELECT pg_reload_conf();
   ```

### Redis Caching

1. **Cache frequently accessed data**:
   - Entity default instructions
   - Department instructions
   - Professional profiles

2. **Use Redis pub/sub for real-time updates**:
   - Room status changes
   - Participant join/leave events

---

## Next Steps

After completing setup:

1. ✅ **Explore the codebase**:
   - Read `data-model.md` for database schema
   - Read `contracts.md` for API documentation
   - Review `research.md` for technical decisions

2. ✅ **Run tests**:
   ```bash
   pnpm test
   ```

3. ✅ **Start implementing features**:
   - Check `tasks.md` for implementation tasks (to be created)
   - Pick a task and create feature branch
   - Follow TDD: Write test → Implement → Verify

4. ✅ **Join development discussions**:
   - Slack: #agent-doctor-live
   - Weekly sync: Mondays 10:00 AM

---

## Additional Resources

- **Documentation**: `/docs` directory
- **Architecture Diagrams**: `/docs/architecture`
- **API Contracts**: `contracts.md`
- **Data Model**: `data-model.md`
- **Technical Research**: `research.md`
- **LiveKit Docs**: https://docs.livekit.io/
- **Fastify Docs**: https://www.fastify.io/docs/
- **pgvector Docs**: https://github.com/pgvector/pgvector

---

## Support

If you encounter issues not covered in this guide:

1. Check existing GitHub issues: https://github.com/conexasaude/agent-doctor-live/issues
2. Create new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Relevant logs
3. Ask in Slack: #agent-doctor-live

---

**Happy Coding! 🚀**
