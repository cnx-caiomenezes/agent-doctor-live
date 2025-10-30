# Especificação Técnica — Serviço de Agentes de Voz (LiveKit + Node.js/TypeScript)

## 1) Visão geral

**Objetivo.** Implementar um serviço de agentes de voz em tempo real (conversacionais, multimodais quando necessário) que se conectam a salas LiveKit como participantes programáticos, processam áudio em *streaming* com STT → LLM → TTS e publicam as respostas de volta na mesma sala, suportando também RPC/datachannels, webhooks e egress (gravação/transmissão).

**Escopo.**
- Backend Node.js/TS para **gerar tokens**, **gerenciar salas** e **despachar agentes**.
- **Workers de agente** em Node.js/TS usando **AgentsJS** (LiveKit Agents para JS) conectando-se como participantes e orquestrando STT/LLM/TTS.
  -- **Agents dinamicos** O system message definido no agent deve ser passado dado input de usuario, que deve definir qual a funcao de cada agente naquela room.
     -- Exemplo: Um agente deve executar somente a anamnese de um paciente, coletando informacoes relavantes para o prontuario do paciente, e outro agente deve ser o apoiador do medico na call, dando dicas de possiveis perguntas, lembrando de procedimentos e outras tarefas (caso existente) no prompt fornecido aquele agente.
- **Recebimento de webhooks** de eventos de sala/participantes (join/leave/track) e **verificação criptográfica**.
- **Egress** para gravação (MP4/HLS/RTMP) e **Ingress** opcional (RTMP/WHIP) para ingestão de mídia externa.


**Público-alvo.** Equipes de back-end e SRE. Pré-requisito: Node 20+ (recomenda-se 22), conta LiveKit Cloud ou *self-host*.

---

## 2) Referências-chave

- Agents (conceitos, JS/TS, sessões, RoomIO, exemplos)
- SDK Server JS (RoomService, AccessToken, WebhookReceiver)
- RTC Node SDK (participante programático, RPC/DataChannel)
- Server APIs (Twirp endpoints, grants)
- Webhooks (formato, assinatura JWT, `express.raw`)
- Egress (MP4/HLS/RTMP, Web e Track/Composite) e Ingress (RTMP/WHIP)
- Self‑hosting com Docker Compose e Caddy (portas/TURN)
- Starters e exemplos oficiais (agent-starter-node/react)

---

## 3) Arquitetura

### 3.1 Componentes

1. LiveKit (self-host) — SFU WebRTC, Ingress/Egress, Webhooks.
  1.1. Executando LiveKit localmente: https://docs.livekit.io/home/self-hosting/local/
  1.2. Deployment de LiveKit: https://docs.livekit.io/home/self-hosting/deployment/
  1.3.
2. Auth/Room API (Node/TS) — Gera AccessToken (JWT com grants), cria/lista salas via RoomService e expõe endpoints REST.
3. Agent Dispatcher — Serviço que inicia Agent Workers (processos/containers) e os conecta às salas. Baseado em AgentsJS.
4. Agent Worker (Node/TS) — Executa AgentSession com pipeline STT/LLM/TTS e publica áudio/visão.
5. Webhook Receiver — Endpoint que recebe eventos do LiveKit e valida o token do cabeçalho Authorization.
6. Egress/Ingress Controller — Inicia/encerra gravações ou streaming; cria endpoints RTMP/WHIP para ingestão.

### 3.2 Diagrama (alto nível)

```
[ Client (web/mobile) ] --(WS/TLS WebRTC)--> [ LiveKit ]
       ^                                           ^
       |                                           | Webhooks (signed JWT)
       |                                           v
   (tokens)                                 [ Webhook Receiver ]
       ^                                           ^
       | REST                                      |
 [ Auth/Room API ] ------ RPC/Data ------> [ Agent Worker(s) ]
       |                                         (AgentsJS)
       |---- Egress API ----> gravação/HLS/RTMP
       |---- Ingress API --> RTMP/WHIP -> Sala
```

---

