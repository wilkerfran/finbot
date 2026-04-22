import cron from 'node-cron';
import logger from '../utils/logger.js';
import { comandoResumo } from '../commands/resumo.js';
import { comandoMeta } from '../commands/meta.js';
import { getCurrentMonth, getCurrentYear } from '../utils/formatter.js';
import dotenv from 'dotenv';
dotenv.config();

let sockInstance = null;

export function initScheduler(sock) {
  sockInstance = sock;
  const groupId = process.env.GROUP_ID;

  if (!groupId) {
    logger.warn('GROUP_ID não configurado — agendamentos desativados');
    return;
  }

  // Toda segunda-feira às 8h — resumo semanal
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Enviando resumo semanal...');
    try {
      const resumo = await comandoResumo(getCurrentMonth(), getCurrentYear());
      await sockInstance.sendMessage(groupId, {
        text: `📅 *Resumo Semanal*\n\n${resumo}`
      });
    } catch (err) {
      logger.error(err, 'Erro no resumo semanal');
    }
  }, { timezone: 'America/Sao_Paulo' });

  // Dia 15 de cada mês às 9h — alerta de meio de mês
  cron.schedule('0 9 15 * *', async () => {
    logger.info('Enviando alerta meio do mês...');
    try {
      const resumo = await comandoResumo(getCurrentMonth(), getCurrentYear());
      await sockInstance.sendMessage(groupId, {
        text: `⚠️ *Metade do mês!*\n\nJá gastamos:\n\n${resumo}`
      });
    } catch (err) {
      logger.error(err, 'Erro no alerta de meio mês');
    }
  }, { timezone: 'America/Sao_Paulo' });

  // Dia 28 de cada mês às 20h — fechamento mensal + metas
  cron.schedule('0 20 28 * *', async () => {
    logger.info('Enviando fechamento mensal...');
    try {
      const resumo = await comandoResumo(getCurrentMonth(), getCurrentYear());
      const metas = await comandoMeta();
      await sockInstance.sendMessage(groupId, {
        text: `📊 *Fechamento do Mês*\n\n${resumo}\n\n${metas}`
      });
    } catch (err) {
      logger.error(err, 'Erro no fechamento mensal');
    }
  }, { timezone: 'America/Sao_Paulo' });

  logger.info('✅ Agendamentos configurados');
}