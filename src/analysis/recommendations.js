import { getTransacoesMes, getGastosPorCategoria } from '../sheets/transactions.js';
import { readSheet } from '../sheets/client.js';
import { getCurrentMonth, getCurrentYear, formatCurrency, getMonthName } from '../utils/formatter.js';
import { askGemini } from '../ai/gemini.js';
import { getModoRigor } from '../sheets/config.js';

export async function gerarRecomendacoes() {
  try {
    const mes = getCurrentMonth();
    const ano = getCurrentYear();
    const modo = await getModoRigor();

    const gastosPorCategoria = await getGastosPorCategoria(mes, ano);
    const transacoes = await getTransacoesMes(mes, ano);

    const totalGastos = Object.values(gastosPorCategoria).reduce((a, b) => a + b, 0);
    const totalReceitas = transacoes
      .filter(t => t.tipo === 'receita')
      .reduce((s, t) => s + t.valor, 0);

    const saldo = totalReceitas - totalGastos;
    const taxaPoupanca = totalReceitas > 0
      ? ((saldo / totalReceitas) * 100).toFixed(1)
      : 0;

    const categoriasMaisGastas = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, val]) => `${cat}: R$${val.toFixed(2)}`);

    const diretrizes = {
      Radical: 'Seja direto e cortante. Aponte problemas sem suavizar. Sugira cortes concretos e imediatos.',
      Moderado: 'Equilibre qualidade de vida com economia. Tom construtivo e encorajador.',
      Razoavel: 'Seja gentil. Foque em ganhos fáceis sem pressão excessiva.'
    };

    const prompt = `Você é um consultor financeiro pessoal brasileiro direto e prático.
Modo ativo: ${modo} — ${diretrizes[modo] || diretrizes.Moderado}

Dados do mês ${getMonthName(mes)}/${ano}:
- Total receitas: R$${totalReceitas.toFixed(2)}
- Total gastos: R$${totalGastos.toFixed(2)}
- Saldo: R$${saldo.toFixed(2)}
- Taxa de poupança: ${taxaPoupanca}%
- Top categorias de gasto: ${categoriasMaisGastas.join(', ')}

Gere uma análise financeira curta e direta com:
1. Situação atual em 1 frase
2. Principal problema identificado
3. Uma ação concreta para esta semana
4. Uma frase motivacional curta

Formato: texto corrido, sem bullets, máximo 5 linhas. Seja específico com os números.
NÃO use frases genéricas. Fale diretamente sobre os dados acima.`;

    const resposta = await askGemini(prompt);
    return resposta;
  } catch (err) {
    return null;
  }
}

export async function calcularScoreFinanceiro(mes, ano) {
  try {
    const gastosPorCategoria = await getGastosPorCategoria(mes, ano);
    const transacoes = await getTransacoesMes(mes, ano);

    const totalGastos = Object.values(gastosPorCategoria).reduce((a, b) => a + b, 0);
    const totalReceitas = transacoes
      .filter(t => t.tipo === 'receita')
      .reduce((s, t) => s + t.valor, 0);

    const saldo = totalReceitas - totalGastos;
    const taxaPoupanca = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;

    let score = 100;

    if (totalReceitas === 0) {
  return { score: 0, nivel: 'Sem dados', emoji: '⚪', taxaPoupanca: 0, saldo: 0, totalReceitas: 0, totalGastos: 0 };
}
if (taxaPoupanca < 0) score -= 40;
else if (taxaPoupanca < 5) score -= 25;
else if (taxaPoupanca < 10) score -= 15;
else if (taxaPoupanca < 20) score -= 5;

    const orcamentos = await readSheet('Orcamento!A2:B20');
    let categoriasEstouradas = 0;
    for (const [categoria, valor] of Object.entries(gastosPorCategoria)) {
      const orc = orcamentos.find(r => r[0] === categoria);
      if (orc && parseFloat(orc[1]) > 0 && valor > parseFloat(orc[1])) {
        categoriasEstouradas++;
      }
    }

    score -= categoriasEstouradas * 10;
    score = Math.max(0, Math.min(100, score));

    let nivel, emoji;
    if (score >= 80) { nivel = 'Saudável'; emoji = '🟢'; }
    else if (score >= 60) { nivel = 'Atenção'; emoji = '🟡'; }
    else if (score >= 40) { nivel = 'Crítico'; emoji = '🔴'; }
    else { nivel = 'Emergência'; emoji = '🚨'; }

    return { score, nivel, emoji, taxaPoupanca, saldo, totalReceitas, totalGastos };
  } catch {
    return null;
  }
}