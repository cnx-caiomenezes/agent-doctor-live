import { RoomConfiguration } from '@livekit/protocol';

export interface TokenRequest {
  room_name?: string;
  participant_name?: string;
  participant_identity?: string;
  participant_metadata?: string;
  participant_attributes?: Record<string, string>;
  room_config?: ReturnType<RoomConfiguration['toJson']>;

  // Old fields (backwards compatibility)
  roomName?: string;
  participantName?: string;
}

export interface TokenResponse {
  server_url: string;
  participant_token: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  livekit: {
    url: string;
    apiKey: string;
    apiSecret: string;
  };
  auth: {
    apiToken: string;
    jwtSecret: string;
  };
}
