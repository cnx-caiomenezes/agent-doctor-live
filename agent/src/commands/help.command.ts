import { voice } from '@livekit/agents';

export const helpCommand = async (session: voice.AgentSession): Promise<void> => {
  console.log('[Command] Executing help command');
  
  await session.say(
    'Comandos disponíveis: /ajuda para esta mensagem, /status para verificar o estado do agente.',
  );
};
