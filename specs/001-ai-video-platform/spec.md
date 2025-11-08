# Feature Specification: AI-Powered Video/Audio Meeting Platform

**Feature Branch**: `1-ai-video-platform`  
**Created**: 2025-11-06  
**Status**: Draft  
**Input**: User description: "Build a modern and scalable video/audio room calls platform with AI agent assistance for corporate meetings, webinars, online classes, and social gatherings"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entity Administrator Configures Organization (Priority: P1)

**Working directory**: `/agent-doctor-live/manager`

An entity administrator (representing a clinic, company, or organization) needs to configure their organization's settings, including default AI agent instructions that will apply to all meetings within their organization.

**Why this priority**: This is foundational - without entity configuration, the platform cannot function. It establishes the organizational context for all subsequent features.

**Independent Test**: Administrator can log into the management interface, create an entity profile, set default AI prompts, and verify these settings are saved. This delivers immediate value by establishing organizational control.

**Acceptance Scenarios**:

1. **Given** an administrator has valid credentials, **When** they log into the manager interface, **Then** they can access the entity configuration dashboard
2. **Given** an administrator is on the entity configuration page, **When** they set a default system prompt for AI agents (e.g., "Provide medical consultation guidelines"), **Then** the prompt is saved and applies to all new meetings
3. **Given** an administrator is configuring entity settings, **When** they set participant capacity limits (e.g., max 50 participants), **Then** these limits are enforced during meeting scheduling
4. **Given** an entity has been configured, **When** the administrator views entity settings, **Then** they see the organization name, type (medical clinic, design agency, etc.), and default AI instructions
5. **Given** an administrator wants to customize behavior, **When** they upload policy documents (PDFs) to the vector database, **Then** these documents inform the AI agent's context in meetings
6. **Given** an administrator has made changes to entity settings, **When** they save the configuration, **Then** the system confirms successful update and persists changes
7. **Given** an entity is configured, **When** a user schedules a meeting under that entity, **Then** the default AI prompt is automatically applied unless overridden
8. **Given** an administrator sets recording retention policy (30 days, 90 days, or 1 year), **When** they save the setting, **Then** all recordings for that entity adhere to the specified retention duration
9. **Given** an administrator logged in, **When** access the profile configuration, **Then** it should be possible to change the password and update email address

---

### User Story 2 - User Schedules a Meeting Room (Priority: P1)

**Working directory**: `/agent-doctor-live/secretary`

A user needs to schedule a video/audio meeting room for a specific purpose (corporate meeting, webinar, online class, or social gathering), with customized AI agent instructions based on the meeting context.

**Why this priority**: This is the core user action that enables all meeting functionality. Without scheduling, no meetings can occur.

**Independent Test**: User can access the scheduling interface, create a meeting with date/time/topic, customize the AI prompt for that specific meeting, and receive a confirmation with access details. This delivers a complete scheduling workflow.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** they access the secretary API scheduling interface, **Then** they can create a new meeting with title, date/time, and participant capacity
2. **Given** a user is creating a meeting, **When** they specify a custom AI prompt (e.g., "Focus on design review feedback" or "Medical consultation for cardiology"), **Then** the system combines this with the entity's default prompt
3. **Given** a user is creating a meeting, **When** providing the meeting participants, **Then** it should allow adding by email or phone number.
4. **Given** meeting created, **When** finished, **Then** it should send a confirmation email to the meeting organizer with meeting details in the email (if provided email) or whatsapp (if provided phone number).
5. **Given** a meeting has been scheduled, **When** the system generates access credentials, **Then** the user receives magic link for direct room entry
6. **Given** a meeting exists, **When** the system sent the magic link for participants via email/whatsapp **Then** participants can join providing a password (8 numbers) sent in the email/whatsapp.
7. **Given** an entity has participant capacity limits configured, **When** a user schedules a meeting, **Then** the system enforces the maximum participant count for that entity
8. **Given** a meeting is scheduled, **When** the user views their upcoming meetings, **Then** the scheduled meeting appears with details including title, date/time, and access link
9. **Given** a user has scheduled a meeting, **When** they need to cancel it, **Then** they can do so via the scheduling interface and all participants are notified of the cancellation
10. **Given** a user is scheduling a meeting, **When** they attempt to exceed the entity's participant capacity, **Then** the system prevents scheduling and displays an appropriate error message

