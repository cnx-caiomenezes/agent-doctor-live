# Research & Technical Decisions

**Feature**: AI-Powered Video/Audio Meeting Platform  
**Branch**: `001-ai-video-platform`  
**Phase**: Phase 0 - Research  
**Date**: 2025-11-08

---

## Overview

This document records technical research findings and decisions made during Phase 0 of the implementation planning process. Each decision is documented with context, alternatives considered, rationale, and implementation notes.

---

## Decision 1: Vector Database Selection

### Question

Which vector database should we use for AI agent knowledge base retrieval with < 50ms latency requirements?

### Context

- AI agents need to retrieve contextual information from uploaded documents (PDFs, guidelines, policies)
- Target latency: < 50ms for semantic search queries
- Must integrate seamlessly with Node.js/TypeScript backend
- Entity administrators will upload documents through Manager API
- Documents need to be embedded and searchable per entity/department

### Options Evaluated

#### Option A: pgvector (PostgreSQL Extension)

**Pros**:
- Native PostgreSQL integration (already using Postgres)
- No additional infrastructure required
- Transactional consistency with main database
- Mature extension with active development
- Supports HNSW and IVFFlat indexes for fast similarity search
- Easy backup/restore with standard PostgreSQL tools
- Cost: $0 (included with PostgreSQL)

**Cons**:
- Slightly higher latency than specialized vector DBs (typically 80-150ms)
- Requires PostgreSQL 11+ with extension enabled
- Limited horizontal scaling compared to cloud solutions
- Query optimization requires PostgreSQL expertise

#### Option B: Pinecone (Managed Cloud)

**Pros**:
- Extremely fast queries (< 50ms p95)
- Fully managed, zero ops overhead
- Excellent Node.js SDK
- Built-in monitoring and analytics
- Auto-scaling

**Cons**:
- Monthly cost: ~$70/month minimum for production
- Vendor lock-in
- Data stored externally (compliance concerns for medical data)
- Network latency to cloud service
- Adds external dependency

#### Option C: Weaviate (Self-Hosted)

**Pros**:
- Open source, self-hosted
- Fast vector search (< 50ms capable)
- Good Node.js client
- GraphQL API for complex queries
- Built-in vectorization modules

**Cons**:
- Additional infrastructure to manage (Docker/K8s)
- Memory-intensive (RAM requirements)
- Operational complexity (backups, monitoring, scaling)
- Learning curve for team

#### Option D: Qdrant (Self-Hosted)

**Pros**:
- Rust-based, extremely fast
- Excellent filtering capabilities
- Good documentation
- Docker-friendly

**Cons**:
- Newer project, smaller community
- Additional infrastructure management
- Less mature Node.js ecosystem

### Decision

**Selected: pgvector (Option A)**

### Rationale

1. **Simplicity**: Leverages existing PostgreSQL infrastructure - no new services to deploy/monitor
2. **Cost**: Zero additional cost (already paying for PostgreSQL)
3. **Data Locality**: Medical/corporate data stays in our controlled database (HIPAA/LGPD compliance)
4. **Latency Trade-off**: While 80-150ms is higher than target, it's acceptable for AI assistance use case (not blocking user actions)
5. **Development Velocity**: Team already knows PostgreSQL - no learning curve
6. **Scaling Strategy**: Can migrate to specialized vector DB later if performance becomes bottleneck

### Performance Optimization Plan

To achieve acceptable latency with pgvector:

1. **Use HNSW indexes** (faster than IVFFlat for our scale)
2. **Embed documents offline** (async job, not real-time during upload)
3. **Cache frequent queries** in Redis (entity default prompts, common guidelines)
4. **Pre-warm context** when meeting starts (fetch relevant vectors before AI agent joins)
5. **Limit vector dimensions** (384 or 768 for balance between accuracy and speed)

