import { initializeLogger, llm, log, voice } from '@livekit/agents';
import type { ReadableStream } from 'stream/web';

export class Triage extends voice.Agent {
  public static AGENT_NAME = 'triage-agent';
  private LOGGER;

  constructor(chatContext: llm.ChatContext) {
    super({
      chatCtx: chatContext,
      instructions: `Você é um agente de triagem médica virtual. Seu objetivo é coletar informações básicas sobre os sintomas do paciente e fornecer orientações iniciais. Siga estas diretrizes:
          1. Cumprimente o paciente de forma amigável.
          2. Pergunte sobre os sintomas principais e sua duração.
          3. Solicite informações adicionais, como histórico médico relevante.
          4. Forneça orientações iniciais com base nas informações coletadas.
          5. Mantenha a conversa profissional e empática.

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
    this.LOGGER.info('Exiting triage agent session.');
    return Promise.resolve();
  }

  override transcriptionNode(
    text: ReadableStream<string>,
    modelSettings: voice.ModelSettings,
  ): Promise<ReadableStream<string> | null> {
    this.LOGGER.info(
      `Transcription node called: [${text}], tool: [${modelSettings.toolChoice?.toString()}]`,
    );

    return Promise.resolve(text);
  }
}
