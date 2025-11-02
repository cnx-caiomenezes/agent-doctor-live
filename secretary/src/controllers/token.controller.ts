import type { FastifyReply, FastifyRequest } from "fastify";
import type { TokenRequest, TokenResponse } from "../types/index.js";
import { TokenService } from "../services/token.service.js";

export class TokenController {
  private readonly tokenService: TokenService;
  private readonly livekitUrl: string;

  constructor(tokenService: TokenService, livekitUrl: string) {
    this.tokenService = tokenService;
    this.livekitUrl = livekitUrl;
  }

  /**
   * Handler para criação de token
   * @param request - Requisição Fastify
   * @param reply - Resposta Fastify
   */
  async createToken(
    request: FastifyRequest<{ Body: TokenRequest }>,
    reply: FastifyReply
  ): Promise<TokenResponse> {
    try {
      const body = request.body ?? {};

      const normalizedRequest = this.tokenService.applyDefaults(body);
      const token = await this.tokenService.createToken(normalizedRequest);

      return {
        server_url: this.livekitUrl,
        participant_token: token,
      };
    } catch (error: Error | unknown) {
      request.log.error(`Erro ao gerar token. Erro: ${(error as Error).message}`);
      // Usa httpErrors do @fastify/sensible para erros internos
      throw reply.internalServerError('Erro ao gerar token LiveKit');
    }
  }
}
