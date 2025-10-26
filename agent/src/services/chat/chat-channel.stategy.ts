import type { ChatChannelType } from "../../domain/types";

export interface ChatChannelStrategy {
  readonly channelId: string;
  readonly type: ChatChannelType;
  readonly participantIds: ReadonlySet<string>;
  sendMessage(message: string, topic?: string): Promise<void>;
}
