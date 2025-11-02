# Autenticação - Secretary API

## Visão Geral

A Secretary API implementa dois métodos de autenticação usando `@fastify/auth`:

1. **API Token Fixo** - Para integrações entre sistemas
2. **JWT da Secretary** - Para tokens gerados pela própria aplicação

## Configuração

### Variáveis de Ambiente

Adicione ao seu `.env.local`:

```bash
# Token fixo para autenticação de APIs (gere um token seguro)
API_TOKEN=seu-token-secreto-aqui

# Secret para assinar tokens JWT
JWT_SECRET=seu-jwt-secret-aqui
```

**Gerando tokens seguros:**

```bash
# Gerar API_TOKEN
openssl rand -hex 32

# Gerar JWT_SECRET
openssl rand -hex 64
```

## Métodos de Autenticação

### 1. API Token Fixo

Usado para integrações entre sistemas. O token é validado comparando com o valor em `API_TOKEN`.

**Headers:**
```http
Authorization: Bearer seu-token-api-aqui
```

ou

```http
Authorization: seu-token-api-aqui
```

**Exemplo com curl:**
```bash
curl -X POST http://localhost:3000/secretary/createToken \
  -H "Authorization: Bearer seu-token-api-aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "room_name": "minha-sala",
    "participant_name": "usuario-123"
  }'
```

### 2. JWT da Secretary

Tokens JWT gerados e assinados pela própria secretary usando `JWT_SECRET`.

**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exemplo com curl:**
```bash
curl -X POST http://localhost:3000/secretary/createToken \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "room_name": "minha-sala",
    "participant_name": "usuario-123"
  }'
```

## Rotas Protegidas

### POST `/secretary/createToken`

**Autenticação:** Requerida (API Token OU JWT)

Cria um token de acesso LiveKit. Aceita qualquer um dos métodos de autenticação.

**Request:**
```json
{
  "room_name": "sala-exemplo",
  "participant_name": "usuario-123"
}
```

**Response:**
```json
{
  "server_url": "wss://your-livekit-server.livekit.cloud",
  "participant_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### GET `/secretary/health`

**Autenticação:** Não requerida

Verifica o status do servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T12:00:00.000Z"
}
```

## Erros de Autenticação

### Sem Authorization Header

```json
{
  "error": true,
  "message": "Authorization header não fornecido",
  "statusCode": 500
}
```

### Token Inválido

```json
{
  "error": true,
  "message": "Token de API inválido",
  "statusCode": 500
}
```

ou

```json
{
  "error": true,
  "message": "Token JWT inválido: ...",
  "statusCode": 500
}
```

## Implementação

### Middleware de Autenticação

Localizado em `src/middleware/auth.middleware.ts`:

- `verifyApiToken()` - Valida token fixo contra `process.env.API_TOKEN`
- `verifySecretaryJWT()` - Valida JWT usando `@fastify/jwt`

### Configuração no App

Em `src/app.ts`:

```typescript
// Registro do plugin JWT
await fastify.register(jwt, {
  secret: config.auth.jwtSecret,
});

// Registro do plugin de autenticação
await fastify.register(auth);

// Decoradores de autenticação
fastify.decorate('verifyApiToken', verifyApiToken);
fastify.decorate('verifySecretaryJWT', verifySecretaryJWT);
```

### Uso nas Rotas

Em `src/routes/token.routes.ts`:

```typescript
fastify.post('/createToken', {
  schema: createTokenSchema,
  preHandler: fastify.auth([
    // Aceita API Token OU JWT (apenas um precisa passar)
    fastify.verifyApiToken,
    fastify.verifySecretaryJWT,
  ]),
}, handler);
```

## Segurança

### Boas Práticas

1. **Nunca** commit `.env.local` no git
2. **Sempre** use HTTPS em produção
3. **Rotacione** `API_TOKEN` e `JWT_SECRET` regularmente
4. **Use** tokens longos e aleatórios (mínimo 32 bytes)
5. **Configure** CORS adequadamente em produção

### Recomendações de Produção

```typescript
// Em produção, configure CORS específico
await fastify.register(cors, {
  origin: ['https://seu-dominio.com'],
  credentials: true,
});
```

## Testando Autenticação

### 1. Sem autenticação (deve falhar)

```bash
curl -X POST http://localhost:3000/secretary/createToken \
  -H "Content-Type: application/json" \
  -d '{"room_name": "test", "participant_name": "user"}'
```

### 2. Com API Token

```bash
curl -X POST http://localhost:3000/secretary/createToken \
  -H "Authorization: Bearer SEU_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"room_name": "test", "participant_name": "user"}'
```

### 3. Health check (não requer auth)

```bash
curl http://localhost:3000/secretary/health
```
