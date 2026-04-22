import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { startBot } from './src/bot/index.js';
import logger from './src/utils/logger.js';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('FinBot online');
});

server.listen(3000, () => {
  logger.info('Health check rodando na porta 3000');
});

logger.info('🚀 Iniciando FinBot...');

startBot().catch((err) => {
  logger.error(err, 'Erro fatal ao iniciar bot');
  process.exit(1);
});