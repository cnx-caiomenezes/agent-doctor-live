import { buildApp } from './app.js';
import { getConfig } from './config/index.js';

/**
 * Inicializa e inicia o servidor
 */
async function start(): Promise<void> {
  try {
    // Carrega configuração
    const config = getConfig();

    // Constrói a aplicação
    const app = await buildApp(config);

    // Inicia o servidor
    await app.listen({
      port: config.port,
      host: config.host,
    });

    // Registra rotas disponíveis
    console.log('\n📋 Rotas disponíveis:');
    app.log.info(app.printRoutes());
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de sinais de encerramento
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  process.exit(0);
});

// Inicia o servidor
start();
