/**
 * Authentication Middleware
 * 
 * JWT verification, RBAC, and entity ownership validation.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

// User roles enum matching database
export enum UserRole {
  MANAGER = 'MANAGER',
  ENTITY_ADMIN = 'ENTITY_ADMIN',
  PROFESSIONAL = 'PROFESSIONAL',
}

// JWT payload interface
export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  entityId: number | null;
  iat: number;
  exp: number;
}

// Extend FastifyRequest with user context
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify({ namespace: 'access' });
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired access token',
    });
  }
}

/**
 * Require specific roles
 */
export function requireRoles(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

/**
 * Require entity ownership or MANAGER role
 */
export async function requireEntityOwnership(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }
  
  // MANAGER has access to all entities
  if (request.user.role === UserRole.MANAGER) {
    return;
  }
  
  // Extract entityId from request (params, body, or query)
  const entityId =
    (request.params as any)?.entityId ||
    (request.body as any)?.entityId ||
    (request.query as any)?.entityId;
  
  if (!entityId) {
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Entity ID is required',
    });
  }
  
  // Verify user belongs to the entity
  if (request.user.entityId !== parseInt(entityId, 10)) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'You do not have access to this entity',
    });
  }
}
