# Agent Doctor Live - AI-Powered Meeting Platform

Plataforma de videochamadas com IA integrada para atendimentos médicos e reuniões profissionais, oferecendo agente de IA com contexto personalizado por departamento.

## 🏗️ Arquitetura

Esta é uma aplicação monorepo com 5 serviços principais:

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Doctor Live                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Manager    │  │  Secretary   │  │    Agent     │      │
│  │  (Backend)   │  │  (Backend)   │  │  (Backend)   │      │
│  │              │  │              │  │              │      │
│  │ • Entities   │  │ • Scheduling │  │ • AI Context │      │
│  │ • Departments│  │ • Magic Links│  │ • OpenAI     │      │
│  │ • Knowledge  │  │ • Recordings │  │ • Embeddings │      │
│  │              │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │              │
│         └─────────────────┼─────────────────┘              │
│                           │                                │
│                  ┌────────▼─────────┐                      │
│                  │   PostgreSQL     │                      │
│                  │   (pgvector)     │                      │
│                  └──────────────────┘                      │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │     Room     │◄────────┤   LiveKit    │                │
│  │   (React)    │         │    Server    │                │
│  │              │         │              │                │
│  │ • Video/Audio│         │ • WebRTC     │                │
│  │ • Chat       │         │ • Recording  │                │
│  │ • Screenshare│         │ • Webhooks   │                │
│  └──────────────┘         └──────────────┘                │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Redis     │  │    MinIO     │  │   MailHog    │    │
│  │   (Cache)    │  │     (S3)     │  │   (Email)    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Serviços

- **Manager** (`manager/`) - Gerenciamento de entidades, departamentos, profissionais e base de conhecimento
- **Secretary** (`secretary/`) - Agendamento de salas, geração de magic links, integração com LiveKit
- **Agent** (`agent/`) - Agente de IA com contexto personalizado usando OpenAI e embeddings
- **Room** (`room/`) - Cliente React para videochamadas com LiveKit
- **Shared** (`shared/`) - Tipos e schemas TypeScript compartilhados

### Infraestrutura

- **PostgreSQL 16** com extensão pgvector para busca vetorial
- **Redis 7** para cache e pub/sub
- **LiveKit Server** para comunicação WebRTC em tempo real
- **MinIO** para armazenamento S3-compatible (gravações)
- **MailHog** para testes de email em desenvolvimento

## 🚀 Quick Start

### Pré-requisitos

- Node.js 24+
- pnpm 9.15+
- Docker e Docker Compose

### Instalação

```bash
# Clonar repositório
git clone https://github.com/conexasaude/agent-doctor-live.git
cd agent-doctor-live

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp manager/.env.example manager/.env
cp secretary/.env.example secretary/.env
cp agent/.env.example agent/.env
cp room/.env.example room/.env

# Editar arquivos .env com suas configurações
```

### Iniciar Infraestrutura

```bash
# Iniciar serviços Docker (PostgreSQL, Redis, LiveKit, MinIO, MailHog)
docker-compose up -d

# Aguardar serviços ficarem prontos (30 segundos)
sleep 30

# Executar migrações do banco de dados
pnpm db:migrate

# Popular banco com dados de desenvolvimento
pnpm db:seed
```

### Iniciar Aplicação

```bash
# Iniciar todos os serviços em modo desenvolvimento
pnpm dev

# Serviços estarão disponíveis em:
# - Manager:    http://localhost:3000
# - Secretary:  http://localhost:3001
# - Agent:      http://localhost:3003
# - Room:       http://localhost:3002
# - LiveKit:    ws://localhost:7880
# - MinIO UI:   http://localhost:9001
# - MailHog UI: http://localhost:8025
```

### Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Iniciar todos os serviços
pnpm build            # Build de produção
pnpm test             # Executar testes
pnpm lint             # Verificar código com ESLint
pnpm format           # Formatar código com Prettier

# Banco de Dados
pnpm db:migrate       # Executar migrações
pnpm db:seed          # Popular dados de desenvolvimento
pnpm db:reset         # Resetar banco (CUIDADO: apaga tudo)

# Serviços individuais
pnpm dev --filter manager
pnpm dev --filter secretary
pnpm dev --filter agent
pnpm dev --filter room
```

## 📚 Documentação

- [Manager Service](./manager/README.md) - API de gerenciamento de entidades e conhecimento
- [Secretary Service](./secretary/README.md) - API de agendamento e integração LiveKit
- [Agent Service](./agent/README.md) - Configuração e uso do agente de IA
- [Room Client](./room/README.md) - Interface de usuário para videochamadas
- [Data Model](./specs/001-ai-video-platform/data-model.md) - Esquema do banco de dados
- [API Contracts](./specs/001-ai-video-platform/contracts.md) - Documentação de APIs
- [Quick Start Guide](./specs/001-ai-video-platform/quickstart.md) - Guia detalhado de setup

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Testes com coverage
pnpm test:coverage

# Testes de um serviço específico
pnpm test --filter manager
```

## 🛠️ Stack Tecnológica

### Backend
- Node.js 24+ com TypeScript
- Fastify 5 (framework HTTP)
- PostgreSQL 16 com pgvector
- Redis 7
- LiveKit Server SDK
- OpenAI API

### Frontend
- React 18
- Next.js 14
- LiveKit React Components
- TailwindCSS

### Ferramentas
- pnpm (gerenciador de pacotes)
- Docker Compose (infraestrutura local)
- ESLint + Prettier (qualidade de código)
- Zod (validação de schemas)

## 📦 Estrutura do Projeto

```
agent-doctor-live/
├── manager/          # Serviço de gerenciamento
├── secretary/        # Serviço de agendamento
├── agent/            # Serviço de IA
├── room/             # Cliente React
├── shared/           # Tipos compartilhados
├── docker/           # Configurações Docker
├── scripts/          # Scripts utilitários
├── specs/            # Documentação e especificações
├── docker-compose.yml
├── package.json      # Configuração do monorepo
└── pnpm-workspace.yaml
```

## 🤝 Contribuindo

1. Criar branch a partir de `001-ai-video-platform`
2. Fazer alterações seguindo padrões do ESLint/Prettier
3. Adicionar testes para novas funcionalidades
4. Submeter Pull Request

## 📝 Licença

Copyright © 2025 Conexa Saúde