---

### User Story 3 - Participant Joins and Interacts in Meeting Room (Priority: P1)

**Working directory**: `/agent-doctor-live/room`

A participant needs to join a scheduled meeting room using their access link, interact with other participants through video/audio/chat, and share their screen when needed.

**Why this priority**: This is the core meeting experience that delivers the primary value proposition of the platform.

**Independent Test**: Participant can click a magic link, join in a staging area to check your audio/video settings, provide the password passed in the scheduled event email, see other participants, send chat messages, and share their screen. This demonstrates the complete meeting interaction capability.

**Acceptance Scenarios**:

1. **Given** a participant has a magic link, **When** they click it, **Then** they join in the staging area to check your audio/video settings
2. **Given** a participant in the staging area **When** they clicked to join room **Then** it should show a small input field asking the password sent in the event scheduled email
3. **Given** a participant is in the room, **When** they enable their camera and microphone, **Then** other participants can see and hear them
4. **Given** multiple participants are in the room, **When** they communicate, **Then** the system handles concurrent audio/video streams without degradation
5. **Given** a participant wants to present, **When** they initiate screen sharing, **Then** their screen is visible to all participants
6. **Given** a participant wants to communicate via text, **When** they send a chat message, **Then** all participants see the message in real-time
7. **Given** a meeting is in progress, **When** network conditions change, **Then** the system adapts quality to maintain connection (graceful degradation)
8. **Given** a participant leaves the meeting, **When** they disconnect, **Then** other participants are notified of their departure
9. **Given** a participant experiences network issues, **When** they reconnect, **Then** they rejoin the meeting without losing context
10. **Given** an agent in the room, **When** a participants interacts, **Then** the agent responds based on the combined context (custom prompt + default prompt + knowledge base)
11. **Given** an agent in the room, **When** agent needs to provide tips, info etc..., **Then** it should show in a dedicated panel or overlay in the room interface, so it does not interrupt the meeting flow.

---

### User Story 4 - AI Agent Provides Contextual Assistance (Priority: P2)

**Working directory**: `/agent-doctor-live/agent`

During a meeting, an AI agent monitors the conversation and provides contextual tips, suggestions, and guidance based on the meeting's custom prompt, entity default instructions, and uploaded reference documents.

**Why this priority**: This differentiates the platform from basic video conferencing. While not essential for basic meetings, it provides significant value-add for professional contexts.

**Independent Test**: During a meeting, the AI agent listens to conversation context, processes it against configured prompts and knowledge base, and provides relevant suggestions in real-time. This can be tested independently by validating agent responses against various meeting scenarios.

**Acceptance Scenarios**:

1. **Given** an AI agent is connected to a room, **When** participants discuss a topic covered in the entity's guidelines, **Then** the agent provides relevant tips or references from those guidelines
2. **Given** a meeting has custom context (e.g., "cardiology consultation"), **When** participants mention symptoms or procedures, **Then** the agent offers contextually appropriate suggestions based on uploaded medical reference documents
3. **Given** the entity uploaded policy PDFs, **When** the AI agent receives a query related to those policies, **Then** it retrieves relevant information from the vector database and presents it
4. **Given** a meeting is ongoing, **When** the AI agent detects potential misunderstandings or gaps in discussion, **Then** it proactively offers clarifying information
5. **Given** participants interact with the AI agent, **When** they ask direct questions, **Then** the agent responds based on the combined context (custom prompt + default prompt + knowledge base)
6. **Given** an agent in the room, **When** a participant requests additional resources, **Then** the agent provides relevant documents or links in the dedicated panel or overlay
7. **Given** the AI agent is active, **When** it encounters a situation outside its knowledge base, **Then** it gracefully indicates its limitations without disrupting the meeting flow
8. **Given** the AI agent is providing suggestions, **When** participants find them useful or not, **Then** they can provide feedback (thumbs up/down) to help improve future responses
9. **Given** the AI agent is connected to a room, **When** the meeting ends, **Then** the agent logs its interactions and suggestions for analytics and performance monitoring
10. **Given** a participant wants to disable AI assistance, **When** they toggle the AI agent off, **Then** the agent ceases providing suggestions for the remainder of the meeting, and other participants are notified of this change and it should be possible to enable it again.
11. **Given** an interaction **When** the agent receives the event, **Then** it should store in a database the interaction including timestamp, participant who triggered it, type of interaction (suggestion, answer to question, proactive tip), and content provided.
12. **Given** an room, participant or any other LiveKit related event **When** the agent receives the event, **Then** it should store in a database the event name including timestamp, participant (if is a participant related event), room (if is a room related event) and data (JSON with event specific data).

