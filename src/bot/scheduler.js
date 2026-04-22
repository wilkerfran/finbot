import cron from 'node-cron';
import logger from '../utils/logger.js';
import { comandoResumo } from '../commands/resumo.js';
import { comandoMeta } from '../commands/meta.js';
import { gerarRecomendacoes, calcularScoreFinanceiro } from '../analysis/recommendations.js';
import { getCurrentMonth, getCurrentYear, getMonthName } from '../utils/formatter.js';
import dotenv from 'dotenv';
import { gerarRecomendacoes, calcularScoreFinanceiro, gerarPlanejamentoProximoMes } from '../analysis/recommendations.js';
dotenv.config();

let sockInstance = null;

export function initScheduler(sock) {
  sockInstance = sock;
  const groupId = process.env.GROUP_ID;

  if (!groupId) {
    logger.warn('GROUP_ID não configurado — agendamentos desativados');
    return;
  }

  // Toda segunda às 8h — análise semanal com IA
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Enviando análise semanal...');
    try {
      const resumo = await comandoResumo(getCurrentMonth(), getCurrentYear());
      const recomendacao = await gerarRecomendacoes();
      const score = await calcularScoreFinanceiro(getCurrentMonth(), getCurrentYear());

      let msg = `📅 *Análise Semanal — ${getMonthName(getCurrentMonth())}*\n\n`;
      msg += resumo + '\n\n';

      if (score) {
        msg += `${score.emoji} *Score Financeiro: ${score.score}/100 — ${score.nivel}*\n\n`;
      }

      if (recomendacao) {
        msg += `💡 *Análise do consultor:*\n${recomendacao}`;
      }

      await sockInstance.sendMessage(groupId, { text: msg });
    } catch (err) {
      logger.error(err, 'Erro no resumo semanal');
    }
  }, { timezone: 'America/Sao_Paulo' });

  // Dia 15 às 9h — alerta de meio de mês com score
  cron.schedule('0 9 15 * *', async () => {
    logger.info('Enviando alerta meio do mês...');
    try {
      const resumo = await comandoResumo(getCurrentMonth(), getCurrentYear());
      const score = await calcularScoreFinanceiro(getCurrentMonth(), getCurrentYear());
      const recomendacao = await gerarRecomendacoes();

      let msg = `⚠️ *Metade do mês! Como estamos?*\n\n`;
      msg += resumo + '\n\n';

      if (score) {
        msg += `${score.emoji} *Score: ${score.score}/100 — ${score.nivel}*\n\n`;
      }

      if (recomendacao) {
        msg += `💡 *O que fazer agora:*\n${recomendacao}`;
      }

      await sockInstance.sendMessage(groupId, { text: msg });
    } catch (err) {
      logger.error(err, 'Erro no alerta de meio mês');
    }
  }, { timezone: 'America/Sao_Paulo' });

  // Dia 28 às 20h — fechamento mensal completo
  cron.schedule('0 20 28 * *', async () => {
    logger.info('Enviando fechamento mensal...');
    try {
      const resumo = await comandoResumo(getCurrentMonth(), getCurrentYear());
      const metas = await comandoMeta();
      const score = await calcularScoreFinanceiro(getCurrentMonth(), getCurrentYear());
      const recomendacao = await gerarRecomendacoes();

      let msg = `📊 *Fechamento — ${getMonthName(getCurrentMonth())}/${getCurrentYear()}*\n\n`;
      msg += resumo + '\n\n';

      if (score) {
        msg += `${score.emoji} *Score Final: ${score.score}/100 — ${score.nivel}*\n\n`;
      }

      msg += metas + '\n\n';

      if (recomendacao) {
        msg += `💡 *Análise do mês:*\n${recomendacao}`;
      }

      await sockInstance.sendMessage(groupId, { text: msg });if (recomendacao) {
        msg += `💡 *Análise do mês:*\n${recomendacao}\n\n`;
      }

      const planejamento = await gerarPlanejamentoProximoMes();
      if (planejamento) {
        msg += planejamento;
      }

      await sockInstance.sendMessage(groupId, { text: msg });
    } catch (err) {
      logger.error(err, 'Erro no fechamento mensal');
    }
  }, { timezone: 'America/Sao_Paulo' });

  logger.info('✅ Agendamentos configurados');
}