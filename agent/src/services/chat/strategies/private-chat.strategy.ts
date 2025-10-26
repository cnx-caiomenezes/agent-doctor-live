import type { JobContext } from '@livekit/agents';
import { ChatChannelType } from '../../../domain/types';
import type { ChatChannelStrategy } from '../chat-channel.stategy';

export class PrivateChatChannel implements ChatChannelStrategy {
  public readonly channelId: string;
  public readonly type = ChatChannelType.PRIVATE;
  public readonly participantIds: ReadonlySet<string>;

  constructor(
    private readonly ctx: JobContext,
    private readonly targetParticipantId: string,
  ) {
    this.channelId = `private_${targetParticipantId}`;
    this.participantIds = new Set([targetParticipantId]);
  }

  public async sendMessage(message: string, topic = 'tip'): Promise<void> {
    if (!this.ctx.room || !this.ctx.room.localParticipant) {
      throw new Error('Room or local participant not available');
    }

    const data = Buffer.from(
      JSON.stringify({
        type: 'tip',
        content: message,
        timestamp: new Date().toISOString(),
        targetParticipant: this.targetParticipantId,
      }),
    );

    this.ctx.room.localParticipant.publishData(data, {
      reliable: true,
      topic,
      destination_identities: [this.targetParticipantId],
    });
  }
}