---

### User Story 5 - Administrator Monitors Platform Usage and Analytics (Priority: P3)

**Working directory**: `/agent-doctor-live/manager`

Entity administrators need visibility into platform usage, meeting statistics, AI agent performance, and participant engagement to optimize their organization's use of the platform.

**Why this priority**: Analytics provide optimization opportunities but are not required for platform operation. They enable data-driven improvements.

**Independent Test**: Administrator can access analytics dashboard showing meeting counts, participant metrics, AI agent usage statistics, and engagement trends.

**Acceptance Scenarios**:

1. **Given** an administrator accesses the analytics dashboard, **When** they view entity statistics, **Then** they see total meetings held, average participants per meeting, and total meeting duration
2. **Given** AI agents have been used in meetings, **When** the administrator reviews AI performance, **Then** they see metrics like number of suggestions provided, participant interactions with the agent, and feedback ratings
3. **Given** multiple departments or teams exist within an entity, **When** the administrator filters analytics, **Then** they can view usage patterns by department or meeting type
4. **Given** resource planning is needed, **When** the administrator views capacity trends, **Then** they see peak usage times and concurrent meeting loads

---

### Edge Cases

- **What happens when a participant's network connection drops during a meeting?** The system should attempt to reconnect automatically, maintain their placeholder in the participant list for a reasonable timeout period (e.g., 60 seconds), and allow seamless rejoin without losing context.

- **What happens when the maximum participant capacity is reached?** The system should prevent additional participants from joining, display a clear "room full" message, and optionally queue participants or notify the meeting organizer.

- **What happens when an AI agent fails to connect or crashes during a meeting?** The meeting should continue without AI assistance, participants should receive a notification that the agent is unavailable, and the system should attempt to reconnect the agent automatically.

- **What happens when a user tries to schedule a meeting beyond their entity's allowed capacity?** The system should validate capacity limits during scheduling and prevent creation, displaying the maximum allowed capacity and suggesting the user contact their administrator for upgrades.

- **What happens when conflicting system prompts exist (custom vs. default)?** The system should merge prompts with custom instructions taking precedence, or provide clear hierarchy documentation (e.g., custom prompt + default prompt as context layers).

- **What happens when a participant joins with unsupported browser or device?** The system should detect incompatible environments during the pre-join check and display clear error messages with recommendations for supported browsers/devices.

- **What happens when a recorded meeting contains sensitive information that needs redaction?** Recordings are protected by automatic retention policies configured per entity (30 days, 90 days, or 1 year). Entity administrators cannot delete or edit recordings manually to maintain audit integrity and compliance. After the retention period expires, recordings are automatically purged from the system. This ensures data lifecycle management while preserving recording authenticity for legal and compliance purposes.

- **What happens when vector database queries for AI context take too long?** The AI agent should implement timeout mechanisms, fall back to default prompts if vector search exceeds threshold (e.g., 2 seconds), and log performance issues for monitoring.

- **What happens during concurrent access to entity configuration?** The system should implement optimistic locking or conflict resolution to prevent simultaneous administrators from overwriting each other's changes.

- **What happens when a magic link expires or is used after the meeting has ended?** The system should validate link timestamps, display appropriate expiration messages, and optionally redirect to the meeting archive/recording if available.

