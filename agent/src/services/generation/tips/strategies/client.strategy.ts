import { llm } from '@livekit/agents';
import {
  type ChatContext,
  ParticipantRole,
  TipPriority,
  type TranscriptionMessage,
} from '../../../../domain/types';
import type { TipGenerationStrategy } from '../tip-generation.strategy';

export class ClientTipStrategy implements TipGenerationStrategy {
  constructor(private readonly llm: llm.LLM) {}

  public async generateTip(context: ChatContext): Promise<string> {
    const recentHistory = this.formatConversationHistory(context.conversationHistory.slice(-10));

    const prompt = `${context.systemPrompt}

Você está auxiliando um paciente durante uma consulta médica. Com base na conversa recente, forneça uma dica útil para o paciente.

Histórico da conversa:
${recentHistory}

Forneça uma dica em no máximo 2 frases. Foque em:
- Perguntas importantes que o paciente pode fazer ao médico
- Informações relevantes que o paciente deve mencionar
- Esclarecimentos sobre o que está sendo discutido

Dica:`;

    const llmContext = new llm.ChatContext();
    llmContext.addMessage({ role: 'system', content: prompt });

    const response = await this.llm.chat({ chatCtx: llmContext });

    return this.extractContent(response);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getPriority(_context: ChatContext): TipPriority {
    return TipPriority.LOW;
  }

  private formatConversationHistory(messages: readonly TranscriptionMessage[]): string {
    return messages
      .map((msg) => {
        const role = msg.participantRole === ParticipantRole.DOCTOR ? 'Médico' : 'Paciente';
        return `${role}: ${msg.transcript}`;
      })
      .join('\n');
  }

  private async extractContent(response: AsyncIterable<llm.ChatChunk>): Promise<string> {
    let content = '';
    for await (const chunk of response) {
      content += chunk.delta ?? '';
    }
    return content.trim();
  }
}
