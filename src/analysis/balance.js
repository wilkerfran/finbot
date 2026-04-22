import { getTransacoesMes } from '../sheets/transactions.js';
import { getCurrentMonth, getCurrentYear } from '../utils/formatter.js';

export async function calcularSaldo(mes, ano) {
  mes = mes || getCurrentMonth();
  ano = ano || getCurrentYear();

  const transacoes = await getTransacoesMes(mes, ano);

  const receitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((s, t) => s + t.valor, 0);

  const despesas = transacoes
    .filter(t => t.tipo === 'gasto')
    .reduce((s, t) => s + t.valor, 0);

  const saldo = receitas - despesas;
  const taxaPoupanca = receitas > 0
    ? parseFloat(((saldo / receitas) * 100).toFixed(1))
    : 0;

  return { receitas, despesas, saldo, taxaPoupanca, mes, ano };
}

export async function calcularGastosPorCategoria(mes, ano) {
  mes = mes || getCurrentMonth();
  ano = ano || getCurrentYear();

  const transacoes = await getTransacoesMes(mes, ano);
  const gastos = transacoes.filter(t => t.tipo === 'gasto');
  const totalGastos = gastos.reduce((s, t) => s + t.valor, 0);

  const porCategoria = {};
  for (const t of gastos) {
    porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor;
  }

  return Object.entries(porCategoria)
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual: totalGastos > 0
        ? parseFloat(((valor / totalGastos) * 100).toFixed(1))
        : 0
    }))
    .sort((a, b) => b.valor - a.valor);
}