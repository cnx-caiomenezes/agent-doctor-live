import { llm } from '@livekit/agents';
import { ParticipantRole } from '../../../domain/types';
import type { ChatContext, Participant, TipMessage } from '../../../domain/types';
import { ClientTipStrategy } from './strategies/client.strategy';
import { ProfessionalTipStrategy } from './strategies/professional.strategy';
import type { TipGenerationStrategy } from './tip-generation.strategy';

export class TipGenerationService {
  private readonly strategies: Map<ParticipantRole, TipGenerationStrategy> = new Map();

  constructor(llmInstance: llm.LLM) {
    // Register strategies for each role
    this.strategies.set(ParticipantRole.DOCTOR, new ProfessionalTipStrategy(llmInstance));
    this.strategies.set(ParticipantRole.PATIENT, new ClientTipStrategy(llmInstance));
  }

  /**
   * Generate a tip for a specific participant based on conversation context
   */
  public async generateTip(
    context: ChatContext,
    targetParticipant: Participant,
  ): Promise<TipMessage | null> {
    const strategy = this.strategies.get(targetParticipant.role);

    if (!strategy) {
      console.warn(`No tip generation strategy for role: ${targetParticipant.role}`);
      return null;
    }

    // Don't generate tips if there's insufficient conversation
    if (context.conversationHistory.length < 3) {
      return null;
    }

    try {
      const content = await strategy.generateTip(context, targetParticipant);
      const priority = strategy.getPriority(context);

      return {
        targetParticipantId: targetParticipant.identity,
        content,
        timestamp: new Date(),
        priority,
        category: `${targetParticipant.role}_tip`,
      };
    } catch (error) {
      console.error('Error generating tip:', error);
      return null;
    }
  }

  /**
   * Generate tips for multiple participants
   */
  public async generateTipsForParticipants(
    context: ChatContext,
    participants: readonly Participant[],
  ): Promise<TipMessage[]> {
    const tipPromises = participants
      .filter((p) => p.role !== ParticipantRole.AGENT)
      .map((p) => this.generateTip(context, p));

    const tips = await Promise.all(tipPromises);
    return tips.filter((tip): tip is TipMessage => tip !== null);
  }

  /**
   * Register a custom strategy for a participant role
   */
  public registerStrategy(role: ParticipantRole, strategy: TipGenerationStrategy): void {
    this.strategies.set(role, strategy);
  }
}
