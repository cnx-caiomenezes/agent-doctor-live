import { voice } from '@livekit/agents';
import { helpCommand } from './help.command';
import { statusCommand } from './status.command';
import { unknownCommand } from './unknown.command';

export { helpCommand, statusCommand, unknownCommand };

export const commandMap: Record<string, (session: voice.AgentSession) => Promise<void>> = {
  '/help': helpCommand,
  '/ajuda': helpCommand,
  '/status': statusCommand,
};

export const handleCommand = async (session: voice.AgentSession, command: string): Promise<void> => {
  console.log('[Command] Processing command:', command);

  const normalizedCommand = command.toLowerCase();
  const handler = commandMap[normalizedCommand];

  if (handler) {
    await handler(session);
  } else {
    await unknownCommand(session, command);
  }
};
