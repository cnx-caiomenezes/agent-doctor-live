<a href="https://livekit.io/">
  <img src="./.github/assets/livekit-mark.png" alt="LiveKit logo" width="100" height="100">
</a>

# Conexa Secretary - Token Server

<p>
  <a href="https://docs.livekit.io">LiveKit Docs</a>
  •
  <a href="https://livekit.io/cloud">LiveKit Cloud</a>
  •
  <a href="./ARCHITECTURE.md">Architecture Guide</a>
</p>

Um servidor de tokens LiveKit moderno construído com **Fastify v5**, **TypeScript** e arquitetura modular.

## ✨ Características

- ⚡ **Fastify v5** - Framework web ultra-rápido e de baixa sobrecarga
- 🏗️ **Arquitetura Modular** - Separação clara de responsabilidades (Config, Services, Controllers, Routes)
- 🔒 **Type-Safe** - TypeScript strict mode em toda a aplicação
- ✅ **Validação Automática** - JSON Schema para validação de requests/responses
- 📝 **Logging Estruturado** - Pino logger integrado ao Fastify
- 🔄 **Hot Reload** - Desenvolvimento com tsx watch
- 🧪 **Testável** - Arquitetura que facilita testes unitários

## 🚀 Quick Start

### Instalação

```bash
# Clone o repositório
cd secretary

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais LiveKit
```

### Desenvolvimento

```bash
# Inicia o servidor com hot reload
pnpm dev
```

### Produção

```bash
# Build da aplicação
pnpm build

# Inicia o servidor
pnpm start
```

## 📁 Estrutura do Projeto

```
src/
├── config/              # Configurações e variáveis de ambiente
├── controllers/         # Controllers HTTP
├── middleware/          # Middlewares de autenticação
├── routes/              # Definição de rotas e schemas
├── services/            # Lógica de negócio
├── types/               # Tipos TypeScript
├── app.ts               # Configuração do Fastify
└── main.ts              # Ponto de entrada
```

Para mais detalhes, veja o [Guia de Arquitetura](./ARCHITECTURE.md) e [Guia de Autenticação](./AUTHENTICATION.md).

## 🔧 Configuração

Crie um arquivo `.env.local` baseado no `.env.example`:

```env
# LiveKit Configuration (obrigatório)
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# Authentication (obrigatório)
API_TOKEN=seu-token-api-seguro
JWT_SECRET=seu-jwt-secret-seguro

# Server Configuration (opcional)
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
```

**Gerando tokens seguros:**

```bash
# Gerar API_TOKEN
openssl rand -hex 32

# Gerar JWT_SECRET
openssl rand -hex 64
```

Você também pode usar o LiveKit CLI para configurar automaticamente:

```bash
lk app env
```

## 📡 API Endpoints

### `POST /secretary/createToken`

**🔒 Autenticação:** Requerida (API Token ou JWT)

Cria um token de acesso para participar de uma sala LiveKit.

**Headers:**
```http
Authorization: Bearer seu-token-aqui
```

**Body:**
```json
{
  "room_name": "sala-exemplo",
  "participant_name": "usuario-123"
}
```

**Response:**
```json
{
  "server_url": "wss://your-server.livekit.cloud",
  "participant_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### `GET /secretary/health`

**🔓 Autenticação:** Não requerida

Verifica o status do servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-01T12:00:00.000Z"
}
```

## 🏗️ Arquitetura

Esta aplicação segue uma arquitetura em camadas:

1. **Config** - Gerenciamento de configuração
2. **Services** - Lógica de negócio pura
3. **Controllers** - Orquestração de requisições
4. **Routes** - Definição de endpoints e validação
5. **App** - Configuração do Fastify
6. **Main** - Inicialização do servidor

Veja mais detalhes no [Guia de Arquitetura](./ARCHITECTURE.md).

## 🛠️ Tecnologias

