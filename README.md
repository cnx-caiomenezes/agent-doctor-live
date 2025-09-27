# Boilerplate LiveKit Node.js

## Visão Geral

Este projeto implementa um backend Node.js para videochamadas com LiveKit, gravação de áudio individual dos participantes e integração com OpenAI RealTime API, conforme as melhores práticas da documentação oficial.

### Estrutura

- `voice-agent/` — Backend principal (TypeScript)
- `setup.sh` — Script de provisionamento do ambiente
- `copilot-instructions.md` — Guia para agentes AI
- `README.md` — Este documento
- `recordings/` — Áudios gravados (criado automaticamente)

## Principais Funcionalidades

- Criação de salas LiveKit limitadas a 2 participantes
- Gravação de áudio individual via Egress API
- Salvamento dos arquivos `.wav` localmente após o término da reunião
- Autenticação JWT para participantes
- Integração opcional com OpenAI RealTime API para pós-processamento

## Como Usar

1. Execute `setup.sh` para instalar dependências e preparar o ambiente Node.js 24+.
2. Configure o LiveKit server (self-hosted) conforme [LiveKit Docs](https://docs.livekit.io/).
3. Ajuste variáveis de ambiente em `.env` dentro de `voice-agent/` (exemplo: URL do LiveKit, JWT secret, diretório de gravação).
4. Inicie o backend com `pnpm start` dentro de `voice-agent/`.

## Referências

- [LiveKit Docs](https://docs.livekit.io/)
- [LiveKit Egress API](https://docs.livekit.io/egress/)
- [OpenAI RealTime API](https://platform.openai.com/docs/realtime)

## Observações

- O diretório `recordings/` será criado automaticamente para armazenar os áudios.
- Logs e notificações de início/fim de gravação são emitidos no console.
- Para produção, restrinja permissões de acesso ao diretório de gravações.
