/**
 * Manager Service - Fastify Server
 *
 * Entity/Organization Configuration and User Management
 *
 * Features:
 * - User authentication (JWT RS256)
 * - Entity management (clinics, hospitals, agencies)
 * - Department management
 * - Professional management
 * - Knowledge base uploads and indexing
 *
 * @author Conexa Saúde
 * @version 1.0.0
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { configureDatabase } from "./config/database.js";
import { configureRedis } from "./config/redis.js";
import { configureJWT } from "./config/jwt.js";
import { errorHandler } from "./middleware/error-handler.js";
import { logger } from "./utils/logger.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Environment Variables
// ============================================================
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

// ============================================================
// Create Fastify Instance
// ============================================================
const fastify = Fastify({
  logger: logger,
  trustProxy: true,
  requestIdLogLabel: "reqId",
  disableRequestLogging: false,
  requestIdHeader: "x-request-id",
});

// ============================================================
// Register Plugins
// ============================================================

// Security
fastify.register(helmet, {
  contentSecurityPolicy: NODE_ENV === "production",
});

// CORS
fastify.register(cors, {
  origin: CORS_ORIGINS,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Rate Limiting
fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  redis: undefined, // Will be configured after Redis plugin
});

// File Upload
fastify.register(multipart, {
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || "10485760", 10), // 10MB
  },
});

// Static Files (for uploaded files preview)
fastify.register(fastifyStatic, {
  root: path.join(__dirname, "../uploads"),
  prefix: "/uploads/",
});

// Database
await configureDatabase(fastify);

// Redis
await configureRedis(fastify);

// JWT
await configureJWT(fastify);

// ============================================================
// Global Error Handler
// ============================================================
fastify.setErrorHandler(errorHandler);

// ============================================================
// Health Check Endpoint
// ============================================================
fastify.get("/health", async (request, reply) => {
  const healthcheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    database: 'unknown',
    redis: 'unknown',
  };

  // Check database connection
  try {
    await fastify.pg.query("SELECT 1");
    healthcheck.database = "connected";
  } catch (error) {
    healthcheck.database = "disconnected";
    healthcheck.status = "degraded";
  }

  // Check Redis connection
  try {
    await fastify.redis.ping();
    healthcheck.redis = "connected";
  } catch (error) {
    healthcheck.redis = "disconnected";
    healthcheck.status = "degraded";
  }

  const statusCode = healthcheck.status === "ok" ? 200 : 503;
  return reply.status(statusCode).send(healthcheck);
});

// ============================================================
// Routes (to be implemented)
// ============================================================
// TODO: Register route modules here
// - /api/v1/auth
// - /api/v1/entities
// - /api/v1/departments
// - /api/v1/professionals
// - /api/v1/knowledge-base

// ============================================================
// Graceful Shutdown
// ============================================================
const signals = ["SIGINT", "SIGTERM"];

signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, closing server gracefully...`);

    try {
      await fastify.close();
      fastify.log.info("Server closed successfully");
      process.exit(0);
    } catch (error) {
      fastify.log.error(error, "Error during shutdown");
      process.exit(1);
    }
  });
});

// ============================================================
// Start Server
// ============================================================
async function start(): Promise<void> {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    fastify.log.info(
      `🚀 Manager service listening on http://localhost:${PORT}`
    );
    fastify.log.info(`Environment: ${NODE_ENV}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
