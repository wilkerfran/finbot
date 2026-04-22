import { comandoSaldo } from './saldo.js';
import { comandoResumo } from './resumo.js';
import { comandoMeta } from './meta.js';
import { setConfig } from '../sheets/config.js';
import { getCurrentMonth, getCurrentYear, getMonthName } from '../utils/formatter.js';

export async function handleCommand(comando, args, sock, jid) {
  const cmd = comando.toLowerCase().trim();

  if (cmd === '/saldo') {
    return await comandoSaldo(getCurrentMonth(), getCurrentYear());
  }

  if (cmd === '/resumo') {
    return await comandoResumo(getCurrentMonth(), getCurrentYear());
  }

  if (cmd === '/meta' || cmd === '/metas') {
    return await comandoMeta();
  }

  if (cmd === '/modo') {
    const modo = args?.[0];
    const modos = { radical: 'Radical', moderado: 'Moderado', razoavel: 'Razoavel' };
    const modoValido = modos[modo?.toLowerCase()];
    if (!modoValido) {
      return `❓ Modos disponíveis:\n/modo radical\n/modo moderado\n/modo razoavel`;
    }
    await setConfig('modo_rigor', modoValido);
    const emojis = { Radical: '🔴', Moderado: '🟡', Razoavel: '🟢' };
    return `${emojis[modoValido]} Modo *${modoValido}* ativado!`;
  }

  if (cmd === '/score') {
    const { calcularScoreFinanceiro } = await import('../analysis/recommendations.js');
    const score = await calcularScoreFinanceiro(getCurrentMonth(), getCurrentYear());
    if (!score) return '⚠️ Não foi possível calcular o score ainda. Registre alguns gastos primeiro.';

    let msg = `${score.emoji} *Score Financeiro — ${getMonthName(getCurrentMonth())}*\n\n`;
    msg += `📊 Pontuação: *${score.score}/100 — ${score.nivel}*\n`;
    msg += `💰 Receitas: R$${score.totalReceitas.toFixed(2)}\n`;
    msg += `💸 Gastos: R$${score.totalGastos.toFixed(2)}\n`;
    msg += `📈 Saldo: R$${score.saldo.toFixed(2)}\n`;
    msg += `🏦 Poupança: ${typeof score.taxaPoupanca === 'number' ? score.taxaPoupanca.toFixed(1) : score.taxaPoupanca}%\n\n`;

    const dicas = {
      'Saudável': '🟢 Excelente! Mantenham o ritmo e aumentem a reserva.',
      'Atenção': '🟡 No caminho certo, mas há pontos a melhorar.',
      'Crítico': '🔴 Atenção necessária. Use /analise para orientações.',
      'Emergência': '🚨 Situação crítica. Cortes imediatos são necessários.',
      'Sem dados': '⚪ Registre receitas e gastos para ver seu score real.'
    };
    msg += dicas[score.nivel] || '';
    return msg;
  }

  if (cmd === '/analise') {
    const { gerarRecomendacoes } = await import('../analysis/recommendations.js');
    await sock?.sendMessage?.(jid, { text: '🤔 Analisando suas finanças...' });
    const recomendacao = await gerarRecomendacoes();
    if (!recomendacao) return '⚠️ Registre alguns gastos primeiro para gerar uma análise.';
    return `💡 *Análise Financeira Personalizada*\n\n${recomendacao}`;
  }

  if (cmd === '/planejamento') {
    const { gerarPlanejamentoProximoMes } = await import('../analysis/recommendations.js');
    await sock?.sendMessage?.(jid, { text: '📅 Gerando planejamento do próximo mês...' });
    const planejamento = await gerarPlanejamentoProximoMes();
    if (!planejamento) return '⚠️ Registre receitas e gastos do mês atual primeiro.';
    return planejamento;
  }

  if (cmd === '/ajuda') {
    return `🤖 *Comandos disponíveis:*\n\n` +
      `📊 *Consultas:*\n` +
      `/saldo — saldo do mês atual\n` +
      `/resumo — resumo detalhado por categoria\n` +
      `/score — score financeiro do mês\n` +
      `/analise — análise personalizada com IA\n` +
      `/planejamento — planejamento do próximo mês\n` +
      `/meta — ver suas metas\n\n` +
      `⚙️ *Configurações:*\n` +
      `/modo radical|moderado|razoavel\n\n` +
      `💬 *Ou fale naturalmente:*\n` +
      `_"gastei 50 no mercado"_\n` +
      `_"recebi 3000 de salário"_\n` +
      `_"uber 25"_\n` +
      `_"conta de luz 400"_`;
  }

  return null;
}