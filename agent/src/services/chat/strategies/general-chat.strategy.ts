import type { JobContext } from "@livekit/agents";
import { ChatChannelType } from "../../../domain/types";
import type { ChatChannelStrategy } from '../chat-channel.stategy';


/**
 * General chat channel visible to all participants
 */
export class GeneralChatChannel implements ChatChannelStrategy {
  public readonly channelId = 'general';
  public readonly type = ChatChannelType.GENERAL;
  public readonly participantIds: ReadonlySet<string>;

  constructor(
    private readonly ctx: JobContext,
    participantIds: Set<string>,
  ) {
    this.participantIds = participantIds;
  }

  public async sendMessage(message: string, topic = 'transcript'): Promise<void> {
    if (!this.ctx.room || !this.ctx.room.localParticipant) {
      throw new Error('Room or local participant not available');
    }

    const data = Buffer.from(
      JSON.stringify({
        type: 'transcript',
        content: message,
        timestamp: new Date().toISOString(),
      }),
    );

    this.ctx.room.localParticipant.publishData(data, {
      reliable: true,
      topic,
    });
  }
}