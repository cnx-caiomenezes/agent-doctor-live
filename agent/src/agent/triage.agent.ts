import { initializeLogger, llm, log, voice } from '@livekit/agents';
import type { ReadableStream } from 'stream/web';

export class Triage extends voice.Agent {
  public static AGENT_NAME = 'triage-agent';
  private LOGGER;

  constructor(chatContext: llm.ChatContext) {
    super({
      allowInterruptions: true,
      chatCtx: chatContext,
      instructions: `Você é um agente de triagem médica virtual. Seu objetivo é coletar informações básicas sobre os sintomas do paciente e fornecer orientações iniciais. Siga estas diretrizes:
          1. Cumprimente o paciente de forma amigável.
          2. Pergunte sobre os sintomas principais e sua duração.
          3. Solicite informações adicionais, como histórico médico relevante.
          4. Forneça orientações iniciais com base nas informações coletadas.
          5. Mantenha a conversa profissional e empática.
          6. Nao faca diagnósticos definitivos ou prescrições médicas.
          7. Sempre recomende que o paciente consulte um profissional de saúde para um diagnóstico completo.
          8. Nao faca mais de uma pergunta por vez. Espere a resposta do paciente antes de prosseguir para a proxima pergunta.              

          Lembre-se de que você não é um substituto para um profissional de saúde qualificado. Sempre recomende que o paciente procure atendimento médico adequado se os sintomas forem graves ou persistentes.`,
    });

    initializeLogger({ pretty: true, level: 'info' });
    this.LOGGER = log();
  }

  override async onEnter(): Promise<void> {
    await this.session.chatCtx.addMessage({
      role: 'assistant',
      content: `Olá! Eu sou o assistente virtual de triagem médica. Bem vindo a triagem médica Conexa Saúde.`,
    });

    const handle = this.session.generateReply({
      instructions: `Cumprimente o paciente seguindo as instruções:
      Geralmente cumprimentamos falando:
        - "Bom dia": quando ainda é antes do meio-dia (<= 12h).
        - "Boa tarde": quando é após meio-dia (>= 13h)
        - "Boa noite": quando é após as 18h`,
      userInput: `Oi, meu nome é ${this.session.userData.name}`,
    });

    await handle.waitForPlayout();
  }

  override async onUserTurnCompleted(): Promise<void> {
    this.LOGGER.info('User turn completed.');
    return Promise.resolve();
  }

  override onExit(): Promise<void> {
    this.session.generateReply({
      instructions: 'Tell the user a friendly goodbye before you exit.',
    });

    this.LOGGER.info('Exiting triage agent session.');
    return Promise.resolve();
  }

  override async transcriptionNode(
    text: ReadableStream<string>,
  ): Promise<ReadableStream<string> | null> {
    const [loggingStream, returnStream] = text.tee();

    const reader = loggingStream.getReader();
    (async () => {
      try {
        let transcribedText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          transcribedText += value;
        }

        if(transcribedText.trim().length > 0) {
          this.LOGGER.info('📝 Texto transcrito:', transcribedText);
        }
      } catch (error) {
        this.LOGGER.error('Erro ao ler texto transcrito:', error);
      } finally {
        reader.releaseLock();
      }
    })();

    return returnStream;
  }
}
