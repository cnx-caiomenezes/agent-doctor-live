import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  WorkerPermissions,
  cli,
  defineAgent,
  llm,
  metrics,
  stt,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { getPatientPromptuary } from './agent/pre-warm/getPatientPromptuary';
import { Triage } from './agent/triage.agent';
import { textInputCallback } from './callbacks';
import { registerRoomEvents, registerSessionEvents } from './events';

dotenv.config({ path: '.env' });

export type JobProcessUserData = JobProcess & {
  vad: silero.VAD;
  patientPromptuary: ReturnType<typeof getPatientPromptuary>;
};

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
    proc.userData.patientPromptuary = await getPatientPromptuary(
      (String(proc.userData.patientId) as string) ?? 'test',
    );
  },
  entry: async (ctx: JobContext) => {
    try {
      console.debug(ctx.job.metadata);
      
      const vad = ctx.proc.userData.vad! as silero.VAD;

      const groqSTT = openai.STT.withGroq({
        model: 'whisper-large-v3-turbo',
        language: 'pt',
      });

      const streamAdaptedSTT = new stt.StreamAdapter(groqSTT, vad);

      const session = new voice.AgentSession({
        stt: streamAdaptedSTT,

        llm: new openai.LLM({
          model: 'gpt-4o-mini',
          temperature: 0.3,
        }),

        tts: new openai.TTS({
          model: 'tts-1',
          voice: 'nova',
          speed: 0.9,
        }),

        turnDetection: new livekit.turnDetector.MultilingualModel(),

        vad: vad,

        userData: ctx.proc.userData,
      });

      registerSessionEvents(session);

      const usageCollector = new metrics.UsageCollector();

      session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
        metrics.logMetrics(ev.metrics);
        usageCollector.collect(ev.metrics);
      });

      const logUsage = async () => {
        const summary = usageCollector.getSummary();
        console.log(`Usage: ${JSON.stringify(summary)}`);
      };

      ctx.addShutdownCallback(logUsage);

      const initialContext = llm.ChatContext.empty();

      initialContext.addMessage({
        role: 'assistant',
        content: `Patient promptuary: ${JSON.stringify(ctx.proc.userData.patientPromptuary)}`,
      });

      await ctx.connect();

      ctx.onParticipantConnected((remoteParticipant: RemoteParticipant) => {
        console.log(`Participant ${remoteParticipant} connected at the room ${ctx.room.name}`);
      });

      ctx.addParticipantEntrypoint((job: JobContext, participant: RemoteParticipant) => {
        console.log(`Participant ${participant} entered the job ${job}`);
      });

      await ctx.waitForParticipant();

      registerRoomEvents(ctx.room);

      await session.start({
        agent: new Triage(initialContext),
        room: ctx.room,
        inputOptions: {
          audioEnabled: true,
          videoEnabled: true,
          textEnabled: true,
          textInputCallback,
        },
        outputOptions: {
          audioEnabled: true,
          syncTranscription: true,
          transcriptionEnabled: true,
        },
      });
    } catch (error: Error | unknown) {
      console.error('Fatal error in agent entry:', {
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
      });

      throw error;
    }
  },
});

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: Triage.AGENT_NAME,
    permissions: new WorkerPermissions(true, true, true, false, undefined, false),
  }),
);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing agent.');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing agent.');
  process.exit(0);
});