## Requirements *(mandatory)*

### Functional Requirements

#### Secretary API (Room Scheduling & Access Management)

**Working directory**: `/agent-doctor-live/secretary`

- **FR-001**: System MUST allow authenticated users or via service accounts integration to schedule meeting rooms with title, description, date/time, and expected participant count, and participants info (email or phone number).
- **FR-002**: System MUST allow users to provide custom AI agent prompts specific to each scheduled meeting's context
- **FR-003**: System MUST generate unique access tokens for each scheduled meeting that authorize participant entry
- **FR-004**: System MUST generate magic links (tokenized URLs) for each scheduled meeting that allow staging area (check audio/video settings) access with simple password (8 numbers) to enter the room
- **FR-005**: System MUST enforce entity-specific participant capacity limits when creating meeting rooms
- **FR-006**: System MUST store scheduled meeting metadata including organizer, entity association, custom prompts, and access credentials
- **FR-007**: System MUST provide API endpoints for listing, updating, and canceling scheduled meetings
- **FR-008**: System MUST validate access tokens and magic links before allowing participants to join rooms
- **FR-009**: System MUST track meeting lifecycle states (scheduled, active, completed, canceled)

#### Meeting Server (Media Handling & Room Connections)

- **FR-013**: System MUST provide self-hosted LiveKit server for managing WebRTC media connections
- **FR-014**: System MUST handle concurrent audio and video streams for multiple participants per room
- **FR-015**: System MUST support screen sharing capability for any participant in the room
- **FR-016**: System MUST implement adaptive bitrate streaming to handle varying network conditions
- **FR-017**: System MUST provide real-time chat messaging functionality synchronized across all participants
- **FR-018**: System MUST support meeting recording with audio, video, screen share, and chat capture
- **FR-019**: System MUST allow authorized users to start, pause, and stop meeting recordings
- **FR-020**: System MUST store completed recordings with indexed metadata for retrieval and playback
- **FR-021**: System MUST implement automatic retention policies for recordings with configurable periods per entity (30 days, 90 days, or 1 year)
- **FR-022**: System MUST automatically purge recordings after their retention period expires to comply with data lifecycle policies
- **FR-023**: System MUST prevent entity administrators from manually deleting or editing recordings to maintain audit integrity
- **FR-024**: System MUST handle participant connection events (join, leave, reconnect) gracefully
- **FR-025**: System MUST enforce participant capacity limits configured at the entity level
- **FR-026**: System MUST provide connection quality indicators and network diagnostics to participants

#### AI Agent Module

- **FR-027**: System MUST connect an AI agent to each active meeting room based on configuration
- **FR-028**: System MUST combine custom meeting prompts with entity default prompts to form the agent's system instruction context
- **FR-029**: System MUST retrieve relevant information from the vector database based on meeting conversation context
- **FR-030**: System MUST process audio transcriptions in real-time to understand meeting context
- **FR-031**: System MUST provide contextual tips, suggestions, and guidelines to participants based on combined prompt context and knowledge base
- **FR-032**: System MUST respond to direct questions from participants using available context sources
- **FR-033**: System MUST log agent interactions and suggestions for analytics and performance monitoring
- **FR-034**: System MUST handle agent failures gracefully without disrupting the meeting
- **FR-035**: System MUST allow participants to enable/disable AI agent participation during meetings
- **FR-036**: System MUST save all events related to the agent including interactions, participant, room and LiveKit events in a database for future analysis.
- **FR-037**: System MUST store the transcriptions of the meetings in a database for future analysis.

#### Manager Application (Web UI & Administration)

