import type { JobContext } from '@livekit/agents';
import { llm } from '@livekit/agents';
import {
  type AgentConfig,
  type ChatContext,
  type DomainEvent,
  type EventHandler,
  type Participant,
  ParticipantRole,
} from '../domain/types';
import { TipGenerationService } from '../services/generation/tips/tip-generation.service';
import {
  TranscriptionMessageFactory,
  TranscriptionService,
} from '../services/transcription/transcription.service';
import { ChatChannelManager } from '../services/chat/chat-channel.manager';

/**
 * Main orchestrator for multi-participant agent
 * Coordinates transcription, tip generation, and chat channels
 * Follows Clean Architecture and Domain-Driven Design
 */
export class MultiParticipantAgent {
  private readonly participants: Map<string, Participant> = new Map();
  private readonly transcriptionService: TranscriptionService;
  private readonly tipGenerationService: TipGenerationService;
  private readonly chatChannelManager: ChatChannelManager;
  private readonly eventHandlers: Set<EventHandler> = new Set();
  private tipGenerationIntervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly ctx: JobContext,
    private readonly config: AgentConfig,
    llmInstance: llm.LLM,
  ) {
    this.transcriptionService = new TranscriptionService();
    this.tipGenerationService = new TipGenerationService(llmInstance);
    this.chatChannelManager = new ChatChannelManager(ctx);

    // Setup event forwarding
    this.transcriptionService.addEventListener({
      handle: async (event: DomainEvent) => this.emitEvent(event),
    });
  }

  /**
   * Initialize the agent and setup participants
   */
  public async initialize(): Promise<void> {
    if (!this.ctx.room) {
      throw new Error('Room not available in job context');
    }

    // Setup room event handlers
    this.setupRoomEventHandlers();

    // Initialize general chat channel
    const participantIds = new Set(this.participants.keys());
    this.chatChannelManager.getOrCreateGeneralChannel(participantIds);

    // Start periodic tip generation if configured
    if (this.config.tipGenerationInterval && this.config.tipGenerationInterval > 0) {
      this.startPeriodicTipGeneration();
    }
  }

  /**
   * Register a participant in the session
   */
  public registerParticipant(identity: string, role: ParticipantRole, name: string): void {
    const participant: Participant = {
      identity,
      role,
      name,
    };

    this.participants.set(identity, participant);

    // Create private channel for non-agent participants
    if (role !== ParticipantRole.AGENT) {
      this.chatChannelManager.getOrCreatePrivateChannel(identity);
    }

    // Emit participant joined event
    this.emitEvent({
      type: 'participant_joined',
      participant,
    });
  }

  /**
   * Handle transcription from a participant
   */
  public async handleTranscription(
    participantIdentity: string,
    transcript: string,
    confidence?: number,
  ): Promise<void> {
    const participant = this.participants.get(participantIdentity);

    if (!participant) {
      console.warn(`Unknown participant: ${participantIdentity}`);
      return;
    }

    const message = TranscriptionMessageFactory.create(participant, transcript, confidence);
    await this.transcriptionService.recordTranscription(message);

    // Broadcast to general channel
    await this.chatChannelManager.broadcastTranscription(message);

    // Potentially trigger immediate tip generation for critical content
    if (this.shouldTriggerImmediateTip(transcript)) {
      await this.generateAndSendTips();
    }
  }

  /**
   * Generate and send tips to all participants
   */
  public async generateAndSendTips(): Promise<void> {
    const conversationHistory = this.transcriptionService.getRecentTranscriptions(
      this.config.maxConversationHistory,
    );

    const chatContext: ChatContext = {
      conversationHistory: [...conversationHistory],
      participants: this.participants,
      systemPrompt: this.buildSystemPrompt(),
    };

    const participants = Array.from(this.participants.values());
    const tips = await this.tipGenerationService.generateTipsForParticipants(
      chatContext,
      participants,
    );

    // Send each tip to the appropriate participant
    for (const tip of tips) {
      await this.chatChannelManager.sendTip(tip);

      // Emit tip generated event
      this.emitEvent({
        type: 'tip_generated',
        tip,
      });
    }
  }

  /**
   * Handle participant leaving the room
   */
  public handleParticipantLeft(participantIdentity: string): void {
    this.participants.delete(participantIdentity);
    this.chatChannelManager.removePrivateChannel(participantIdentity);
    this.transcriptionService.clearParticipant(participantIdentity);

    this.emitEvent({
      type: 'participant_left',
      participantId: participantIdentity,
    });
  }

  /**
   * Register an event handler
   */
  public addEventListener(handler: EventHandler): void {
    this.eventHandlers.add(handler);
  }

  /**
   * Remove an event handler
   */
  public removeEventListener(handler: EventHandler): void {
    this.eventHandlers.delete(handler);
  }

  /**
   * Cleanup and shutdown the agent
   */
  public async shutdown(): Promise<void> {
    if (this.tipGenerationIntervalId) {
      clearInterval(this.tipGenerationIntervalId);
      this.tipGenerationIntervalId = null;
    }

    this.transcriptionService.clear();
    this.chatChannelManager.clear();
    this.participants.clear();
    this.eventHandlers.clear();
  }

  /**
   * Setup room event handlers for participant tracking
   */
  private setupRoomEventHandlers(): void {
    if (!this.ctx.room) return;

    // Note: In a complete implementation, you would use proper LiveKit event listeners
    // The exact API depends on the specific LiveKit version and setup
    console.log('Room event handlers would be set up here');
  }

  /**
   * Start periodic tip generation
   */
  private startPeriodicTipGeneration(): void {
    if (!this.config.tipGenerationInterval) return;

    this.tipGenerationIntervalId = setInterval(() => {
      this.generateAndSendTips().catch((error) => {
        console.error('Error in periodic tip generation:', error);
      });
    }, this.config.tipGenerationInterval);
  }

  /**
   * Check if transcript should trigger immediate tip generation
   */
  private shouldTriggerImmediateTip(transcript: string): boolean {
    const criticalKeywords = /dor|emergência|grave|urgente|crítico|ajuda|socorro/i;
    return criticalKeywords.test(transcript);
  }

  /**
   * Build system prompt based on participants
   */
  private buildSystemPrompt(): string {
    const participantsList = Array.from(this.participants.values())
      .map((p) => `- ${p.name} (${p.role})`)
      .join('\n');

    return `Você é um assistente inteligente em uma consulta médica.

Participantes:
${participantsList}

Seu objetivo é fornecer dicas contextuais e relevantes para auxiliar cada participante durante a consulta.`;
  }

  /**
   * Emit domain event to all registered handlers
   */
  private async emitEvent(event: DomainEvent): Promise<void> {
    const promises = Array.from(this.eventHandlers).map((handler) => handler.handle(event));
    await Promise.allSettled(promises);
  }
}

