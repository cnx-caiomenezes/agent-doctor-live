import { voice } from '@livekit/agents';

export const statusCommand = async (session: voice.AgentSession): Promise<void> => {
  console.log('[Command] Executing status command');
  
  await session.say('Agente funcionando normalmente. Como posso ajudar?');
};
