import { getTransacoesMes, getGastosPorCategoria } from '../sheets/transactions.js';
import { readSheet } from '../sheets/client.js';
import { getCurrentMonth, getCurrentYear, getMonthName } from '../utils/formatter.js';
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

    if (totalReceitas === 0) {
      return { score: 0, nivel: 'Sem dados', emoji: '⚪', taxaPoupanca: 0, saldo: 0, totalReceitas: 0, totalGastos: 0 };
    }

    const saldo = totalReceitas - totalGastos;
    const taxaPoupanca = (saldo / totalReceitas) * 100;

    let score = 100;

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

export async function gerarPlanejamentoProximoMes() {
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
    const proximoMes = mes === 12 ? 1 : mes + 1;
    const proximoAno = mes === 12 ? ano + 1 : ano;

    const top5Categorias = Object.entries(gastosPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, val]) => `${cat}: R$${val.toFixed(2)}`)
      .join(', ');

    const diretrizes = {
      Radical: 'Seja agressivo nos cortes. Sugira reduções de 20-30% nas categorias variáveis.',
      Moderado: 'Sugira cortes equilibrados de 10-15% nas categorias mais altas.',
      Razoavel: 'Sugira ajustes leves de 5-10% mantendo qualidade de vida.'
    };

    const prompt = `Você é um consultor financeiro brasileiro criando um planejamento mensal.
Modo: ${modo} — ${diretrizes[modo] || diretrizes.Moderado}

Dados de ${getMonthName(mes)}/${ano}:
- Receita total: R$${totalReceitas.toFixed(2)}
- Gasto total: R$${totalGastos.toFixed(2)}
- Saldo: R$${saldo.toFixed(2)}
- Top categorias: ${top5Categorias}

Crie um planejamento para ${getMonthName(proximoMes)}/${proximoAno} com:
1. Meta de poupança realista (valor em R$)
2. Orçamento sugerido para as 3-4 maiores categorias (com % de variação vs mês atual)
3. Uma atenção específica (algo importante que vence ou precisa de cuidado)
4. Uma dica prática para a primeira quinzena

Formato de resposta (use exatamente este formato):
META: R$[valor]
CATEGORIA: [nome] R$[valor] ([variação]%)
CATEGORIA: [nome] R$[valor] ([variação]%)
CATEGORIA: [nome] R$[valor] ([variação]%)
ATENCAO: [texto curto]
DICA: [texto curto]

Seja específico com os números. Não use frases genéricas.`;

    const resposta = await askGemini(prompt);
    if (!resposta) return null;

    const linhas = resposta.split('\n').filter(l => l.trim());
    let meta = '';
    const categorias = [];
    let atencao = '';
    let dica = '';

    for (const linha of linhas) {
      if (linha.startsWith('META:')) meta = linha.replace('META:', '').trim();
      else if (linha.startsWith('CATEGORIA:')) categorias.push(linha.replace('CATEGORIA:', '').trim());
      else if (linha.startsWith('ATENCAO:')) atencao = linha.replace('ATENCAO:', '').trim();
      else if (linha.startsWith('DICA:')) dica = linha.replace('DICA:', '').trim();
    }

    let msg = `📅 *Planejamento de ${getMonthName(proximoMes)}/${proximoAno}*\n\n`;
    if (meta) msg += `🎯 Meta de poupança: *${meta}*\n\n`;
    if (categorias.length > 0) {
      msg += `💰 *Orçamento sugerido:*\n`;
      for (const cat of categorias) msg += `  • ${cat}\n`;
      msg += '\n';
    }
    if (atencao) msg += `⚠️ *Atenção:* ${atencao}\n`;
    if (dica) msg += `💡 *Dica:* ${dica}`;

    return msg;
  } catch (err) {
    return null;
  }
}