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
