import { RoomConfiguration } from '@livekit/protocol';
import { AccessToken } from 'livekit-server-sdk';
import type { TokenRequest } from '../types/index.js';

export class TokenService {
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Cria um token de acesso para LiveKit
   * @param request - Dados da solicitação de token
   * @returns Token JWT assinado
   */
  async createToken(request: TokenRequest): Promise<string> {
    const roomName = request.room_name ?? request.roomName!;
    const participantName = request.participant_name ?? request.participantName!;

    const accessToken = new AccessToken(this.apiKey, this.apiSecret, {
      identity: participantName,
      // Token expira após 10 minutos
      ttl: '10m',
    });

    // Permissões do token baseadas nas capacidades desejadas do participante
    accessToken.addGrant({
      roomJoin: true,
      room: roomName,
      canUpdateOwnMetadata: true,
    });

    // Configurações opcionais
    if (request.participant_identity) {
      accessToken.identity = request.participant_identity;
    }

    if (request.participant_metadata) {
      accessToken.metadata = request.participant_metadata;
    }

    if (request.participant_attributes) {
      accessToken.attributes = request.participant_attributes;
    }

    if (request.room_config) {
      accessToken.roomConfig = RoomConfiguration.fromJson(request.room_config);
    }

    return accessToken.toJwt();
  }

  /**
   * Aplica valores padrão para sala e participante se não fornecidos
   * @param request - Solicitação original
   * @returns Solicitação com valores padrão aplicados
   */
  applyDefaults(request: TokenRequest): TokenRequest {
    const normalized = { ...request };

    if (!normalized.roomName && !normalized.room_name) {
      normalized.roomName = `room-${crypto.randomUUID()}`;
    }

    if (!normalized.participantName && !normalized.participant_name) {
      normalized.participantName = `user-${crypto.randomUUID()}`;
    }

    return normalized;
  }
}
