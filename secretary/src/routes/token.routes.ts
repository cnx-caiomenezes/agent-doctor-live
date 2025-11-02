import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { TokenController } from '../controllers/token.controller.js';
import type { TokenRequest } from '../types/index.js';

/**
 * Schema de validação para criação de token
 */
const createTokenSchema = {
  body: {
    type: 'object',
    properties: {
      room_name: { type: 'string' },
      participant_name: { type: 'string' },
      participant_identity: { type: 'string' },
      participant_metadata: { type: 'string' },
      participant_attributes: { type: 'object' },
      room_config: { type: 'object' },
      // Campos antigos (compatibilidade)
      roomName: { type: 'string' },
      participantName: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        server_url: { type: 'string' },
        participant_token: { type: 'string' },
      },
    },
    500: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Plugin de rotas de token
 * @param fastify - Instância Fastify
 * @param options - Opções do plugin
 */
export async function tokenRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
): Promise<void> {
  const tokenController = fastify.tokenController as TokenController;

  // Rota para criar token - requer autenticação (API Token OU JWT)
  fastify.post<{ Body: TokenRequest }>(
    '/createToken',
    {
      schema: createTokenSchema,
      preHandler: fastify.auth([
        // Aceita tanto API Token fixo quanto JWT da secretary
        fastify.verifyApiToken,
        fastify.verifySecretaryJWT,
      ]),
    },
    async (request, reply) => {
      return tokenController.createToken(request, reply);
    },
  );

  // Rota de health check - sem autenticação
  fastify.get('/health', async (request, reply) => {
    // Usa reply helpers do @fastify/sensible
    return reply.send({ status: 'ok', timestamp: new Date().toISOString() });
  });
}