- **FR-038**: System MUST allow authenticated entity administrators to create and configure entity profiles with organization name, type (medical clinic, design agency, educational institution, etc.), and participant capacity limits
- **FR-039**: System MUST allow entity administrators to set default AI agent system prompts that apply to all meetings within their organization
- **FR-040**: System MUST allow entity administrators to upload reference documents (PDFs) that are processed and stored in a vector database for AI agent context retrieval
- **FR-041**: System MUST provide server-side rendered web application for user authentication and session management
- **FR-042**: System MUST allow entity administrators to view and edit organization settings including default system prompts
- **FR-043**: System MUST allow entity administrators to configure recording retention policies (30 days, 90 days, or 1 year)
- **FR-044**: System MUST provide interface for uploading and managing reference documents (PDFs) for AI context
- **FR-045**: System MUST allow users to create, view, update, and cancel scheduled meetings through web interface
- **FR-046**: System MUST allow users to customize AI prompts for individual meetings during scheduling
- **FR-047**: System MUST display user's upcoming and past meeting history with access links
- **FR-048**: System MUST allow users to manage their profile information (name, email, avatar, preferences)
- **FR-049**: System MUST provide analytics dashboard showing meeting statistics, AI agent usage, and participant engagement
- **FR-050**: System MUST allow users to access and playback recorded meeting sessions (within retention period)
- **FR-051**: System MUST display entity-level capacity usage and limits to administrators
- **FR-052**: System MUST support role-based access control (entity admin vs. regular user permissions)

#### Room Frontend Module (Meeting Experience)

- **FR-053**: System MUST provide web-based meeting room interface accessible via magic links or access tokens
- **FR-054**: System MUST detect and request necessary permissions for camera and microphone access
- **FR-055**: System MUST display video feeds for all active participants in a responsive grid layout
- **FR-056**: System MUST provide controls for enabling/disabling camera, microphone, and screen sharing
- **FR-057**: System MUST display real-time chat messages with participant identification
- **FR-058**: System MUST show AI agent suggestions and tips in a dedicated panel or overlay
- **FR-059**: System MUST indicate when recording is active with clear visual indicators
- **FR-060**: System MUST display participant list with join/leave notifications
- **FR-061**: System MUST provide network quality indicators and troubleshooting information
- **FR-062**: System MUST support responsive design for desktop, tablet, and mobile devices
- **FR-063**: System MUST handle pre-join device testing (camera/microphone check before entering room)

### Key Entities

- **Entity**: Represents an organization (clinic, company, educational institution, etc.) that uses the platform. Attributes include organization name, type/category, default AI agent system prompts, participant capacity limits, recording retention policy (30 days, 90 days, or 1 year), uploaded reference documents, and active status.

- **User**: Represents individuals who schedule and participate in meetings. Attributes include authentication credentials, display name, email, profile avatar, role (entity admin, client or professional), associated entity, notification preferences, and meeting history.

- **Meeting Room**: Represents a scheduled or active video/audio meeting session. Attributes include unique identifier, title, description, scheduled date/time, organizer reference, entity association, custom AI prompt for the meeting, participant capacity limit, access token, magic link, current state (scheduled/active/completed/canceled), and actual participant count.

- **Participant**: Represents an individual actively connected to a meeting room. Attributes include user reference, join timestamp, connection status, audio/video enabled states, and current activity (speaking, screen sharing, etc.).

- **AI Agent Instance**: Represents the AI assistant connected to a specific meeting room. Attributes include combined system prompt (custom + default), reference to vector database knowledge base, conversation context history, provided suggestions log, and connection status.

- **Recording**: Represents a captured meeting session. Attributes include meeting room reference, recording start/end timestamps, file storage location(s), indexed metadata (participants, chat log, AI interactions), duration, access permissions, retention policy from entity configuration, scheduled purge date (calculated from end timestamp + retention period), and immutable flag (prevents manual deletion/editing).

- **Reference Document**: Represents uploaded PDFs or documents used for AI agent context. Attributes include entity association, file metadata, vector embeddings for semantic search, upload timestamp, and processing status.

