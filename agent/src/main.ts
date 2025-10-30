import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  WorkerPermissions,
  cli,
  defineAgent,
  llm,
  metrics,
  voice,
} from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { getPatientPromptuary } from './agent/pre-warm/getPatientPromptuary';
import { Triage } from './agent/triage.agent';

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
    const session = new voice.AgentSession({
      stt: new deepgram.STT({
        model: 'nova-3',
        language: 'pt-BR',
        profanityFilter: true,
      }),

      llm: new openai.LLM({
        model: 'gpt-4o-mini',
        temperature: 0.3,
      }),

      tts: new openai.TTS({
        model: 'tts-1',
        voice: 'nova',
      }),

      turnDetection: new livekit.turnDetector.MultilingualModel(),

      vad: ctx.proc.userData.vad! as silero.VAD,

      userData: ctx.proc.userData,
    });

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
      content: `The user name is ${ctx.proc.userData.name ?? 'test'}`,
    });

    await session.start({
      agent: new Triage(initialContext),
      room: ctx.room,
    });

    await ctx.connect();
  },
});

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: Triage.AGENT_NAME,
    permissions: new WorkerPermissions(true, true, true, false, undefined, false),
    workerType: 0, // JT_ROOM,
  }),
);
