import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import auth from "@fastify/auth";
import sensible from "@fastify/sensible";
import helmet from "@fastify/helmet";
import type { ServerConfig } from "./types/index.js";
import { TokenService } from "./services/token.service.js";
import { TokenController } from "./controllers/token.controller.js";
import { tokenRoutes } from "./routes/token.routes.js";
import {
  verifyApiToken,
  verifySecretaryJWT,
} from "./middleware/auth.middleware.js";

/**
 * Cria e configura a instância do Fastify
 * @param config - Configuração do servidor
 * @returns Instância configurada do Fastify
 */
export async function buildApp(config: ServerConfig): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info",
      transport:
        process.env.NODE_ENV !== "production"
          ? {
              target: "pino-pretty",
              options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
  });

  // Registro de plugins essenciais
  await fastify.register(helmet);
  await fastify.register(sensible);
  await fastify.register(cors, {
    origin: true, // Permite todas as origens em desenvolvimento
    credentials: true,
  });

  // Registro do plugin JWT
  await fastify.register(jwt, {
    secret: config.auth.jwtSecret,
  });

  // Registro do plugin de autenticação
  await fastify.register(auth);

  // Decora a instância com os métodos de autenticação
  fastify.decorate("verifyApiToken", verifyApiToken);
  fastify.decorate("verifySecretaryJWT", verifySecretaryJWT);

  // Inicializa serviços
  const tokenService = new TokenService(
    config.livekit.apiKey,
    config.livekit.apiSecret
  );

  const tokenController = new TokenController(tokenService, config.livekit.url);

  // Decora a instância Fastify com o controller
  fastify.decorate("tokenController", tokenController);

  // Registro de rotas
  await fastify.register(tokenRoutes, { prefix: "/secretary" });

  // Error handler global
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode || 500;
    const message = error.message || "Erro interno do servidor";

    reply.status(statusCode).send({
      error: true,
      message,
      statusCode,
    });
  });

  return fastify;
}

// Declaração de tipos para decorators
declare module "fastify" {
  interface FastifyInstance {
    tokenController: TokenController;
    verifyApiToken: typeof verifyApiToken;
    verifySecretaryJWT: typeof verifySecretaryJWT;
  }
}
