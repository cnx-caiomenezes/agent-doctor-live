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

## Features

### 1. Suporte a chamadas de vídeo em tempo real entre participantes + agente anonimo (STT-LLM-TTT)
#### 1.1. Configurar o servidor LiveKit para suportar chamadas de vídeo em tempo real.
#### 1.2. Integrar o LiveKit Client SDK no frontend para permitir que os usuários iniciem e participem de chamadas de vídeo.
#### 1.3. Implementar a lógica para o agente STT-LLM-TTT
##### 1.3.1 STT: Integrar um serviço de reconhecimento de fala (Pago) para transcrever o áudio em texto.
##### 1.3.2 LLM: Integrar um modelo de linguagem para processar o texto transcrito e gerar respostas ou ações.
##### 1.3.3 TTT: Implementar a lógica para enviar as respostas ou ações de volta para os participantes na chamada.
###### 1.3.3.1 Enviar dicas contextuais para um ou ambos os participantes utilizando feature LiveKit DataChannel.

### 2. Restringir a sala para dois participantes (Medico e Paciente)
#### 2.1. Configurar o servidor para permitir apenas dois participantes por sala.
#### 2.2. Implementar lógica para rejeitar conexões adicionais se a sala já estiver cheia.
#### 2.3. Autenticar participantes via JWT.
##### 2.3.1. Gerar tokens JWT com permissões adequadas para cada participante.
##### 2.3.2. Validar tokens JWT no servidor antes de permitir a entrada na sala.

### 3. Capturar track de áudio e vídeo de cada participante na sala
#### 3.1. Utilizar a API de Egress do LiveKit para gravar o áudio de cada participante em arquivos separados.
#### 3.2. Configurar o servidor para armazenar os arquivos de áudio localmente
#### 3.3. Garantir que os arquivos sejam salvos em S3 após o término da chamada de forma assíncrona.

### 4. Salvar texto completo da transcrição em S3
#### 4.1. Salvar a transcrição completa após cada chamada.

### 5. Salvar arquivos de áudio em S3
#### 5.1. Salvar os arquivos de áudio em S3 após o término da chamada.

---

## Observações

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
