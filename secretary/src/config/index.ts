import type { ServerConfig } from '../types/index.js';

/**
 * Valida e retorna a configuração do servidor
 * @returns Configuração do servidor
 * @throws Error se variáveis obrigatórias não estiverem definidas
 */
export function getConfig(): ServerConfig {
  const requiredEnvVars = [
    'LIVEKIT_URL',
    'LIVEKIT_API_KEY',
    'LIVEKIT_API_SECRET',
    'API_TOKEN',
    'JWT_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Variável de ambiente ${envVar} não está definida`);
    }
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    livekit: {
      url: process.env.LIVEKIT_URL!,
      apiKey: process.env.LIVEKIT_API_KEY!,
      apiSecret: process.env.LIVEKIT_API_SECRET!,
    },
    auth: {
      apiToken: process.env.API_TOKEN!,
      jwtSecret: process.env.JWT_SECRET!,
    },
  };
}
