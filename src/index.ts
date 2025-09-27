
import { AccessToken, EgressServiceClient, RoomServiceClient } from '@livekit/server-sdk';
import fastify from 'fastify';
import fs from 'fs';
import path from 'path';
import sensible from '@fastify/sensible';
import env from '@fastify/env';
import jwtPlugin from '@fastify/jwt';

const schema = {
  type: 'object',
  required: [
    'LIVEKIT_URL',
    'LIVEKIT_API_KEY',
    'LIVEKIT_API_SECRET',
    'JWT_SECRET',
    'RECORDINGS_DIR',
    'PORT'
  ],
  properties: {
    LIVEKIT_URL: { type: 'string' },
    LIVEKIT_API_KEY: { type: 'string' },
    LIVEKIT_API_SECRET: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    RECORDINGS_DIR: { type: 'string' },
    PORT: { type: 'string', default: '3000' }
  }
};

const options = {
  confKey: 'config',
  schema,
  dotenv: true
};


declare module 'fastify' {
  interface FastifyInstance {
    config: {
      LIVEKIT_URL: string;
      LIVEKIT_API_KEY: string;
      LIVEKIT_API_SECRET: string;
      JWT_SECRET: string;
      RECORDINGS_DIR: string;
      PORT: string;
    };
  }
}

async function buildServer() {
  const app = fastify({ logger: true });

  await app.register(env, options);
  await app.register(sensible);
  await app.register(jwtPlugin, { secret: app.config.JWT_SECRET });

  const LIVEKIT_URL = app.config.LIVEKIT_URL;
  const LIVEKIT_API_KEY = app.config.LIVEKIT_API_KEY;
  const LIVEKIT_API_SECRET = app.config.LIVEKIT_API_SECRET;
  const RECORDINGS_DIR = app.config.RECORDINGS_DIR;

  const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
  const egressService = new EgressServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }

  app.post('/room', async (request, reply) => {
    const { name } = request.body as { name: string };
    try {
      await roomService.createRoom({ name, maxParticipants: 2 });
      return reply.code(201).send({ message: 'Sala criada', name });
    } catch (err) {
      app.log.error(err);
      return reply.internalServerError('Erro ao criar sala');
    }
  });

  app.post('/token', async (request, reply) => {
    const { identity, room } = request.body as { identity: string; room: string };
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      room,
    });
    return reply.send({ token: token.toJwt() });
  });

  app.post('/record/start', async (request, reply) => {
    const { room, participant } = request.body as { room: string; participant: string };
    try {
      const result = await egressService.startTrackEgress({
        roomName: room,
        trackId: participant,
        output: {
          file: {
            filepath: path.join(RECORDINGS_DIR, `${room}_${participant}_${Date.now()}.wav`),
          },
        },
        audioOnly: true,
      });
      return reply.send({ message: 'Gravação iniciada', egressId: result.egressId });
    } catch (err) {
      app.log.error(err);
      return reply.internalServerError('Erro ao iniciar gravação');
    }
  });

  app.post('/record/stop', async (request, reply) => {
    const { egressId } = request.body as { egressId: string };
    try {
      await egressService.stopEgress(egressId);
      return reply.send({ message: 'Gravação finalizada' });
    } catch (err) {
      app.log.error(err);
      return reply.internalServerError('Erro ao finalizar gravação');
    }
  });

  app.post('/openai/process', async (request, reply) => {
    // Implementação depende da API OpenAI
    return reply.send({ message: 'Processamento OpenAI não implementado' });
  });

  return app;
}

buildServer().then(app => {
  app.listen({ port: Number(app.config.PORT), host: '0.0.0.0' }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    app.log.info(`Servidor LiveKit backend rodando em ${address}`);
  });
});
