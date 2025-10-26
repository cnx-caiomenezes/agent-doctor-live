# Agent Doctor Live

## Visão Geral

Este projeto implementa um agente LiveKit avançado para gerenciar chamadas de vídeo multi-participantes com transcrição em tempo real e geração de dicas contextuais usando LLM.

## Arquitetura

### Princípios de Design Aplicados

#### 1. **SOLID Principles**

- **Single Responsibility**: Cada classe/serviço tem uma única responsabilidade
  - `TranscriptionService`: Apenas gerencia transcrições
  - `TipGenerationService`: Apenas gera dicas com LLM
  - `ChatChannelManager`: Apenas gerencia canais de comunicação

- **Open/Closed**: Extensível sem modificar código existente
  - Novas estratégias de dicas podem ser adicionadas sem alterar o serviço
  - Novos tipos de canais podem ser criados sem modificar o manager

- **Liskov Substitution**: Interfaces bem definidas permitem substituição
  - `TipGenerationStrategy` pode ter múltiplas implementações
  - `ChatChannel` tem diferentes tipos intercambiáveis

- **Interface Segregation**: Interfaces focadas e específicas
  - `EventHandler` é específico para eventos
  - `ChatChannel` define apenas o necessário para comunicação

- **Dependency Inversion**: Dependências via abstrações
  - Serviços dependem de interfaces, não de implementações concretas

#### 2. **Design Patterns**

- **Strategy Pattern**: `TipGenerationService`
  - `ProfessionalTipStrategy`: Estratégia específica para médicos
  - `ClientTipStrategy`: Estratégia específica para pacientes

- **Factory Pattern**: `ChatChannelFactory`
  - Cria `PrivateChatChannel` ou `GeneralChatChannel` conforme necessário
  - Encapsula lógica de criação

- **Builder Pattern**: `MultiParticipantAgentBuilder`
  - API fluente para configuração do agente
  - Validação e valores padrão centralizados

- **Observer Pattern**: Sistema de eventos
  - `EventHandler` para notificações assíncronas
  - Desacoplamento completo entre componentes

## Estrutura do Projeto

```
src/
├── domain/
│   └── types.ts                    # Domain types e interfaces
├── services/
│   ├── transcription.service.ts    # Gerenciamento de transcrições
│   ├── tip-generation.service.ts   # Geração de dicas com LLM
│   └── chat-channel.service.ts     # Gerenciamento de canais
├── agent/
│   └── multi-participant-agent.ts  # Orquestrador principal
└── doctor-agent.ts                 # Entry point
```

## Componentes Principais

### 1. Domain Layer (`src/domain/types.ts`)

Define o modelo de domínio seguindo Domain-Driven Design (DDD):

```typescript
// Enums
- ParticipantRole: DOCTOR | PATIENT | AGENT
- ChatChannelType: PRIVATE | GENERAL
- TipPriority: LOW | MEDIUM | HIGH | CRITICAL

// Interfaces
- Participant: Representa um participante
- TranscriptionMessage: Mensagem transcrita
- TipMessage: Dica gerada pela LLM
- ChatContext: Contexto para processamento
- DomainEvent: União de todos os eventos do sistema
```

### 2. Services Layer

#### TranscriptionService
**Responsabilidade**: Gerenciar transcrições de áudio

```typescript
const service = new TranscriptionService();

// Registrar transcrição
await service.recordTranscription(message);

// Buscar histórico
const recent = service.getRecentTranscriptions(10);
const byParticipant = service.getParticipantTranscriptions('participant-id');
```

**Características**:
- Event-driven: emite eventos para cada transcrição
- Histórico organizado por participante
- Suporte a limpeza e gerenciamento de memória

#### TipGenerationService
**Responsabilidade**: Gerar dicas contextuais com LLM

```typescript
const service = new TipGenerationService(llmInstance);

// Gerar dica para participante específico
const tip = await service.generateTip(context, participant);

// Gerar dicas para todos
const tips = await service.generateTipsForParticipants(context, participants);

// Registrar estratégia customizada
service.registerStrategy(ParticipantRole.CUSTOM, new CustomStrategy(llm));
```

**Características**:
- Strategy Pattern: diferentes estratégias por papel
- Priorização automática baseada em conteúdo
- Prompts otimizados em português

#### ChatChannelManager
**Responsabilidade**: Gerenciar canais de comunicação

```typescript
const manager = new ChatChannelManager(ctx);

// Canal privado (agent → participante)
const privateChannel = manager.getOrCreatePrivateChannel('participant-id');

// Canal geral (visível para todos)
const generalChannel = manager.getOrCreateGeneralChannel(participantIds);

// Enviar dica
await manager.sendTip(tipMessage);

// Broadcast transcrição
await manager.broadcastTranscription(transcriptionMessage);
```

**Características**:
- Factory Pattern para criação de canais
- Gestão automática de ciclo de vida
- Suporte a múltiplos tópicos de dados

### 3. Agent Layer

#### MultiParticipantAgent
**Responsabilidade**: Orquestrar todo o fluxo

```typescript
// Construir com Builder Pattern
const agent = new MultiParticipantAgentBuilder()
  .setLLMModel('gpt-4o-mini')
  .setSTTLanguage('pt-BR')
  .setMaxConversationHistory(20)
  .setTipGenerationInterval(30000)
  .enableNoiseCancellation(true)
  .build(ctx, llmInstance);

// Inicializar
await agent.initialize();

// Registrar participantes
agent.registerParticipant('doc-1', ParticipantRole.DOCTOR, 'Dr. Silva');
agent.registerParticipant('pat-1', ParticipantRole.PATIENT, 'João');

// Processar transcrição
await agent.handleTranscription('doc-1', 'Como está se sentindo?');

// Gerar dicas
await agent.generateAndSendTips();

// Event listeners
agent.addEventListener({
  handle: async (event) => {
    console.log('Event:', event.type);
  },
});

// Shutdown
await agent.shutdown();
```

