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