- **[Fastify](https://fastify.dev/)** v5 - Framework web
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[LiveKit Server SDK](https://docs.livekit.io/)** - Geração de tokens
- **[Pino](https://getpino.io/)** - Logging estruturado
- **[tsx](https://github.com/privatenumber/tsx)** - TypeScript execution

## 📚 Documentação

- [Fastify Documentation](https://fastify.dev/docs/v5.2.x/)
- [LiveKit Docs](https://docs.livekit.io/)
- [Architecture Guide](./ARCHITECTURE.md)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença Apache 2.0. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

# Implementação do @fastify/sensible

## ✅ O que foi implementado

O plugin `@fastify/sensible` foi instalado e integrado em toda a aplicação Secretary, fornecendo utilitários sensatos e consensuais para Fastify.

## 📦 Instalação

```bash
pnpm add @fastify/sensible
```

## 🎯 Funcionalidades Implementadas

### 1. HTTP Errors (reply helpers)

Todos os middlewares de autenticação agora usam os helpers de erro do `@fastify/sensible`:

**Antes:**
```typescript
throw new Error('Authorization header não fornecido');
```

**Depois:**
```typescript
throw reply.unauthorized('Authorization header não fornecido');
```

**Helpers disponíveis:**

#### 4xx Errors
- `reply.badRequest()` - 400
- `reply.unauthorized()` - 401
- `reply.forbidden()` - 403
- `reply.notFound()` - 404
- `reply.methodNotAllowed()` - 405
- `reply.notAcceptable()` - 406
- `reply.conflict()` - 409
- `reply.gone()` - 410
- `reply.tooManyRequests()` - 429
- E muitos outros...

#### 5xx Errors
- `reply.internalServerError()` - 500
- `reply.notImplemented()` - 501
- `reply.badGateway()` - 502
- `reply.serviceUnavailable()` - 503
- `reply.gatewayTimeout()` - 504

### 2. HTTP Errors (fastify.httpErrors)

Também disponível via `fastify.httpErrors`:

```typescript
// Exemplo de rota que lança erro
fastify.get('/example-error', async (request, reply) => {
  throw fastify.httpErrors.notImplemented('Esta rota ainda não foi implementada');
});
```

### 3. Assert Utilities

O `@fastify/sensible` adiciona `fastify.assert()` para validações:

```typescript
// Valida condição e lança erro HTTP se falhar
fastify.assert(condition, 400, 'Mensagem de erro');

// Também disponível:
fastify.assert.ok(value)
fastify.assert.equal(a, b)
fastify.assert.notEqual(a, b)
fastify.assert.strictEqual(a, b)
fastify.assert.deepEqual(a, b)
```

### 4. To (Async/Await Helper)

Wrapper para tratamento de erros sem try-catch:

```typescript
const [err, user] = await fastify.to(
  db.findOne({ user: 'tyrion' })
);

if (err) {
  // trata erro
}
```

### 5. Request Helpers

#### request.forwarded()
```typescript
fastify.get('/', (req, reply) => {
  reply.send(req.forwarded());
});
```

#### request.is()
```typescript
fastify.get('/', (req, reply) => {
  reply.send(req.is(['html', 'json']));
});
```

### 6. Reply Helpers

#### reply.vary()
```typescript
fastify.get('/', (req, reply) => {
  reply.vary('Accept');
  reply.send('ok');
});
```

#### Cache Control Helpers

```typescript
// Cache público
reply.cacheControl('public');
reply.cacheControl('max-age', 42);
reply.cacheControl('max-age', '1d'); // usa ms format

// Prevenir cache
reply.preventCache(); // 'no-store, max-age=0, private'

// Revalidação
reply.revalidate(); // 'max-age=0, must-revalidate'

// Cache estático
reply.staticCache(42); // 'public, max-age=42, immutable'

// Stale content
reply.stale('while-revalidate', 42);
reply.stale('if-error', 1);

// Max age
reply.maxAge(86400);
reply.stale('while-revalidate', 42);
```

## 📝 Arquivos Modificados

### 1. `src/app.ts`
```typescript
import sensible from "@fastify/sensible";

// Registro do plugin (deve ser um dos primeiros)
await fastify.register(sensible);
```

### 2. `src/middleware/auth.middleware.ts`

**Antes:**
```typescript
throw new Error('Authorization header não fornecido');
```

**Depois:**
```typescript
throw reply.unauthorized('Authorization header não fornecido');
throw reply.internalServerError('API_TOKEN não está configurado');
```

### 3. `src/controllers/token.controller.ts`

**Antes:**
```typescript
throw error;
```

**Depois:**
```typescript
throw reply.internalServerError('Erro ao gerar token LiveKit');
```

### 4. `src/routes/token.routes.ts`

Adicionada rota de exemplo:
```typescript
fastify.get('/example-error', async (request, reply) => {
  throw fastify.httpErrors.notImplemented('Esta rota ainda não foi implementada');
});
```

### 5. `src/services/token.service.ts`

Renomeado método `normalizeRequest()` para `applyDefaults()` (melhor semântica).

## 🚀 Exemplos de Uso

### Erro de Autenticação

```bash
curl http://localhost:3000/secretary/createToken
```

**Resposta (401):**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Authorization header não fornecido"
}
```

### Rota Não Implementada

```bash
curl http://localhost:3000/secretary/example-error
```

**Resposta (501):**
```json
{
  "statusCode": 501,
  "error": "Not Implemented",
  "message": "Esta rota ainda não foi implementada"
}
```

### Erro Interno

```bash
curl -X POST http://localhost:3000/secretary/createToken \
  -H "Authorization: Bearer valid-token" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

**Resposta (500):**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Erro ao gerar token LiveKit"
}
```

## 📚 Benefícios

1. **Códigos de status HTTP consistentes** - Todos os erros usam os códigos corretos
2. **Mensagens de erro padronizadas** - Formato JSON consistente
3. **Menos código boilerplate** - Helpers reduzem código repetitivo
4. **Type-safe** - Totalmente tipado com TypeScript
5. **Testável** - Erros HTTP são facilmente testáveis
6. **Documentável** - Erros podem ser documentados em schemas

## 🔗 Referências

- [Documentação oficial do @fastify/sensible](https://github.com/fastify/fastify-sensible)
- [HTTP Status Codes](https://httpstatuses.com/)
- [Fastify Error Handling](https://fastify.dev/docs/latest/Reference/Errors/)

## ✨ Próximos Passos

1. ✅ Plugin instalado e registrado
2. ✅ Middlewares de autenticação atualizados
3. ✅ Controllers usando helpers de erro
4. ✅ Método `applyDefaults()` renomeado
5. ⏳ Adicionar mais rotas usando os helpers
6. ⏳ Implementar cache control em rotas apropriadas
7. ⏳ Usar `fastify.assert()` para validações customizadas

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
