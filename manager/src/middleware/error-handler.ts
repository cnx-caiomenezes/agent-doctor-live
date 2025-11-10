/**
 * Error Handler Middleware
 * 
 * Global error handler for Fastify server.
 * Handles various error types and returns appropriate responses.
 */

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { log } = request;
  
  // Zod Validation Errors
  if (error instanceof ZodError) {
    log.warn({ error: error.errors }, 'Validation error');
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }
  
  // PostgreSQL Errors
  if (error.code?.startsWith('23')) {
    log.warn({ error }, 'Database constraint violation');
    
    // Unique constraint violation
    if (error.code === '23505') {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'A record with this value already exists',
      });
    }
    
    // Foreign key violation
    if (error.code === '23503') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Referenced record does not exist',
      });
    }
    
    // Check constraint violation
    if (error.code === '23514') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Data violates database constraints',
      });
    }
    
    // Generic constraint violation
    return reply.status(400).send({
      error: 'Bad Request',
      message: 'Database constraint violation',
    });
  }
  
  // JWT Errors
  if (error.message?.includes('jwt') || error.message?.includes('token')) {
    log.warn({ error }, 'Authentication error');
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
  
  // Fastify Validation Errors
  if (error.validation) {
    log.warn({ error: error.validation }, 'Request validation error');
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    });
  }
  
  // 404 Not Found
  if (error.statusCode === 404) {
    return reply.status(404).send({
      error: 'Not Found',
      message: 'The requested resource was not found',
    });
  }
  
  // 413 Payload Too Large
  if (error.statusCode === 413) {
    return reply.status(413).send({
      error: 'Payload Too Large',
      message: 'The uploaded file exceeds the maximum allowed size',
    });
  }
  
  // Generic Fastify Errors
  if (error.statusCode && error.statusCode < 500) {
    log.warn({ error }, 'Client error');
    return reply.status(error.statusCode).send({
      error: error.name || 'Bad Request',
      message: error.message,
    });
  }
  
  // Internal Server Errors
  log.error({ error }, 'Internal server error');
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error.message,
  });
}