- **Vector Database Entry**: Represents processed document chunks stored for semantic retrieval. Attributes include source document reference, text content, vector embedding, metadata tags, and relevance scoring.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can schedule a meeting with custom AI prompts in under 3 minutes from login to confirmation
- **SC-002**: Participants can join a meeting via magic link within 10 seconds of clicking the link
- **SC-003**: System handles at least 50 concurrent meeting rooms with 10 participants each without performance degradation
- **SC-004**: Video and audio quality remains stable for participants with minimum 2 Mbps network connection
- **SC-005**: AI agent provides contextually relevant suggestions within 5 seconds of conversation context change
- **SC-006**: 90% of participants successfully enable camera/microphone on first attempt without technical issues
- **SC-007**: Screen sharing initiates within 3 seconds of participant activation
- **SC-008**: Chat messages are delivered to all participants within 500 milliseconds
- **SC-009**: Meeting recordings are available for playback within 5 minutes of session completion
- **SC-010**: System achieves 99.5% uptime for scheduled meetings (excluding maintenance windows)
- **SC-011**: AI agent retrieves relevant information from vector database knowledge base with 80% accuracy based on participant queries
- **SC-012**: System supports participant reconnection after network interruption within 30 seconds without requiring full rejoin
- **SC-013**: Entity administrators can update default AI prompts and see changes reflected in new meetings within 1 minute
- **SC-014**: Analytics dashboard loads within 2 seconds and displays data updated within the last 5 minutes
- **SC-015**: 85% of users report satisfaction with AI agent assistance quality in post-meeting surveys

## Assumptions *(optional but recommended)*

- The platform assumes users have modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) with WebRTC support
- Entity administrators have sufficient technical knowledge to configure meaningful AI system prompts and upload relevant reference documents
- Users have stable internet connections with minimum 2 Mbps download/1 Mbps upload for acceptable video/audio quality
- The LiveKit server infrastructure can scale horizontally to handle peak concurrent meeting loads
- Vector database (e.g., Pinecone, Weaviate, Qdrant) can process PDF documents and generate embeddings within reasonable time frames (< 5 minutes per document)
- AI agent language model (e.g., GPT-4, Claude) has sufficient context window to process combined prompts and conversation history
- Meeting recordings storage infrastructure has adequate capacity for expected usage patterns (estimated storage requirements based on duration and quality settings)
- Users understand that AI agent suggestions are assistive and not authoritative (especially for medical, legal, or financial contexts)
- Authentication and authorization mechanisms (OAuth2, JWT, or similar) are implemented securely following industry standards
- The platform targets organizations with 10-500 users as the primary market segment

## Out of Scope *(optional but recommended)*

The following capabilities are explicitly NOT included in this feature specification and may be considered for future iterations:

- **Mobile native applications** (iOS/Android) - Initial release focuses on web-based responsive interface only
- **End-to-end encryption** for media streams - Standard TLS encryption is provided, but E2EE adds significant complexity
- **Breakout rooms** functionality - Ability to split meeting into smaller sub-rooms for group activities
- **Whiteboard/collaborative drawing tools** - Real-time visual collaboration beyond screen sharing
- **Live streaming** to external platforms (YouTube, Twitch, etc.) - Broadcasting meetings to public audiences
- **Virtual backgrounds** and video filters - Cosmetic video enhancements
- **Automatic meeting transcription** in multiple languages - AI agent provides assistance but not full transcription service
- **Calendar integrations** (Google Calendar, Outlook, etc.) - Users schedule directly in platform only
- **Third-party integrations** (Slack, Microsoft Teams, etc.) - Platform operates as standalone system
- **Custom branding/white-labeling** - All entities use consistent platform branding in initial release
- **Advanced AI capabilities** like real-time translation, sentiment analysis, or automated meeting summaries
- **Participant polling/voting** features during meetings
- **Granular permission controls** beyond entity admin vs. regular user (e.g., moderator roles, presenter-only access)
- **Meeting templates** for recurring meeting types with pre-configured settings
- **SIP/PSTN integration** for dial-in participants via phone
- **Compliance certifications** (HIPAA, SOC 2, GDPR) - Security is implemented following best practices, but formal certification is post-launch

## Dependencies *(optional but include if applicable)*