### Implementation Notes

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base table
CREATE TABLE knowledge_base (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER NOT NULL REFERENCES entity(id),
  department_id INTEGER REFERENCES department(id),
  document_name VARCHAR(255) NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(768), -- 768 dimensions for all-MiniLM-L12-v2
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- HNSW index for fast similarity search
CREATE INDEX ON knowledge_base USING hnsw (embedding vector_cosine_ops);

-- Indexes for filtering
CREATE INDEX idx_kb_entity ON knowledge_base(entity_id);
CREATE INDEX idx_kb_department ON knowledge_base(department_id);
```

**Embedding Model**: `all-MiniLM-L12-v2` (384 dims) or `all-mpnet-base-v2` (768 dims)  
**Chunking Strategy**: 512 tokens per chunk with 50 token overlap  
**Library**: `@xenova/transformers` (runs embeddings in Node.js)

---

## Decision 2: HTMX + Fastify Patterns

### Question

How should we structure HTMX forms with Fastify SSR and Zod validation for optimal UX and DX?

### Context

- Manager and Secretary services use HTMX for server-side rendered interfaces
- Need form validation with Zod schemas
- Want inline error messages without page reloads
- Progressive enhancement (works without JavaScript)

### Research Findings

#### Pattern 1: HTMX with Partial HTML Responses

**Structure**:

```typescript
// Fastify route with Zod validation
app.post('/entities', {
  schema: {
    body: EntityCreateSchema, // Zod schema
  },
  handler: async (req, reply) => {
    try {
      // Validation passed (Fastify auto-validates with Zod)
      const entity = await entityService.create(req.body);
      
      // Return HTMX-friendly HTML fragment
      return reply.view('partials/entity-row', { entity });
    } catch (error) {
      // Return error HTML fragment
      reply.status(400);
      return reply.view('partials/form-errors', { 
        errors: formatZodErrors(error) 
      });
    }
  }
});
```

**HTMX Markup**:

```html
<form hx-post="/entities" 
      hx-target="#entity-list" 
      hx-swap="afterbegin"
      hx-indicator="#spinner">
  
  <input type="text" name="name" required />
  <div id="name-error" class="error"></div>
  
  <button type="submit">Create Entity</button>
  <span id="spinner" class="htmx-indicator">Saving...</span>
</form>

<div id="entity-list">
  <!-- Entities render here -->
</div>
```

#### Pattern 2: Inline Validation with hx-trigger

**Structure**:

```html
<input type="email" 
       name="email"
       hx-post="/validate/email"
       hx-trigger="blur"
       hx-target="#email-error"
       hx-swap="innerHTML" />
<div id="email-error"></div>
```

**Fastify validation endpoint**:

```typescript
app.post('/validate/email', async (req, reply) => {
  const result = EmailSchema.safeParse(req.body.email);
  if (!result.success) {
    return reply.view('partials/field-error', { 
      message: result.error.errors[0].message 
    });
  }
  return ''; // Empty response = no error
});
```

#### Pattern 3: Optimistic UI with hx-disable-during

```html
<button hx-post="/entities" 
        hx-disable-during="request">
  Create Entity
</button>
```

### Decision

**Selected: Hybrid Approach**

1. **Form submissions**: Pattern 1 (full form validation with partial responses)
2. **Individual field validation**: Pattern 2 (blur-triggered validation for complex fields like email)
3. **Button states**: Pattern 3 (disable during request to prevent double-submit)

### Rationale

- **Pattern 1** provides best UX for form submission (instant feedback, no page reload)
- **Pattern 2** improves UX for fields that need real-time validation (email uniqueness check)
- **Pattern 3** prevents race conditions and provides visual feedback

### Implementation Notes

**Fastify Setup**:

```typescript
import Fastify from 'fastify';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import { zodToJsonSchema } from 'zod-to-json-schema';

const app = Fastify();

// View engine setup
app.register(fastifyView, {
  engine: { ejs },
  root: './views',
  layout: 'layouts/main',
});

// Zod validation plugin
app.setValidatorCompiler(({ schema }) => {
  return (data) => schema.parse(data);
});

// Error handler for Zod validation errors
app.setErrorHandler((error, req, reply) => {
  if (error.name === 'ZodError') {
    reply.status(400);
    return reply.view('partials/form-errors', {
      errors: error.errors,
    });
  }
  // ... other error handling
});
```

**View Structure**:

```
views/
├── layouts/
│   └── main.ejs (full page layout with HTMX script)
├── pages/
│   ├── entities/
│   │   ├── index.ejs (entity list page)
│   │   └── form.ejs (create/edit form)
└── partials/
    ├── entity-row.ejs (single entity HTML)
    └── form-errors.ejs (validation errors)
```

---

## Decision 3: LiveKit Self-Hosting Production Setup

### Question

What is the production-ready Kubernetes deployment pattern for self-hosted LiveKit with high availability and monitoring?

### Context

- Need to self-host LiveKit Server for data sovereignty
- Requires scalability for multiple concurrent meetings
- Must support video/audio with low latency (< 50ms WebRTC)
- Kubernetes deployment with Helm charts

### Research Findings

#### Official LiveKit Helm Chart

**Repository**: https://github.com/livekit/livekit-helm

**Key Components**:

1. **LiveKit Server** (SFU - Selective Forwarding Unit)
   - WebRTC media routing
   - Room management
   - Participant signaling

2. **Redis** (for distributed state)
   - Room state persistence
   - Participant tracking
   - Pub/sub for multi-instance coordination

3. **Ingress Controller** (TURN/STUN for NAT traversal)
   - UDP/TCP ports for media
   - WebSocket for signaling

#### Deployment Architecture

```yaml
# values.yaml (production config)
livekit:
  replicaCount: 3 # HA with 3 instances
  
  config:
    port: 7880 # WebRTC signaling
    rtc:
      port_range_start: 50000
      port_range_end: 60000
      use_external_ip: true
    
    redis:
      address: redis-master:6379
      password: ${REDIS_PASSWORD}
    
    keys:
      api_key: ${LIVEKIT_API_KEY}
      api_secret: ${LIVEKIT_API_SECRET}
  
  service:
    type: LoadBalancer
    annotations:
      service.beta.kubernetes.io/aws-load-balancer-type: nlb
  
  resources:
    requests:
      cpu: 2000m
      memory: 4Gi
    limits:
      cpu: 4000m
      memory: 8Gi
  
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70

redis:
  enabled: true
  architecture: standalone
  auth:
    password: ${REDIS_PASSWORD}
  master:
    persistence:
      enabled: true
      size: 10Gi
```

#### Ingress Configuration

```yaml
# Network policies for WebRTC
apiVersion: v1
kind: Service
metadata:
  name: livekit-server
spec:
  type: LoadBalancer
  ports:
    - name: http
      port: 80
      targetPort: 7880
    - name: rtc-tcp
      port: 443
      targetPort: 7881
    - name: rtc-udp-start
      protocol: UDP
      port: 50000
      targetPort: 50000
    # ... ports 50001-60000 for UDP media
```

#### Monitoring Setup

**Prometheus Metrics**:

```yaml
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: livekit-server
spec:
  selector:
    matchLabels:
      app: livekit-server
  endpoints:
    - port: metrics
      interval: 30s
```

**Key Metrics**:
- `livekit_room_total` (active rooms)
- `livekit_participant_total` (active participants)
- `livekit_track_publish_total` (published tracks)
- `livekit_packet_total` (WebRTC packets)

### Decision

**Selected: Official LiveKit Helm Chart with Custom Values**

### Rationale

1. **Official Support**: Maintained by LiveKit team, stays updated with releases
2. **Production-Ready**: Includes HA setup, autoscaling, and monitoring out-of-box
3. **Battle-Tested**: Used by LiveKit Cloud infrastructure
4. **Customizable**: Values.yaml allows full configuration control

### Implementation Notes

**Deployment Steps**:

```bash
# 1. Add LiveKit Helm repo
helm repo add livekit https://helm.livekit.io
helm repo update

# 2. Create namespace
kubectl create namespace livekit

# 3. Create secrets
kubectl create secret generic livekit-keys \
  --from-literal=api-key=${LIVEKIT_API_KEY} \
  --from-literal=api-secret=${LIVEKIT_API_SECRET} \
  -n livekit

# 4. Install chart
helm install livekit livekit/livekit-server \
  -f values.yaml \
  -n livekit

# 5. Verify deployment
kubectl get pods -n livekit
kubectl logs -f deployment/livekit-server -n livekit
```

**DNS Configuration**:

```
livekit.conexa.com.br -> LoadBalancer External IP
ws://livekit.conexa.com.br:80 (signaling)
wss://livekit.conexa.com.br:443 (signaling TLS)
```

**Resource Planning**:

- **CPU**: ~0.5 CPU per 10 participants (video enabled)
- **Memory**: ~50MB per active participant
- **Bandwidth**: ~2 Mbps per participant (720p video)

**Example**: 100 concurrent participants = 5 CPU, 5GB RAM, 200 Mbps bandwidth

---

## Decision 4: Agent Context Management

### Question

How should we efficiently pass entity instructions + department instructions + knowledge base context to AI agents in real-time?

### Context

- AI agents need combined context from multiple sources:
  1. Entity default instructions (stored in PostgreSQL)
  2. Department-specific instructions (stored in PostgreSQL)
  3. Custom meeting prompt (from room creation)
  4. Relevant knowledge base chunks (from pgvector)
- Context must be available when agent joins room (< 2s latency)
- Context size limit: ~8K tokens for LLM context window

### Research Findings

#### LiveKit Agents SDK Context Injection

**Agent Initialization**:

```python
# LiveKit Agents SDK (Python)
from livekit.agents import JobContext, WorkerOptions

async def entrypoint(ctx: JobContext):
    # Context is available from room metadata
    room_metadata = ctx.room.metadata
    context_data = json.loads(room_metadata)
    
    # context_data contains:
    # - entity_id
    # - department_id
    # - custom_prompt
    # - participant_ids
```

**Room Metadata Injection** (Secretary Service):

```typescript
// When creating LiveKit room
const roomOptions: CreateRoomRequest = {
  name: roomId,
  emptyTimeout: 300, // 5 minutes
  maxParticipants: entity.maxParticipants,
  metadata: JSON.stringify({
    entity_id: room.entityId,
    department_id: room.departmentId,
    custom_prompt: room.customPrompt,
    scheduled_by: userId,
  }),
};

await livekitClient.createRoom(roomOptions);
```

#### Context Assembly Strategy

**Option A: Pre-Fetch on Room Creation**

```typescript
// Secretary: When room is scheduled
const agentContext = await assembleAgentContext({
  entityId: room.entityId,
  departmentId: room.departmentId,
  customPrompt: room.customPrompt,
});

// Store in Redis with room ID as key
await redis.setex(
  `agent-context:${room.id}`,
  3600, // 1 hour TTL
  JSON.stringify(agentContext)
);
```

**Option B: Lazy Load on Agent Join**

```typescript
// Agent: When joining room
async function loadContext(roomId: string) {
  // Try Redis cache first
  const cached = await redis.get(`agent-context:${roomId}`);
  if (cached) return JSON.parse(cached);
  
  // Fallback: Query database
  const context = await fetchContextFromDB(roomId);
  await redis.setex(`agent-context:${roomId}`, 3600, JSON.stringify(context));
  return context;
}
```

#### Knowledge Base Retrieval

```typescript
async function fetchRelevantKnowledge(
  entityId: number,
  departmentId: number | null,
  query: string // from meeting topic/custom prompt
): Promise<string[]> {
  
  // Generate embedding for query
  const queryEmbedding = await embedText(query);
  
  // Vector similarity search with filtering
  const result = await db.query(`
    SELECT chunk_text, 1 - (embedding <=> $1::vector) AS similarity
    FROM knowledge_base
    WHERE entity_id = $2
      AND (department_id = $3 OR department_id IS NULL)
      AND 1 - (embedding <=> $1::vector) > 0.7
    ORDER BY similarity DESC
    LIMIT 5
  `, [queryEmbedding, entityId, departmentId]);
  
  return result.rows.map(r => r.chunk_text);
}
```

### Decision

**Selected: Hybrid Approach (Option A + Option B)**

1. **Pre-fetch on scheduling** (Option A) for common context (entity/department instructions)
2. **Lazy load knowledge base** (Option B) when agent joins (semantic search on meeting topic)
3. **Redis caching** for both strategies

### Rationale

1. **Performance**: Pre-fetching reduces latency when agent joins (no DB query wait)
2. **Freshness**: Lazy loading knowledge base ensures latest documents are used
3. **Scalability**: Redis cache prevents repeated DB queries for same rooms
4. **Context Window Management**: Fetch only relevant KB chunks (top 5 by similarity)

### Implementation Notes

**Context Assembly Pipeline**:

```typescript
interface AgentContext {
  systemPrompt: string;        // Combined instructions
  knowledgeBase: string[];     // Relevant document chunks
  constraints: {
    maxTokens: number;
    temperature: number;
  };
  metadata: {
    entityName: string;
    departmentName: string | null;
    meetingTopic: string;
  };
}

async function assembleAgentContext(params: {
  entityId: number;
  departmentId: number | null;
  customPrompt: string;
}): Promise<AgentContext> {
  
  // 1. Fetch entity default instructions
  const entity = await entityRepo.findById(params.entityId);
  
  // 2. Fetch department instructions (if applicable)
  const department = params.departmentId
    ? await departmentRepo.findById(params.departmentId)
    : null;
  
  // 3. Combine prompts with hierarchy
  const systemPrompt = [
    entity.defaultInstructions,
    department?.instructions,
    params.customPrompt,
  ].filter(Boolean).join('\n\n---\n\n');
  
  // 4. Fetch relevant knowledge base chunks
  const knowledgeBase = await fetchRelevantKnowledge(
    params.entityId,
    params.departmentId,
    params.customPrompt
  );
  
  return {
    systemPrompt,
    knowledgeBase,
    constraints: {
      maxTokens: 8000,
      temperature: 0.7,
    },
    metadata: {
      entityName: entity.name,
      departmentName: department?.name || null,
      meetingTopic: params.customPrompt,
    },
  };
}
```

**Token Budget Management**:

```typescript
// Ensure context fits in 8K token limit
function truncateContext(context: AgentContext): AgentContext {
  const maxTokens = 8000;
  let currentTokens = estimateTokens(context.systemPrompt);
  
  // Reserve tokens for knowledge base
  const kbTokenBudget = maxTokens - currentTokens - 1000; // 1K buffer
  
  if (kbTokenBudget > 0) {
    const truncatedKB = [];
    for (const chunk of context.knowledgeBase) {
      const chunkTokens = estimateTokens(chunk);
      if (currentTokens + chunkTokens <= maxTokens - 1000) {
        truncatedKB.push(chunk);
        currentTokens += chunkTokens;
      } else {
        break;
      }
    }
    context.knowledgeBase = truncatedKB;
  } else {
    // Not enough space, drop knowledge base
    context.knowledgeBase = [];
  }
  
  return context;
}
```

---

## Decision 5: Magic Link Security Implementation

### Question

How should we securely generate, store, and validate magic links for participant authentication with Fastify?

### Context

- Participants receive magic links via email/WhatsApp
- Links must be single-use or time-limited
- Links should include 8-digit password sent separately
- Need to prevent brute force attacks
- Must integrate with Fastify authentication

### Research Findings

#### Option A: JWT-Based Magic Links

```typescript
// Generate magic link
const token = jwt.sign(
  {
    roomId: room.id,
    participantId: participant.id,
    type: 'magic-link',
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

const magicLink = `https://room.conexa.com.br/join/${token}`;
```

**Pros**:
- Self-contained (no database lookup needed)
- Automatic expiration via JWT exp claim
- Stateless (scales horizontally)

**Cons**:
- Cannot revoke before expiration
- Larger tokens in URL (ugly, long URLs)
- Risk if secret is compromised (all tokens valid)

#### Option B: UUID + Redis

```typescript
// Generate magic link
const token = crypto.randomUUID();
const password = generateRandomDigits(8);

await redis.setex(
  `magic-link:${token}`,
  86400, // 24 hours TTL
  JSON.stringify({
    roomId: room.id,
    participantId: participant.id,
    password: await bcrypt.hash(password, 10),
    used: false,
  })
);

const magicLink = `https://room.conexa.com.br/join/${token}`;
```

**Pros**:
- Short, clean URLs
- Can revoke by deleting Redis key
- Password stored separately (more secure)
- Can track usage (single-use enforcement)

**Cons**:
- Requires Redis lookup (latency ~1-5ms)
- State management (Redis must be available)

### Decision

**Selected: Option B (UUID + Redis)**

### Rationale

1. **Security**: Can revoke links if needed (e.g., participant reports phishing)
2. **Single-Use**: Enforces one-time usage by tracking `used` flag
3. **Short URLs**: Better UX for WhatsApp/email links
4. **Rate Limiting**: Can track validation attempts per token (prevent brute force)

### Implementation Notes

**Magic Link Generation**:

```typescript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

interface MagicLinkData {
  roomId: string;
  participantId: string;
  password: string; // 8 digits
  used: boolean;
  attempts: number;
  createdAt: string;
}

async function generateMagicLink(
  roomId: string,
  participantId: string
): Promise<{ link: string; password: string }> {
  
  const token = crypto.randomUUID();
  const password = crypto.randomInt(10000000, 99999999).toString();
  
  const data: MagicLinkData = {
    roomId,
    participantId,
    password: await bcrypt.hash(password, 10),
    used: false,
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  
  await redis.setex(
    `magic-link:${token}`,
    86400, // 24 hours
    JSON.stringify(data)
  );
  
  const link = `${process.env.ROOM_BASE_URL}/join/${token}`;
  
  return { link, password };
}
```

**Magic Link Validation**:

```typescript
// Fastify route
app.post('/join/:token', async (req, reply) => {
  const { token } = req.params;
  const { password } = req.body;
  
  // 1. Fetch from Redis
  const dataStr = await redis.get(`magic-link:${token}`);
  if (!dataStr) {
    return reply.code(404).send({ error: 'Invalid or expired link' });
  }
  
  const data: MagicLinkData = JSON.parse(dataStr);
  
  // 2. Check if already used
  if (data.used) {
    return reply.code(403).send({ error: 'Link already used' });
  }
  
  // 3. Check attempts (rate limiting)
  if (data.attempts >= 3) {
    await redis.del(`magic-link:${token}`); // Invalidate after 3 failed attempts
    return reply.code(429).send({ error: 'Too many attempts' });
  }
  
  // 4. Validate password
  const isValid = await bcrypt.compare(password, data.password);
  if (!isValid) {
    // Increment attempts
    data.attempts++;
    await redis.setex(`magic-link:${token}`, 86400, JSON.stringify(data));
    return reply.code(401).send({ error: 'Invalid password' });
  }
  
  // 5. Mark as used
  data.used = true;
  await redis.setex(`magic-link:${token}`, 86400, JSON.stringify(data));
  
  // 6. Generate LiveKit token
  const livekitToken = await generateLiveKitToken(data.roomId, data.participantId);
  
  return reply.send({
    success: true,
    livekitToken,
    roomId: data.roomId,
  });
});
```

**Security Features**:

1. **Rate Limiting**: Max 3 password attempts per link
2. **Single-Use**: Link invalidated after successful use
3. **Expiration**: 24-hour TTL via Redis
4. **Password Hashing**: bcrypt (cost factor 10)
5. **HTTPS Only**: Enforced in production (Fastify config)

**Notification Templates**:

```typescript
// Email template
const emailHTML = `
  <h2>You're invited to join a meeting</h2>
  <p>Meeting: ${room.title}</p>
  <p>Time: ${room.scheduledAt}</p>
  <p>
    <a href="${magicLink}">Click here to join</a>
  </p>
  <p><strong>Password (enter when joining): ${password}</strong></p>
  <p><em>This link expires in 24 hours</em></p>
`;

// WhatsApp template
const whatsappMessage = `
🎥 *Meeting Invitation*

${room.title}
📅 ${room.scheduledAt}

🔗 Join: ${magicLink}
🔐 Password: ${password}

_Link expires in 24 hours_
`;
```

---

## Decision 6: Participant Capacity Enforcement

### Question

Should we enforce participant capacity limits at the LiveKit server level or application level?

### Context

- Entities have configured max participant limits (e.g., 50, 100, 500)
- Need to prevent room from exceeding capacity
- LiveKit server has room configuration options
- Application has pre-join validation capability

### Research Findings

#### Option A: LiveKit Server Enforcement

```typescript
// Set max participants when creating room
const roomOptions: CreateRoomRequest = {
  name: roomId,
  maxParticipants: entity.maxParticipants, // LiveKit enforces
  emptyTimeout: 300,
};

await livekitClient.createRoom(roomOptions);
```

**Pros**:
- Hard limit enforced by LiveKit (cannot be bypassed)
- No application code needed for enforcement
- Works even if application is down

**Cons**:
- Generic error message to participant ("Room full")
- No queueing or waitlist capability
- Cannot provide context-specific messaging

#### Option B: Application-Level Pre-Flight Check

```typescript
// Before generating LiveKit token
async function validateRoomCapacity(roomId: string): Promise<void> {
  // Get room config
  const room = await roomRepo.findById(roomId);
  const entity = await entityRepo.findById(room.entityId);
  
  // Get current participant count from LiveKit
  const livekitRoom = await livekitClient.getRoom(roomId);
  
  if (livekitRoom.numParticipants >= entity.maxParticipants) {
    throw new RoomCapacityError(
      `Room has reached maximum capacity of ${entity.maxParticipants} participants`
    );
  }
}
```

**Pros**:
- Friendly error messages with context
- Can implement waitlist/queue
- Can notify organizer when capacity reached
- Analytics tracking (capacity events)

**Cons**:
- Race condition risk (multiple joins at same time)
- Requires application availability
- Additional API call to LiveKit

#### Option C: Hybrid (Both Levels)

Combine both approaches:
1. Application pre-flight check for UX and messaging
2. LiveKit hard limit as safety net

### Decision

**Selected: Option C (Hybrid Enforcement)**

### Rationale

1. **Defense in Depth**: Two layers of protection prevent capacity overrun
2. **Better UX**: Application check provides friendly error messages
3. **Safety Net**: LiveKit enforcement catches race conditions
4. **Analytics**: Application tracking provides capacity utilization data
5. **Extensibility**: Application layer enables waitlist feature (future)

### Implementation Notes

**Capacity Validation Flow**:

```typescript
// Secretary Service - Before token generation
async function validateAndJoinRoom(
  roomId: string,
  participantId: string
): Promise<string> {
  
  // 1. Application-level check
  const room = await roomRepo.findById(roomId);
  const entity = await entityRepo.findById(room.entityId);
  const livekitRoom = await livekitClient.getRoom(room.livekitRoomId);
  
  if (livekitRoom.numParticipants >= entity.maxParticipants) {
    // Log capacity event
    await logRoomEvent(roomId, 'CAPACITY_REACHED', {
      currentParticipants: livekitRoom.numParticipants,
      maxParticipants: entity.maxParticipants,
      deniedParticipantId: participantId,
    });
    
    throw new RoomCapacityError({
      message: 'This meeting has reached its maximum capacity',
      maxParticipants: entity.maxParticipants,
      currentParticipants: livekitRoom.numParticipants,
      contactOrganizer: true,
    });
  }
  
  // 2. Generate LiveKit token (LiveKit enforces hard limit)
  const token = await generateLiveKitToken(roomId, participantId);
  
  // 3. Log join event
  await logRoomEvent(roomId, 'PARTICIPANT_JOINED', {
    participantId,
    currentParticipants: livekitRoom.numParticipants + 1,
  });
  
  return token;
}
```

**LiveKit Room Configuration** (always set hard limit):

```typescript
const roomOptions: CreateRoomRequest = {
  name: roomId,
  maxParticipants: entity.maxParticipants, // Hard limit
  emptyTimeout: 300,
  metadata: JSON.stringify({
    entity_id: room.entityId,
    max_capacity: entity.maxParticipants,
  }),
};
```

**Error Response Format**:

```typescript
interface RoomCapacityErrorResponse {
  error: 'ROOM_FULL';
  message: string;
  details: {
    currentParticipants: number;
    maxParticipants: number;
    roomTitle: string;
    organizerContact?: string; // For upgrade requests
  };
  suggestions: string[]; // e.g., "Contact organizer to increase capacity"
}
```

**Monitoring Dashboard**:

Track capacity events for analytics:
- Rooms that hit capacity (frequency)
- Time of day capacity is reached
- Average utilization percentage
- Upgrade opportunities (rooms consistently hitting limit)

---

## Decision 7: Recording Storage and Retention

### Question

Where should we store meeting recordings and how do we automate retention policy enforcement?

### Context

- Recordings are generated by LiveKit Egress
- Entity administrators configure retention policies (30, 90, or 365 days)
- Recordings contain sensitive data (medical consultations, corporate meetings)
- Must support HIPAA/LGPD compliance requirements
- Recordings cannot be manually deleted (audit integrity)

### Research Findings

#### Storage Options

**Option A: AWS S3**

**Pros**:
- Highly durable (99.999999999%)
- S3 Lifecycle policies for automatic deletion
- Versioning for compliance
- Encryption at rest (KMS)
- Cost-effective for cold storage (Glacier)

**Cons**:
- External dependency (AWS)
- Data transfer costs
- Network latency for uploads

**Cost**: ~$0.023/GB/month (Standard), ~$0.004/GB/month (Glacier)

**Option B: Local Storage (Persistent Volume)**

**Pros**:
- Data sovereignty (stays on-premise)
- No external costs
- Fast access (local disk)

**Cons**:
- Backup complexity (need separate strategy)
- Scaling challenges (disk space)
- No automatic lifecycle management
- Higher operational burden

**Option C: MinIO (Self-Hosted S3-Compatible)**

**Pros**:
- S3-compatible API (easy migration)
- Self-hosted (data sovereignty)
- Supports S3 Lifecycle policies
- Good performance

**Cons**:
- Infrastructure to manage (Kubernetes deployment)
- Backup/durability handled by us
- Operational complexity

#### Retention Automation

**Approach 1: S3 Lifecycle Policies**

```typescript
// Configure S3 bucket with lifecycle rules
const lifecycleRule = {
  Rules: [
    {
      Id: 'DeleteAfter30Days',
      Filter: {
        Tag: {
          Key: 'retention',
          Value: '30',
        },
      },
      Status: 'Enabled',
      Expiration: {
        Days: 30,
      },
    },
    // Similar rules for 90 and 365 days
  ],
};
```

**Approach 2: Cron Job + Database Tracking**

```typescript
// Daily cron job
async function enforceRetentionPolicies() {
  const recordings = await db.query(`
    SELECT r.id, r.s3_key, r.created_at, e.recording_retention_days
    FROM recordings r
    JOIN rooms rm ON r.room_id = rm.id
    JOIN entities e ON rm.entity_id = e.id
    WHERE r.created_at < NOW() - INTERVAL e.recording_retention_days DAY
      AND r.deleted_at IS NULL
  `);
  
  for (const recording of recordings.rows) {
    // Delete from S3
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: recording.s3_key,
    });
    
    // Mark as deleted in DB (soft delete for audit)
    await db.query(
      'UPDATE recordings SET deleted_at = NOW() WHERE id = $1',
      [recording.id]
    );
    
    // Log retention event
    await logEvent('RECORDING_PURGED', {
      recordingId: recording.id,
      retentionDays: recording.recording_retention_days,
      purgedAt: new Date(),
    });
  }
}
```

### Decision

**Selected: AWS S3 + S3 Lifecycle Policies + Database Audit Trail**

### Rationale

1. **Durability**: S3 provides enterprise-grade durability (11 nines)
2. **Compliance**: Built-in encryption, versioning, and access logging
3. **Automation**: S3 Lifecycle policies handle deletion automatically
4. **Scalability**: No storage limits, pay-as-you-grow
5. **Backup**: S3 replication for disaster recovery (optional)
6. **Audit Trail**: Database tracks all recording lifecycle events

### Implementation Notes

**LiveKit Egress Configuration**:

```typescript
// Start recording with S3 output
import { EgressClient, EncodedFileType } from 'livekit-server-sdk';

const egressClient = new EgressClient(
  process.env.LIVEKIT_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

async function startRecording(roomId: string, entityId: number) {
  // Get entity retention policy
  const entity = await entityRepo.findById(entityId);
  
  const egressRequest = {
    roomName: roomId,
    file: {
      fileType: EncodedFileType.MP4,
      filepath: `recordings/${roomId}/${Date.now()}.mp4`,
    },
    s3: {
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.S3_BUCKET,
      tagging: `retention=${entity.recordingRetentionDays}`, // For lifecycle rules
    },
  };
  
  const egress = await egressClient.startRoomCompositeEgress(egressRequest);
  
  // Save recording metadata in database
  await db.query(`
    INSERT INTO recordings (id, room_id, egress_id, s3_key, retention_days, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, [
    egress.egressId,
    roomId,
    egress.egressId,
    egressRequest.file.filepath,
    entity.recordingRetentionDays,
  ]);
  
  return egress;
}
```

**S3 Bucket Configuration**:

```typescript
// Terraform/CloudFormation for S3 bucket
resource "aws_s3_bucket_lifecycle_configuration" "recordings" {
  bucket = aws_s3_bucket.recordings.id

  rule {
    id     = "delete-30-day-retention"
    status = "Enabled"

    filter {
      tag {
        key   = "retention"
        value = "30"
      }
    }

    expiration {
      days = 30
    }
  }

  rule {
    id     = "delete-90-day-retention"
    status = "Enabled"

    filter {
      tag {
        key   = "retention"
        value = "90"
      }
    }

    expiration {
      days = 90
    }
  }

  rule {
    id     = "delete-365-day-retention"
    status = "Enabled"

    filter {
      tag {
        key   = "retention"
        value = "365"
      }
    }

    expiration {
      days = 365
    }
  }
}
```

**Database Schema**:

```sql
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id VARCHAR(255) NOT NULL REFERENCES rooms(id),
  egress_id VARCHAR(255) NOT NULL UNIQUE,
  s3_key TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP, -- Soft delete for audit
  CONSTRAINT fk_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE INDEX idx_recordings_room ON recordings(room_id);
CREATE INDEX idx_recordings_deleted ON recordings(deleted_at) WHERE deleted_at IS NULL;
```

**Audit Logging**:

```typescript
// Log all recording lifecycle events
enum RecordingEventType {
  STARTED = 'RECORDING_STARTED',
  COMPLETED = 'RECORDING_COMPLETED',
  ACCESSED = 'RECORDING_ACCESSED',
  PURGED = 'RECORDING_PURGED',
}

async function logRecordingEvent(
  recordingId: string,
  eventType: RecordingEventType,
  metadata: Record<string, any>
) {
  await db.query(`
    INSERT INTO recording_audit_log (recording_id, event_type, metadata, created_at)
    VALUES ($1, $2, $3, NOW())
  `, [recordingId, eventType, JSON.stringify(metadata)]);
}
```

**Compliance Features**:

1. **Encryption**: S3 server-side encryption (SSE-S3 or SSE-KMS)
2. **Access Control**: IAM policies + presigned URLs for temporary access
3. **Audit Trail**: All access logged in `recording_audit_log`
4. **Immutability**: Cannot manually delete (enforced by application)
5. **Retention Enforcement**: Automatic via S3 Lifecycle

---

## Decision 8: Redis Usage Patterns

### Question

How should we structure Redis usage for session management, caching, and pub/sub across multiple services?

### Context

- Multiple services need shared state (Manager, Secretary, Agent)
- Need session management for magic links, auth tokens
- Caching for entity config, room state, agent context
- Pub/sub for real-time updates (room events, agent notifications)

### Research Findings

#### Key Patterns for Each Use Case

**1. Session Management**

```typescript
// Magic links (TTL-based)
await redis.setex('magic-link:${token}', 86400, JSON.stringify(data));

// Auth sessions (hash for structured data)
await redis.hset('session:${sessionId}', {
  userId: user.id,
  entityId: user.entityId,
  role: user.role,
  createdAt: Date.now(),
});
await redis.expire('session:${sessionId}', 3600);
```

**2. Caching Strategy**

```typescript
// Entity config (JSON with TTL)
const cacheKey = `entity:${entityId}:config`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const entity = await entityRepo.findById(entityId);
await redis.setex(cacheKey, 3600, JSON.stringify(entity)); // 1 hour cache
return entity;

// Agent context (pre-warmed)
await redis.setex(
  `agent-context:${roomId}`,
  3600,
  JSON.stringify(agentContext)
);
```

**3. Pub/Sub for Real-Time Events**

```typescript
// Publisher (Secretary)
await redis.publish('room-events', JSON.stringify({
  type: 'PARTICIPANT_JOINED',
  roomId: room.id,
  participantId: participant.id,
  timestamp: Date.now(),
}));

// Subscriber (Manager dashboard)
const subscriber = redis.duplicate();
await subscriber.subscribe('room-events');
subscriber.on('message', (channel, message) => {
  const event = JSON.parse(message);
  // Update dashboard real-time
});
```

**4. Rate Limiting**

```typescript
// Token bucket for API rate limiting
async function checkRateLimit(userId: string, limit: number, window: number) {
  const key = `rate-limit:${userId}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  return current <= limit;
}
```

#### Connection Patterns

**Option A: Single Shared Connection**

```typescript
// Singleton Redis client
export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true,
});
```

**Option B: Connection Pool (ioredis)**

```typescript
// Cluster mode for HA
export const redis = new Redis.Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 },
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD,
  },
});
```

#### Fastify Integration

```typescript
import fastifyRedis from '@fastify/redis';

