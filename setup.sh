# Instalação do NVM
export NVM_DIR="$HOME/.nvm"
if [ ! -d "$NVM_DIR" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Carrega o NVM se não estiver carregado
if ! command -v nvm &> /dev/null; then
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Instala e usa a versão 24.9.0 do Node.js
if ! nvm ls 24.9.0 | grep -q 'v24.9.0'; then
    nvm install 24.9.0
fi

# Define versao do projeto
nvm use 24.9.0

# Instala pnpm para gerenciar dependencias do projeto LiveKit
npm install -g pnpm

# Inicia o projeto com pnpm
pnpm init --init-type module

# Instala Typescript
pnpm add -D typescript tsx

# Inicia o projeto Typescript
pnpm exec tsc --init

# Instala dependencias do LiveKit
pnpm add @livekit/agents \
         livekit-server-sdk \
         @livekit/agents-plugin-openai \
         livekit-plugins-noise-cancellation \
         dotenv