import { llm } from "@livekit/agents";
import { 
    ParticipantRole, 
    TipPriority, 
    type ChatContext, 
    type TranscriptionMessage 
} from "../../../../domain/types";
import type { TipGenerationStrategy } from "../tip-generation.strategy";

export class ProfessionalTipStrategy implements TipGenerationStrategy {
  constructor(private readonly llm: llm.LLM) {}

  public async generateTip(context: ChatContext): Promise<string> {
    const recentHistory = this.formatConversationHistory(context.conversationHistory.slice(-10));

    const prompt = `${context.systemPrompt}

Você está auxiliando um médico durante uma consulta. Com base na conversa recente, forneça uma dica objetiva e concisa para o médico.

Histórico da conversa:
${recentHistory}

Forneça uma dica prática e relevante para o médico em no máximo 2 frases. Foque em:
- Questões diagnósticas importantes
- Exames que podem ser necessários
- Pontos de atenção clínica
- Orientações terapêuticas

Dica:`;

    const llmContext = new llm.ChatContext();
    llmContext.addMessage({ role: 'system', content: prompt });

    const response = await this.llm.chat({ chatCtx: llmContext });

    return this.extractContent(response);
  }

  public getPriority(context: ChatContext): TipPriority {
    const recentMessages = context.conversationHistory.slice(-5);
    const hasCriticalKeywords = recentMessages.some((msg) =>
      /dor|emergência|grave|urgente|crítico/i.test(msg.transcript),
    );

    return hasCriticalKeywords ? TipPriority.HIGH : TipPriority.MEDIUM;
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