app.register(fastifyRedis, {
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
});

// Usage in routes
app.get('/cached-data', async (req, reply) => {
  const cached = await app.redis.get('key');
  // ...
});
```

### Decision

**Selected: Fastify Redis Plugin + Namespace Prefixes + Pub/Sub**

### Rationale

1. **Integration**: `@fastify/redis` provides native Fastify integration
2. **Connection Management**: Plugin handles connection lifecycle
3. **Namespaces**: Prefix keys by service/feature for organization
4. **Pub/Sub**: Separate subscriber connections for real-time events
5. **Scalability**: Can switch to cluster mode without code changes

### Implementation Notes

**Namespace Structure**:

```
magic-link:${token}           # Magic link data (Secretary)
session:${sessionId}          # Auth sessions (Manager, Secretary)
entity:${entityId}:config     # Entity config cache (Manager)
agent-context:${roomId}       # Agent context (Secretary)
room:${roomId}:state          # Room state (Secretary)
rate-limit:${userId}          # API rate limiting (all services)
```

**Fastify Setup**:

```typescript
// Manager Service
import fastifyRedis from '@fastify/redis';

app.register(fastifyRedis, {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  family: 4, // IPv4
});

// Health check
app.get('/health', async (req, reply) => {
  try {
    await app.redis.ping();
    return { status: 'ok', redis: 'connected' };
  } catch (error) {
    reply.code(503);
    return { status: 'error', redis: 'disconnected' };
  }
});
```

**Caching Helper Functions**:

```typescript
// Generic cache wrapper
async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await app.redis.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }
  
  // Cache miss - fetch from source
  const data = await fetchFn();
  await app.redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage
