import { voice } from '@livekit/agents';

export function registerSessionEvents(session: voice.AgentSession): void {
  session.on(voice.AgentSessionEventTypes.Error, (ev) => {
    const errorInfo = ev.error as { recoverable?: boolean };
    console.error('[AgentSession] Error:', {
      error: ev.error,
      recoverable: errorInfo.recoverable,
      source: ev.source,
    });

    if (!errorInfo.recoverable) {
      try {
        session.say(
          'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente.',
        );
      } catch (sayError) {
        console.error('[AgentSession] Failed to notify user of error:', sayError);
      }
    }
  });

  session.on(voice.AgentSessionEventTypes.Close, (ev) => {
    console.log('[AgentSession] Close:', {
      reason: ev.error ? 'error' : 'normal',
    });

    if (ev.error) {
      console.error('[AgentSession] Session closed due to error:', ev.error);
    }
  });

  session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
    console.log('[AgentSession] UserInputTranscribed:', {
      transcript: ev.transcript,
      isFinal: ev.isFinal,
      speakerId: ev.speakerId,
    });
  });

  session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
    console.log('[AgentSession] ConversationItemAdded:', {
      role: ev.item.role,
      textContent: ev.item.textContent,
      interrupted: ev.item.interrupted,
    });
  });

  session.on(voice.AgentSessionEventTypes.FunctionToolsExecuted, (ev) => {
    console.log('[AgentSession] FunctionToolsExecuted:', {
      functionCallsCount: ev.functionCalls.length,
      functionCalls: ev.functionCalls,
      functionCallOutputs: ev.functionCallOutputs,
    });
  });

  session.on(voice.AgentSessionEventTypes.FunctionToolsExecuted, (ev) => {
    console.log('[AgentSession] FunctionToolsExecuted:', {
      functionCallsCount: ev.functionCalls.length,
      functionCalls: ev.functionCalls,
      functionCallOutputs: ev.functionCallOutputs,
    });
  });

  session.on(voice.AgentSessionEventTypes.SpeechCreated, (ev) => {
    console.log('[AgentSession] SpeechCreated:', {
      userInitiated: ev.userInitiated,
      source: ev.source,
    });
  });

  session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
    console.log('[AgentSession] AgentStateChanged:', {
      oldState: ev.oldState,
      newState: ev.newState,
    });
  });

  session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => {
    console.log('[AgentSession] UserStateChanged:', {
      oldState: ev.oldState,
      newState: ev.newState,
    });
  });

  session.on(voice.AgentSessionEventTypes.MetricsCollected, () => {
    console.log('[AgentSession] MetricsCollected:', {
      timestamp: new Date().toISOString(),
    });
  });
}
