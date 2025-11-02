import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Verifica se o token de API fixo é válido
 * Para ser usado por outros sistemas em integrações
 */
export async function verifyApiToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiToken = process.env.API_TOKEN;

  if (!apiToken) {
    // Usa httpErrors do @fastify/sensible
    throw reply.internalServerError('API_TOKEN não está configurado no servidor');
  }

  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw reply.unauthorized('Authorization header não fornecido');
  }

  // Suporta formato "Bearer TOKEN" ou apenas "TOKEN"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  if (token !== apiToken) {
    throw reply.unauthorized('Token de API inválido');
  }
}

/**
 * Verifica se o token JWT gerado pela secretary é válido
 */
export async function verifySecretaryJWT(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw reply.unauthorized('Authorization header não fornecido');
    }

    // Suporta formato "Bearer TOKEN" ou apenas "TOKEN"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    // Verifica o JWT usando o método verify do fastify-jwt
    // O @fastify/jwt adiciona o método verify ao fastify instance
    const decoded = await (request as any).jwtVerify();

    if (!decoded) {
      throw reply.unauthorized('Token JWT inválido');
    }

    // O token decodificado fica disponível em request.user
  } catch (error) {
    if (error instanceof Error) {
      throw reply.unauthorized(`Token JWT inválido: ${error.message}`);
    }
    throw reply.unauthorized('Token JWT inválido');
  }
}
