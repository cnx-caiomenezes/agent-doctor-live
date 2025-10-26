import type { ChatContext, Participant, TipPriority } from "../../../domain/types";

export interface TipGenerationStrategy {
  generateTip(context: ChatContext, targetParticipant: Participant): Promise<string>;
  getPriority(context: ChatContext): TipPriority;
}