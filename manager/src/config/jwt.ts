/**
 * JWT Configuration
 *
 * Configures JWT authentication using RS256 algorithm
 * with access and refresh tokens.
 */

import type { FastifyInstance } from "fastify";
import fastifyJWT from "@fastify/jwt";

export async function configureJWT(fastify: FastifyInstance): Promise<void> {
  // Access Token (RS256)
  const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
  const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";

  // Refresh Token (RS256)
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

  if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error(
      "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables are required"
    );
  }

  // Register JWT plugin for access tokens
  await fastify.register(fastifyJWT, {
    secret: {
      private: JWT_ACCESS_SECRET,
      public: JWT_ACCESS_SECRET,
    },
    sign: {
      algorithm: "RS256",
      expiresIn: JWT_ACCESS_EXPIRY,
    },
    verify: {
      algorithms: ["RS256"],
    },
    namespace: "access",
  });

  // Register JWT plugin for refresh tokens
  await fastify.register(fastifyJWT, {
    secret: {
      private: JWT_REFRESH_SECRET,
      public: JWT_REFRESH_SECRET,
    },
    sign: {
      algorithm: "RS256",
      expiresIn: JWT_REFRESH_EXPIRY,
    },
    verify: {
      algorithms: ["RS256"],
    },
    namespace: "refresh",
  });

  fastify.log.info("✅ JWT configured (RS256)");
}
