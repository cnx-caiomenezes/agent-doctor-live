# Instruções para Construção de um Servidor LiveKit para Videochamada com Gravação de Áudio

## Objetivo

Construir um servidor LiveKit que permita chamadas de vídeo entre **apenas dois participantes** e **grave o áudio de cada participante** em arquivos locais no servidor, salvando-os **apenas após o término da reunião**.

---

## Passos Básicos

### 1. Instalar e Configurar o LiveKit

- Siga a documentação oficial: [LiveKit Docs](https://docs.livekit.io/)
- Execute o servidor LiveKit em sua máquina ou servidor.

### 2. Restringir a Sala para Dois Participantes

- Ao criar a sala, defina a configuração para permitir no máximo 2 participantes.
- Implemente lógica no backend para impedir entrada de mais participantes.

### 3. Capturar o Áudio de Cada Participante

- Utilize o recurso de gravação do LiveKit: [Recording API](https://docs.livekit.io/)
- Configure o **Egress** para gravar apenas o áudio de cada participante individualmente.
- Exemplo de configuração via API:
  - Inicie a gravação de áudio quando ambos participantes estiverem conectados.
  - Use o tipo `track` para gravar o áudio de cada participante separadamente.

### 4. Salvar o Áudio Localmente Após o Fim da Reunião

- Monitore eventos de encerramento da sala (ex: ambos participantes desconectados).
- Após o término, finalize a gravação e salve os arquivos de áudio localmente.
- Os arquivos podem ser salvos em um diretório específico, como `/var/livekit/recordings/`.

### 5. Exemplo de Fluxo

1. Participante A e B entram na sala.
2. Backend inicia gravação dos streams de áudio de cada participante.
3. Ao sair o último participante, backend encerra a gravação.
4. Áudios são salvos como arquivos `.wav` no servidor.

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