- **LiveKit Server**: Self-hosted media server infrastructure for WebRTC connections, requiring dedicated server resources and network configuration
- **Vector Database**: External service (e.g., Pinecone, Weaviate, Qdrant) for storing and retrieving document embeddings; requires API credentials and quota management
- **AI Language Model API**: Access to LLM provider (e.g., OpenAI GPT-4, Anthropic Claude) for AI agent functionality; requires API keys and usage budget
- **PostgreSQL Database**: Relational database for storing entities, users, meetings, and metadata as defined in the secretary schema
- **Redis Cache**: In-memory data store for session management, real-time presence, and temporary access tokens
- **Object Storage**: Service (e.g., AWS S3, MinIO) for storing meeting recordings and uploaded reference documents
- **PDF Processing Library**: Tool for extracting text from uploaded documents (e.g., PyPDF2, pdf-parse) before vectorization
- **Authentication Provider**: OAuth2/OIDC provider for user authentication (could be self-hosted or third-party like Auth0, Keycloak)
- **DNS and TLS Certificates**: Domain configuration and SSL/TLS certificates for secure HTTPS access
- **Email Service**: SMTP or email API (e.g., SendGrid, AWS SES) for sending meeting invitations and notifications
- **Monitoring and Logging**: Infrastructure for application monitoring, error tracking (e.g., Sentry, Datadog), and log aggregation

## Notes *(optional - for additional context)*

### Architecture Overview

The platform follows a modular microservices architecture with clear separation of concerns:

- **Secretary**: Handles scheduling, access control, and entity configuration (TypeScript/Fastify + PostgreSQL)
- **Meeting Server**: Self-hosted LiveKit server managing WebRTC media and room state
- **Agent**: AI assistant(S) module connecting to rooms and providing contextual guidance (TypeScript/LiveKit Agents SDK)
- **Manager**: Server-side rendered web application for administration and user management (Server side rendering with HTMX + Fastify)
- **Room**: Client-side meeting experience (React-based SPA integrating with LiveKit client SDK)

### AI Agent Context Hierarchy

The AI agent's system prompt is constructed from multiple layers:

1. **Base Layer**: Platform-level instructions (e.g., "You are a helpful meeting assistant")
2. **Entity Default Layer**: Organization-specific guidelines set by entity administrators (e.g., "Follow our company's communication policy")
3. **Custom Meeting Layer**: Meeting-specific context provided during scheduling (e.g., "This is a cardiology consultation, focus on medical terminology")
4. **Knowledge Base Layer**: Vector database retrieval results from uploaded reference documents

This hierarchical approach ensures context specificity while maintaining consistency with organizational policies.

### Scalability Considerations

The platform is designed for horizontal scalability:

- **Secretary API**: Stateless API servers behind load balancer, can scale based on request volume
- **LiveKit Server**: Supports clustering for distributing media processing load across multiple nodes
- **AI Agent**: Can spawn multiple agent instances per meeting room if needed, or pool agents across rooms
- **Vector Database**: Managed service handles scaling transparently, but query performance depends on index size
- **Database**: PostgreSQL with read replicas for analytics queries, connection pooling for efficiency

Expected capacity: Support 100+ concurrent meetings with 10 participants each (1000+ concurrent users) with appropriate infrastructure provisioning.

### Security Considerations

While detailed security implementation is out of scope for this specification, the following principles should guide development:

- All communications use TLS 1.3+ encryption in transit
- Access tokens and magic links should have expiration mechanisms
- User authentication follows OAuth2/OIDC standards with secure session management
- AI agent prompts should be sanitized to prevent prompt injection attacks
- Vector database queries should be rate-limited to prevent abuse
- Recording access should respect user permissions and privacy settings
- Uploaded documents should be scanned for malware before processing
- Sensitive data (credentials, tokens) stored using industry-standard encryption at rest

### Future Enhancement Opportunities

Based on the modular architecture, future iterations could add:

- Real-time language translation using AI agent capabilities
- Meeting analytics powered by conversation sentiment analysis
- Automated meeting summaries and action item extraction
- Integration with popular calendar and productivity tools
- Advanced recording features (highlights, chapters, searchable transcripts)
- Enhanced collaboration tools (whiteboard, document co-editing)
- Compliance and governance features for regulated industries
