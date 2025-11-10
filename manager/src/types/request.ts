/**
 * TypeScript Type Definitions
 *
 * Custom types for Manager service.
 */

import type { JWTPayload } from "../middleware/auth.js";

// Extend FastifyRequest with user context
declare module "fastify" {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

// Export JWTPayload for convenience
export type { JWTPayload } from "../middleware/auth.js";
