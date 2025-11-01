import { voice } from '@livekit/agents';

export const unknownCommand = async (session: voice.AgentSession, command: string): Promise<void> => {
  console.log('[Command] Unknown command received:', command);
  
  await session.say(
    `Comando não reconhecido: ${command}. Use /ajuda para ver os comandos disponíveis.`,
  );
};
