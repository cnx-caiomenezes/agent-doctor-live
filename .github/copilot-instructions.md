# Instruções para Construção de um Servidor LiveKit para Videochamada com Gravação de Áudio

## Objetivo

Construir um servidor LiveKit STT-LLM-TTT (Speech-to-Text, Language Model, Text-to-Text) que permita chamadas de vídeo entre **apenas dois participantes** e **grave o áudio de cada participante** em arquivos locais no servidor, salvando-os **após o término da reunião**. Transcrever os áudios em texto e processá-los com um modelo de linguagem para gerar respostas, ações e dicas contextuais para um ou todos participantes.

## Arquitetura
- Frontend [meeting-doctor-live-conexa](https://github.com/cnx-caiomenezes/meeting-doctor-live-conexa): Interface web para iniciar e participar da chamada entre dois participantes.
  - WEBRTC: Biblioteca para comunicação em tempo real via navegador.
  - LiveKit Client SDK: Biblioteca para interagir com o servidor LiveKit.
- Autenticação: Sistema para autenticar usuários e gerar tokens JWT para acesso seguro à sala de chamada.
- Backend/Servidor: Servidor Node.js para gerenciar a lógica da aplicação.
  - Gerenciar a criação e controle da sala de chamada.
  - Restringir o número de participantes para dois.
  - Iniciar e parar a gravação do áudio.
  - Salvar os arquivos de áudio localmente após o término da chamada.
- Backend/Agent (LiveKit + Node.js): Um terceiro participante que será responsavel por implementar a pipeline seguindo o formato STT-LLM-TTT (Speech-to-Text, Language Model, Text-to-Text).
  - Capturar o áudio de cada participante.
  - Transcrever o áudio em texto (Speech-to-Text) utilizando um modelo de reconhecimento de fala (Pago).
  - Processar o texto transcrito com um modelo de linguagem (Language Model) para gerar respostas ou ações com base no contexto passado como:
    - Histórico da conversa.
    - Informações do usuário.
    - Dados externos (APIs, banco de dados, etc).
- LiveKit: Plataforma de comunicação em tempo real para gerenciar a transmissão de áudio e vídeo.
- Armazenamento S3 (AWS): Armazenamento opcional para arquivos de áudio gravados e suas transcrições.
- Redis: Banco de dados em memória para armazenar:
  - Sessões ativas.
  - Tokens de autenticação.
  - Metadados das gravações.
  - Prompt de contexto inicial da conversa.
- Banco de Dados (PostgreSQL): Banco de dados relacional para armazenar informações persistentes, como:
  - Atendimentos.
  - Transcrições dos atendimentos.
  - Configurações do agente.
    - Nome do agente.
    - Modelo de linguagem utilizado.
    - Configurações de STT (Speech-to-Text).
      - Provedor de STT (Google, Azure, etc).
      - Configurações de idioma.
      - Configurações de sensibilidade.
    - Configurações de TTT (Text-to-Text).
  - Logs de atividades.
    - Quem iniciou a reunião.
    - Quem participou.
    - Duração da reunião.
  - Logs de interações do agente.
    - Dicas fornecidas.
    - Ações sugeridas.
    - Respostas geradas.
  - Histórico de conversas.
    - Mensagens trocadas.
    - Transcrições associadas.
    - Contexto da conversa.

---

## Passos Básicos

### 1. Instalar e Configurar o LiveKit

- Siga a documentação oficial: [LiveKit Docs](https://docs.livekit.io/)
- Utilizar o LiveKit Cloud ou hospedar seu próprio servidor LiveKit.
- Configurar variáveis de ambiente para o servidor LiveKit:
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
  - `LIVEKIT_URL` (Ex: `wss://your-livekit-server`)
- Configurar o servidor Node.js com as dependências necessárias:
  - `livekit-server-sdk`
  - `fastify` (para o servidor web)
  - `jsonwebtoken` (para geração de tokens JWT)

### 2. Restringir a Sala para Dois Participantes

### 3. Capturar o Áudio de Cada Participante

### 4. Salvar o Áudio Localmente Após o Fim da Reunião

### 5. Exemplo de Fluxo

---

## Observações

- Certifique-se de que o servidor tenha espaço suficiente para armazenar os arquivos.
- Considere implementar notificações ou logs para monitorar início e fim das gravações.
- Para maior segurança, restrinja permissões de acesso aos arquivos gravados.
- Garanta que os participantes da chamada estejam autenticados via JWT.

---

## Referências

- [LiveKit Recording](https://docs.livekit.io/)
- [LiveKit Egress API](https://docs.livekit.io/egress/)
- [LiveKit Agents Integrations Realtime](https://docs.livekit.io/agents/integrations/realtime/)
- [Node.js Livekit Server Example](https://github.com/livekit-examples/agent-starter-node)
- [Speech to text Integration](https://docs.livekit.io/agents/integrations/stt/)
