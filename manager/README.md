# Manager Service

Serviço de gerenciamento centralizado responsável por configurar entidades, departamentos, profissionais e base de conhecimento para o Agent Doctor Live.

## 🎯 Responsabilidades

- **Gerenciamento de Entidades**: Clínicas, empresas e organizações
- **Departamentos**: Organização por especialidades médicas ou áreas profissionais
- **Profissionais**: Cadastro de médicos, designers, consultores
- **Base de Conhecimento**: Upload e processamento de documentos com embeddings vetoriais
- **Autenticação**: Login e controle de acesso (JWT RS256)

## 🏗️ Arquitetura

### Camadas

```
Controller → Service → Repository → Database
    ↓          ↓           ↓         ↓
   DTO    →   DTO    →  Entity → PostgreSQL
```

### Stack

- **Fastify 5**: Framework HTTP com validação de schemas
- **PostgreSQL**: Banco principal com extensão pgvector
- **Redis**: Cache e sessões
- **Zod**: Validação de schemas e tipos
- **bcrypt**: Hash de senhas
- **JWT**: Autenticação com RS256

## 🚀 Instalação

```bash
# Navegar para o diretório do serviço
cd manager

# Instalar dependências (ou usar pnpm install na raiz)
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env

# Editar .env com suas configurações
nano .env
```

### Variáveis de Ambiente

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agent_doctor_live

# Redis
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=manager:

# JWT (gerar com: openssl genrsa -out private.pem 2048)
JWT_ACCESS_SECRET=<sua-chave-privada-RS256>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=<sua-chave-privada-refresh>
JWT_REFRESH_EXPIRY=7d

# AWS S3 / MinIO
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
AWS_S3_BUCKET=conexa-knowledge
AWS_S3_ENDPOINT=http://localhost:9000

# OpenAI (para embeddings)
OPENAI_API_KEY=<sua-chave-openai>
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=768

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIMEWINDOW=60000
```

## 🎮 Comandos

```bash
# Desenvolvimento com hot reload
pnpm dev

# Build de produção
pnpm build

# Iniciar produção
pnpm start

# Testes
pnpm test
pnpm test:watch

# Banco de dados
pnpm db:migrate
pnpm db:seed
pnpm db:reset
```

## 📡 API Endpoints

### Autenticação

#### `POST /api/v1/auth/register`
Registrar novo usuário (MANAGER ou ENTITY_ADMIN).

**Body:**
```json
{
  "email": "admin@clinica.com",
  "password": "SenhaSegura123!",
  "role": "ENTITY_ADMIN",
  "entityId": 1
}
```

**Response: 201 Created**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@clinica.com",
    "role": "ENTITY_ADMIN",
    "entityId": 1
  }
}
```

#### `POST /api/v1/auth/login`
Fazer login.

**Body:**
```json
{
  "email": "admin@clinica.com",
  "password": "SenhaSegura123!"
}
```

**Response: 200 OK**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@clinica.com",
    "role": "ENTITY_ADMIN",
    "entityId": 1
  }
}
```

#### `POST /api/v1/auth/refresh`
Renovar access token.

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Entidades

#### `GET /api/v1/entities`
Listar entidades (MANAGER vê todas, ENTITY_ADMIN vê apenas a sua).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response: 200 OK**
```json
[
  {
    "id": 1,
    "name": "Clínica Cardio Saúde",
    "type": "medical_clinic",
    "maxParticipants": 50,
    "defaultInstructions": "Foco em atendimento cardiológico...",
    "createdAt": "2025-01-08T10:00:00.000Z"
  }
]
```

#### `POST /api/v1/entities`
Criar nova entidade (apenas MANAGER).

**Body:**
```json
{
  "name": "Clínica Nova",
  "type": "medical_clinic",
  "maxParticipants": 50,
  "defaultInstructions": "Instruções padrão para IA..."
}
```

#### `PUT /api/v1/entities/:id`
Atualizar entidade.

#### `DELETE /api/v1/entities/:id`
Deletar entidade (apenas MANAGER).

### Departamentos

#### `GET /api/v1/departments`
Listar departamentos da entidade.

#### `POST /api/v1/departments`
Criar departamento.

**Body:**
```json
{
  "entityId": 1,
  "name": "Cardiologia",
  "customInstructions": "Instruções específicas para cardiologia..."
}
```

#### `PUT /api/v1/departments/:id`
Atualizar departamento.

#### `DELETE /api/v1/departments/:id`
Deletar departamento.

### Profissionais

#### `GET /api/v1/professionals`
Listar profissionais.

#### `POST /api/v1/professionals`
Criar profissional.

**Body:**
```json
{
  "name": "Dr. João Silva",
  "email": "joao.silva@clinica.com",
  "crm": "123456-SP",
  "specialty": "Cardiologia",
  "entityIds": [1]
}
```

#### `PUT /api/v1/professionals/:id`
Atualizar profissional.

#### `DELETE /api/v1/professionals/:id`
Deletar profissional.

### Base de Conhecimento

#### `POST /api/v1/knowledge`
Upload de documento para base de conhecimento.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file`: PDF (máx 10MB)
- `departmentId`: ID do departamento (opcional)
- `entityId`: ID da entidade

**Response: 202 Accepted**
```json
{
  "id": "kb-uuid-123",
  "filename": "protocolo-cardiologia.pdf",
  "status": "processing",
  "departmentId": 1,
  "entityId": 1
}
```

#### `GET /api/v1/knowledge`
Listar documentos da base de conhecimento.

#### `DELETE /api/v1/knowledge/:id`
Deletar documento.

## 🔐 Autenticação

O Manager usa JWT com RS256 (chaves assimétricas).

### Gerar Chaves

```bash
# Gerar chave privada
openssl genrsa -out private.pem 2048

# Extrair chave pública
openssl rsa -in private.pem -outform PEM -pubout -out public.pem

# Copiar conteúdo para .env
cat private.pem  # JWT_ACCESS_SECRET
cat public.pem   # Pode ser usado por outros serviços para validar tokens
```

### Proteção de Rotas

Todas as rotas (exceto `/auth/login` e `/auth/register`) requerem header `Authorization: Bearer <token>`.

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Testes com coverage
pnpm test:coverage

# Testes em watch mode
pnpm test:watch
```

### Estrutura de Testes

```
src/
├── controllers/
│   └── auth.controller.test.ts
├── services/
│   └── auth.service.test.ts
└── repositories/
    └── user.repository.test.ts
```

## 📊 Logging

O serviço usa `pino` para logging estruturado:

```typescript
fastify.log.info({ userId: 1 }, 'User logged in');
fastify.log.error({ error: err }, 'Failed to create entity');
```

Logs em desenvolvimento são prettificados. Em produção, saem em JSON.

## 🐳 Docker

```bash
# Build da imagem
docker build -t conexa/manager:latest .

# Rodar container
docker run -p 3000:3000 --env-file .env conexa/manager:latest
```

## 📝 Licença

Copyright © 2025 Conexa Saúde
