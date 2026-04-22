import { calcularSaldo, calcularGastosPorCategoria } from '../analysis/balance.js';
import { formatCurrency, getMonthName, getCurrentMonth, getCurrentYear } from '../utils/formatter.js';

export async function comandoResumo(mes, ano) {
  mes = mes || getCurrentMonth();
  ano = ano || getCurrentYear();

  const saldo = await calcularSaldo(mes, ano);
  const categorias = await calcularGastosPorCategoria(mes, ano);

  let msg = `📋 *Resumo — ${getMonthName(mes)}/${ano}*\n\n`;
  msg += `💰 Receitas: ${formatCurrency(saldo.receitas)}\n`;
  msg += `💸 Despesas: ${formatCurrency(saldo.despesas)}\n`;
  msg += `📈 Saldo: ${formatCurrency(saldo.saldo)}\n`;
  msg += `🏦 Poupança: ${saldo.taxaPoupanca}%\n`;

  if (categorias.length > 0) {
    msg += `\n📊 *Gastos por categoria:*\n`;
    for (const c of categorias) {
      msg += `  • ${c.categoria}: ${formatCurrency(c.valor)} (${c.percentual}%)\n`;
    }
  }

  const situacao = saldo.saldo >= 0
    ? `✅ Mês *positivo*! Continue assim.`
    : `⚠️ Mês *negativo*. Atenção aos gastos.`;

  msg += `\n${situacao}`;
  return msg;
}