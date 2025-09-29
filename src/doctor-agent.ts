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
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

dotenv.config({ path: '.env' });

class Assistant extends voice.Agent {
  constructor() {
    super({
      instructions: `You are a helpful voice AI assistant.
      You eagerly assist users with their questions by providing information from your extensive knowledge.
      Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
      You are curious, friendly, and have a sense of humor.`,
      tools: {
        getWeather: llm.tool({
          description: `Use this tool to look up current weather information in the given location.

          If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.`,
          parameters: z.object({
            location: z
              .string()
              .describe('The location to look up weather information for (e.g. city name)'),
          }),
          execute: async ({ location }) => {
            console.log(`Looking up weather for ${location}`);

            return 'sunny with a temperature of 70 degrees.';
          },
        }),
      },
    });
  }
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    // Set up a voice AI pipeline usando apenas texto (sem TTS)
    const session = new voice.AgentSession({
      llm: new openai.LLM({ model: 'gpt-4o-mini' }),
      stt: openai.STT.withGroq(),
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad: ctx.proc.userData.vad! as silero.VAD,
    });

    // Metrics collection, to measure pipeline performance
    // For more information, see https://docs.livekit.io/agents/build/metrics/
    const usageCollector = new metrics.UsageCollector();

    session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      metrics.logMetrics(ev.metrics);
      usageCollector.collect(ev.metrics);
    });

    // Intercepta texto gerado pelo LLM e envia via DataChannel
    session.on(voice.AgentSessionEventTypes.UserInputTranscribed, ({ transcript }) => {
      if (ctx.room && ctx.room.localParticipant) {
        ctx.room.localParticipant.publishData(Buffer.from(transcript), {
          reliable: true,
          topic: 'transcript',
        });

        session.chatCtx.addMessage({ role: 'user', content: transcript });
      }
    });

    session.on(voice.AgentSessionEventTypes.Error, (ev) => {
      console.error('Agent session error:', ev.error);
    });

    const logUsage = async () => {
      const summary = usageCollector.getSummary();
      console.log(`Usage: ${JSON.stringify(summary)}`);
    };

    ctx.addShutdownCallback(logUsage);

    await session.start({
      agent: new Assistant(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
        textEnabled: true,
      },
      outputOptions: {
        transcriptionEnabled: true,
        audioEnabled: false,
      },
    });

    // Join the room and connect to the user
    await ctx.connect();
  },
});

cli.runApp(
  new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    wsURL: process.env.LIVEKIT_URL as string,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    permissions: new WorkerPermissions(true, true, true, true, [], true),
  }),
);
