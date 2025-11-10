/**
 * Database Configuration
 *
 * Configures PostgreSQL connection using @fastify/postgres plugin
 * with connection pooling and error handling.
 */

import type { FastifyInstance } from "fastify";
import fastifyPostgres from "@fastify/postgres";

export async function configureDatabase(
  fastify: FastifyInstance
): Promise<void> {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  await fastify.register(fastifyPostgres, {
    connectionString: DATABASE_URL,
    pool: {
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  });

  fastify.log.info("✅ PostgreSQL connected");
}
