import type {
  EventHandler,
  Participant,
  TranscriptionEvent,
  TranscriptionMessage,
} from '../../domain/types';

/**
 * Service responsible for managing multi-participant transcriptions
 * Follows Single Responsibility Principle
 */
export class TranscriptionService {
  private readonly transcriptions: Map<string, TranscriptionMessage[]> = new Map();
  private readonly eventHandlers: Set<EventHandler<TranscriptionEvent>> = new Set();

  /**
   * Register an event handler for transcription events
   */
  public addEventListener(handler: EventHandler<TranscriptionEvent>): void {
    this.eventHandlers.add(handler);
  }

  /**
   * Remove an event handler
   */
  public removeEventListener(handler: EventHandler<TranscriptionEvent>): void {
    this.eventHandlers.delete(handler);
  }

  /**
   * Record a new transcription message
   */
  public async recordTranscription(message: TranscriptionMessage): Promise<void> {
    const participantTranscripts = this.transcriptions.get(message.participantId) ?? [];
    participantTranscripts.push(message);
    this.transcriptions.set(message.participantId, participantTranscripts);

    // Emit event to all handlers
    await this.emitEvent({
      type: 'transcription',
      message,
    });
  }

  /**
   * Get transcription history for a specific participant
   */
  public getParticipantTranscriptions(participantId: string): readonly TranscriptionMessage[] {
    return this.transcriptions.get(participantId) ?? [];
  }

  /**
   * Get all transcriptions across all participants
   */
  public getAllTranscriptions(): readonly TranscriptionMessage[] {
    return Array.from(this.transcriptions.values()).flat().sort((a, b) => {
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  /**
   * Get recent transcriptions limited by count
   */
  public getRecentTranscriptions(limit: number): readonly TranscriptionMessage[] {
    const all = this.getAllTranscriptions();
    return all.slice(-limit);
  }

  /**
   * Clear all transcriptions (useful for room cleanup)
   */
  public clear(): void {
    this.transcriptions.clear();
  }

  /**
   * Clear transcriptions for a specific participant
   */
  public clearParticipant(participantId: string): void {
    this.transcriptions.delete(participantId);
  }

  /**
   * Emit event to all registered handlers
   */
  private async emitEvent(event: TranscriptionEvent): Promise<void> {
    const promises = Array.from(this.eventHandlers).map((handler) => handler.handle(event));
    await Promise.all(promises);
  }
}

/**
 * Factory for creating transcription messages
 */
export class TranscriptionMessageFactory {
  /**
   * Create a transcription message from participant audio
   */
  public static create(
    participant: Participant,
    transcript: string,
    confidence?: number,
  ): TranscriptionMessage {
    const message: TranscriptionMessage = {
      participantId: participant.identity,
      participantRole: participant.role,
      transcript: transcript.trim(),
      timestamp: new Date(),
    };

    if (confidence !== undefined) {
      return { ...message, confidence };
    }

    return message;
  }
}
