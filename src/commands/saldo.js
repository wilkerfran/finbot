import { calcularSaldo, calcularGastosPorCategoria } from '../analysis/balance.js';
import { formatCurrency, getMonthName } from '../utils/formatter.js';

export async function comandoSaldo(mes, ano) {
  const saldo = await calcularSaldo(mes, ano);
  const categorias = await calcularGastosPorCategoria(mes, ano);
  const top3 = categorias.slice(0, 3);

  const emoji = saldo.saldo >= 0 ? '📈' : '📉';
  const emojiPoupanca = saldo.taxaPoupanca >= 20 ? '🌟' : saldo.taxaPoupanca >= 10 ? '✅' : '⚠️';

  let msg = `📅 *${getMonthName(saldo.mes)}/${saldo.ano}*\n\n`;
  msg += `💰 Receitas: *${formatCurrency(saldo.receitas)}*\n`;
  msg += `💸 Despesas: *${formatCurrency(saldo.despesas)}*\n`;
  msg += `${emoji} Saldo: *${formatCurrency(saldo.saldo)}*\n`;
  msg += `${emojiPoupanca} Taxa de poupança: *${saldo.taxaPoupanca}%*\n`;

  if (top3.length > 0) {
    msg += `\n📊 *Top categorias:*\n`;
    for (const c of top3) {
      msg += `  • ${c.categoria}: ${formatCurrency(c.valor)} (${c.percentual}%)\n`;
    }
  }

  return msg;
}