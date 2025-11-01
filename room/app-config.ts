import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Conexa Saúde',
  pageTitle: 'Conexa Saúde Doctor Live',
  pageDescription: 'A voice agent built with Conexa Saúde',
  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,
  logo: '/conexa.svg',
  accent: '#3CB4E7', // Cor primária Conexa
  logoDark: '/conexa.svg',
  accentDark: '#1075A0', // Cor secundária Conexa
  startButtonText: 'Iniciar consulta',
  agentName: 'triage-agent',
};