## 4) Fluxos principais

### F1 — Conversa em tempo real (voz)
1) Cliente pede token (`/v1/tokens`) → conecta na sala.
2) Backend cria sala (se preciso) via RoomService.
3) Agent Worker é despachado e conecta-se como participante programático, inicia AgentSession com STT/LLM/TTS.
4) Usuário fala; audio track do usuário é processada, agente responde publicando audio track TTS.
5) Eventos de sala/participantes chegam via webhooks; backend atualiza estado.

### F2 — Gravação/transmissão (Egress)
- Backend chama Egress API (p.ex. `StartRoomCompositeEgress`) para gravar MP4 ou transmitir HLS/RTMP.

### F3 — Ingestão externa (Ingress opcional)
- Backend cria Ingress (RTMP/WHIP) e injeta mídia de OBS/CDNs para a sala.

---

## 5) Requisitos funcionais (RF)

- RF1. Tokens & Permissões.
- RF2. Salas.
- RF3. Agentes.
- RF4. Webhooks.
- RF5. RPC/Data.
- RF6. Egress.
- RF7. Ingress (opcional).

---

## 6) Requisitos não funcionais (RNF)

- RNF1. Latência.
- RNF2. Segurança.
- RNF3. Observabilidade.
- RNF4. Escalabilidade.

---

## 7) API do backend (contratos)

### 7.1 POST `/v1/tokens`
**Descrição:** Gera JWT para um participante conectar na sala.

**Request**
```json
{
  "room": "string",
  "identity": "string",
  "name": "string",
  "canPublish": true,
  "canSubscribe": true,
  "ttl": "2h"
}
```

**Response**
```json
{ "token": "jwt-string", "wsUrl": "wss://<livekit-host>" }
```

### 7.2 POST `/v1/rooms`
Cria uma sala.

### 7.3 POST `/v1/agents`
Despacha um agente para uma sala.

### 7.4 POST `/v1/egress/start`
Inicia egress composto da sala.

### 7.5 Webhooks `POST /v1/webhooks/livekit`
Recebe eventos do LiveKit.

---

## 8) Modelos de dados (TypeScript)

```ts
export interface CreateTokenRequest {
  room: string;
  identity: string;
  name?: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  ttl?: string; // ex: '2h'
}

export interface DispatchAgentRequest {
  room: string;
  instructions: string;
  stt: string;
  llm: string;
  tts: string;
  language?: string; // 'pt-BR'
}
```

---

## 9) Esqueleto de implementação (Node.js + TS)

### 9.1 Token e Room Service (Express)

```ts
import express from 'express';
import { AccessToken, RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';

const app = express();
app.use(express.json());

app.post('/v1/tokens', async (req, res) => {
  const { room, identity } = req.body;
  const at = new AccessToken(API_KEY, API_SECRET, { identity });
  at.addGrant({ roomJoin: true, room });
  const token = await at.toJwt();
  res.json({ token });
});
```

### 9.2 Worker de Agente (AgentsJS)

```ts
import { voice } from '@livekit/agents';
import { AgentSession } from '@livekit/agents';

const session = new voice.AgentSession({ stt, llm, tts });
await session.start({ room: { url: LIVEKIT_URL, token: AGENT_TOKEN }, agent: new voice.Agent({ instructions }) });
```

---

## 10) Configuração & variáveis de ambiente

- LIVEKIT_HOST
- LIVEKIT_URL
- LIVEKIT_API_KEY / LIVEKIT_API_SECRET

---

## 11) Deploy

- LiveKit Cloud ou self-host com Docker Compose.

---

## 12) Segurança

- Tokens curtos.
- Webhook verification.

---

## 13) Observabilidade

- Logs e métricas.

---

## 14) Testes e critérios de aceitação

- Unitários, integração e E2E.

---

## 15) Backlog inicial

- Infra, agentes, RPC, egress, deploy.

---

## 16) Riscos & Mitigações

- Overlap de fala, rede, custos.

---

## 17) Anexos

- Snippets úteis.
