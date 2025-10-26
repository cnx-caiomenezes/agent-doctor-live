import type { JobContext } from '@livekit/agents';
import type { TipMessage, TranscriptionMessage } from '../../domain/types';
import { ChatChannelFactory } from './chat-chanel.factory';
import { type ChatChannelStrategy } from './chat-channel.stategy';


/**
 * Manager for handling multiple chat channels
 * Follows Single Responsibility Principle
 */
export class ChatChannelManager {
  private readonly privateChannels: Map<string, ChatChannelStrategy> = new Map();
  private generalChannel: ChatChannelStrategy | null = null;

  constructor(private readonly ctx: JobContext) {}

  /**
   * Create or get a private channel for a participant
   */
  public getOrCreatePrivateChannel(participantId: string): ChatChannelStrategy {
    let channel = this.privateChannels.get(participantId);

    if (!channel) {
      channel = ChatChannelFactory.createPrivateChannel(this.ctx, participantId);
      this.privateChannels.set(participantId, channel);
    }

    return channel;
  }

  /**
   * Get or create the general channel
   */
  public getOrCreateGeneralChannel(participantIds: Set<string>): ChatChannelStrategy {
    if (!this.generalChannel) {
      this.generalChannel = ChatChannelFactory.createGeneralChannel(this.ctx, participantIds);
    }

    return this.generalChannel;
  }

  /**
   * Send a tip message to a specific participant via their private channel
   */
  public async sendTip(tip: TipMessage): Promise<void> {
    const channel = this.getOrCreatePrivateChannel(tip.targetParticipantId);
    await channel.sendMessage(tip.content, 'tip');
  }

  /**
   * Broadcast a transcription to the general channel
   */
  public async broadcastTranscription(transcription: TranscriptionMessage): Promise<void> {
    if (!this.generalChannel) {
      console.warn('General channel not initialized');
      return;
    }

    const message = JSON.stringify({
      participantId: transcription.participantId,
      role: transcription.participantRole,
      transcript: transcription.transcript,
      timestamp: transcription.timestamp.toISOString(),
    });

    await this.generalChannel.sendMessage(message, 'transcript');
  }

  /**
   * Remove a private channel when a participant leaves
   */
  public removePrivateChannel(participantId: string): void {
    this.privateChannels.delete(participantId);
  }

  /**
   * Get all active private channels
   */
  public getActiveChannels(): ReadonlyMap<string, ChatChannelStrategy> {
    return this.privateChannels;
  }

  /**
   * Clear all channels (cleanup on room end)
   */
  public clear(): void {
    this.privateChannels.clear();
    this.generalChannel = null;
  }
}