**Características**:
- Event-driven: emite eventos para todas as ações
- Gerenciamento automático de recursos
- Geração de dicas periódica e por trigger
- Prompts contextualizados por participantes

## Fluxo de Dados

```
┌─────────────┐
│ Participante│
│   (Áudio)   │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│     STT      │ (Speech-to-Text)
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│TranscriptionService│
│ • Armazena         │
│ • Emite evento     │
└────────┬───────────┘
         │
         ├────────────────────┐
         │                    │
         ▼                    ▼
┌────────────────┐   ┌────────────────────┐
│ChatChannelMgr  │   │TipGenerationService│
│(Broadcast)     │   │• Analisa contexto  │
└────────────────┘   │• Gera dicas (LLM)  │
                     └────────┬───────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │ChatChannelMgr  │
                     │(Private Send)  │
                     └────────────────┘
```

## Exemplo de Uso

### 1. Configuração Básica

```typescript
import { defineAgent, type JobContext } from '@livekit/agents';
import { MultiParticipantAgentBuilder } from './agent/multi-participant-agent';
import { ParticipantRole } from './domain/types';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const llm = new openai.LLM({ model: 'gpt-4o-mini' });
    
    const agent = new MultiParticipantAgentBuilder()
      .setTipGenerationInterval(30000)
      .build(ctx, llm);
    
    await ctx.connect();
    await agent.initialize();
    
    // Registrar participantes
    agent.registerParticipant('doctor-1', ParticipantRole.DOCTOR, 'Dr. Silva');
    agent.registerParticipant('patient-1', ParticipantRole.PATIENT, 'João Santos');
    
    // Event handling
    agent.addEventListener({
      handle: async (event) => {
        if (event.type === 'transcription') {
          console.log(`[${event.message.participantRole}]: ${event.message.transcript}`);
        } else if (event.type === 'tip_generated') {
          console.log(`Dica: ${event.tip.content}`);
        }
      },
    });
    
    ctx.addShutdownCallback(() => agent.shutdown());
  },
});
```

### 2. Integração com STT Real-time

```typescript
import * as openai from '@livekit/agents-plugin-openai';

// No entry do agente
const stt = openai.STT.withGroq({ language: 'pt-BR' });

// Processar áudio dos participantes
ctx.room.on('trackSubscribed', (track, publication, participant) => {
  if (track.kind === 'audio') {
    // Stream de áudio → STT → Transcrição
    stt.stream(track.mediaStream).on('transcript', async (result) => {
      await agent.handleTranscription(
        participant.identity,
        result.text,
        result.confidence
      );
    });
  }
});
```

### 3. Custom Tip Strategy

```typescript
import { TipGenerationStrategy } from './services/tip-generation.service';

class NurseTipStrategy implements TipGenerationStrategy {
  constructor(private llm: llm.LLM) {}
  
  async generateTip(context: ChatContext, participant: Participant): Promise<string> {
    // Lógica customizada para enfermeiros
    const prompt = `Gere uma dica para o enfermeiro ${participant.name}...`;
    // ... implementação
  }
  
  getPriority(context: ChatContext): TipPriority {
    return TipPriority.MEDIUM;
  }
}

// Registrar estratégia
tipService.registerStrategy(ParticipantRole.NURSE, new NurseTipStrategy(llm));
```

## Performance e Otimizações

### 1. Memory Management
- Limite configurável de histórico de conversação
- Limpeza automática de participantes desconectados
- Weak references onde apropriado

### 2. Async Operations
- Todas as operações I/O são assíncronas
- Promise.allSettled para operações paralelas
- Proper error boundaries

### 3. Event Throttling
- Geração de dicas periódica configurável
- Debouncing para eventos de alta frequência
- Rate limiting para chamadas LLM

## Testes

### Estrutura de Testes Recomendada

```typescript
// Teste unitário
describe('TranscriptionService', () => {
  it('should record transcription', async () => {
    const service = new TranscriptionService();
    const message = TranscriptionMessageFactory.create(
      participant,
      'Test transcript'
    );
    
    await service.recordTranscription(message);
    
    const history = service.getAllTranscriptions();
    expect(history).toHaveLength(1);
  });
});

// Teste de integração
describe('MultiParticipantAgent', () => {
  it('should generate tips based on conversation', async () => {
    const agent = new MultiParticipantAgentBuilder()
      .build(mockContext, mockLLM);
    
    await agent.handleTranscription('doc-1', 'Patient has fever');
    const tips = await agent.generateAndSendTips();
    
    expect(tips).toBeDefined();
  });
});
```

## Próximos Passos

### 1. **Persistência**
- [ ] Implementar PostgreSQL repository para transcrições
- [ ] Salvar histórico de dicas geradas
- [ ] Armazenar métricas de uso

### 2. **Observabilidade**
- [ ] Integrar Prometheus para métricas
- [ ] Structured logging com Pino
- [ ] Distributed tracing com OpenTelemetry

### 3. **Escalabilidade**
- [ ] Redis para cache de sessões
- [ ] Message queue para processamento assíncrono
- [ ] Load balancing entre múltiplos workers

### 4. **Segurança**
- [ ] Criptografia end-to-end
- [ ] Rate limiting por usuário
- [ ] Auditoria de acessos

## Licença

Este projeto é proprietário da Conexa Saúde.

## Autor

**Caio Menezes**  
Email: caio.menezes@conexasaude.com.br  
Conexa Saúde - https://www.conexasaude.com.br

---
