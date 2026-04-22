import { comandoSaldo } from './saldo.js';
import { comandoResumo } from './resumo.js';
import { comandoMeta } from './meta.js';
import { setConfig } from '../sheets/config.js';
import { getCurrentMonth, getCurrentYear } from '../utils/formatter.js';

export async function handleCommand(comando, args) {
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

  if (cmd === '/ajuda') {
    return `🤖 *Comandos disponíveis:*\n\n` +
      `/saldo — saldo do mês atual\n` +
      `/resumo — resumo detalhado\n` +
      `/meta — ver suas metas\n` +
      `/modo radical|moderado|razoavel\n` +
      `/ajuda — esta mensagem\n\n` +
      `💬 Ou apenas escreva naturalmente:\n` +
      `_"gastei 50 no mercado"_\n` +
      `_"recebi 3000 de salário"_`;
  }

  return null;
}