import type { JobContext } from "@livekit/agents";
import { GeneralChatChannel } from "./strategies/general-chat.strategy";
import { PrivateChatChannel } from "./strategies/private-chat.strategy";


/**
 * Factory for creating chat channels
 * Implements Factory Pattern
 */
export class ChatChannelFactory {
  /**
   * Create a private chat channel for a specific participant
   */
  public static createPrivateChannel(
    ctx: JobContext,
    targetParticipantId: string,
  ): PrivateChatChannel {
    return new PrivateChatChannel(ctx, targetParticipantId);
  }

  /**
   * Create a general chat channel visible to all participants
   */
  public static createGeneralChannel(
    ctx: JobContext,
    participantIds: Set<string>,
  ): GeneralChatChannel {
    return new GeneralChatChannel(ctx, participantIds);
  }
}