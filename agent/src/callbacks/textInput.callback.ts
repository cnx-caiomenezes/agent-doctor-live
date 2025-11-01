import { voice } from '@livekit/agents';
import { handleCommand } from '../commands';

export const textInputCallback = async (
  session: voice.AgentSession,
  ev: { text: string },
): Promise<void> => {
  const message = ev.text.trim();

  console.log('[TextInput] Received user text:', {
    text: message,
    timestamp: new Date().toISOString(),
  });

  if (message.startsWith('/')) {
    await handleCommand(session, message);
    return;
  }

  const inappropriateWords = ['spam', 'inappropriate'];

  if (inappropriateWords.some((word) => message.toLowerCase().includes(word))) {
    console.log('[TextInput] Inappropriate message detected');

    await session.say('Desculpe, não posso responder a esse tipo de mensagem.');

    return;
  }

  session.interrupt();

  await session.generateReply({ userInput: message });
};