/**
 * Builder for creating MultiParticipantAgent with fluent API
 * Implements Builder Pattern
 */
export class MultiParticipantAgentBuilder {
  private config: {
    llmModel?: string;
    sttLanguage?: string;
    enableNoiseCancellation?: boolean;
    maxConversationHistory?: number;
    tipGenerationInterval?: number;
  } = {
    llmModel: 'gpt-4o-mini',
    sttLanguage: 'pt-BR',
    enableNoiseCancellation: true,
    maxConversationHistory: 20,
  };

  public setLLMModel(model: string): this {
    this.config.llmModel = model;
    return this;
  }

  public setSTTLanguage(language: string): this {
    this.config.sttLanguage = language;
    return this;
  }

  public setMaxConversationHistory(max: number): this {
    this.config.maxConversationHistory = max;
    return this;
  }

  public setTipGenerationInterval(interval: number): this {
    this.config.tipGenerationInterval = interval;
    return this;
  }

  public enableNoiseCancellation(enable: boolean): this {
    this.config.enableNoiseCancellation = enable;
    return this;
  }

  public build(ctx: JobContext, llmInstance: llm.LLM): MultiParticipantAgent {
    const agentConfig: AgentConfig = {
      llmModel: this.config.llmModel ?? 'gpt-4o-mini',
      sttLanguage: this.config.sttLanguage ?? 'pt-BR',
      enableNoiseCancellation: this.config.enableNoiseCancellation ?? true,
      maxConversationHistory: this.config.maxConversationHistory ?? 20,
    };

    if (this.config.tipGenerationInterval !== undefined) {
      return new MultiParticipantAgent(
        ctx,
        { ...agentConfig, tipGenerationInterval: this.config.tipGenerationInterval },
        llmInstance,
      );
    }

    return new MultiParticipantAgent(ctx, agentConfig, llmInstance);
  }
}