const entity = await withCache(
  `entity:${entityId}:config`,
  3600,
  () => entityRepo.findById(entityId)
);
```

**Pub/Sub Setup**:

```typescript
// Separate subscriber connection
import Redis from 'ioredis';

const subscriber = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_PASSWORD,
});

// Subscribe to channels
await subscriber.subscribe('room-events', 'agent-events');

subscriber.on('message', (channel, message) => {
  const event = JSON.parse(message);
  
  switch (channel) {
    case 'room-events':
      handleRoomEvent(event);
      break;
    case 'agent-events':
      handleAgentEvent(event);
      break;
  }
});

// Publisher (use main app.redis)
export async function publishRoomEvent(event: RoomEvent) {
  await app.redis.publish('room-events', JSON.stringify(event));
}
```

**Cache Invalidation Strategy**:

```typescript
// Invalidate on entity update
async function updateEntity(entityId: number, data: Partial<Entity>) {
  await entityRepo.update(entityId, data);
  
  // Invalidate cache
  await app.redis.del(`entity:${entityId}:config`);
  
  // Publish update event
  await app.redis.publish('entity-events', JSON.stringify({
    type: 'ENTITY_UPDATED',
    entityId,
    updatedFields: Object.keys(data),
  }));
}
```

**Redis Monitoring**:

```typescript
// Metrics collection
app.redis.on('connect', () => {
  logger.info('Redis connected');
});

app.redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

// Periodic stats
setInterval(async () => {
  const info = await app.redis.info('stats');
  logger.debug('Redis stats:', parseRedisInfo(info));
}, 60000); // Every minute
```

---

## Summary

All 8 research questions have been resolved with technical decisions documented. Key takeaways:

1. **pgvector** for knowledge base (simple, cost-effective)
2. **HTMX hybrid patterns** for forms (UX + progressive enhancement)
3. **LiveKit official Helm chart** for production deployment
4. **Hybrid context management** (pre-fetch + lazy load)
5. **UUID + Redis magic links** (secure, revocable)
6. **Hybrid capacity enforcement** (application + LiveKit)
7. **S3 + Lifecycle policies** for recordings (automated compliance)
8. **Fastify Redis plugin** with namespaces and pub/sub

**Next Phase**: Generate data-model.md and API contracts based on these decisions.
