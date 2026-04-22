import { getMetas, saveMeta } from '../sheets/goals.js';
import { formatCurrency } from '../utils/formatter.js';

export async function comandoMeta() {
  const metas = await getMetas();

  if (metas.length === 0) {
    return `🎯 Nenhuma meta ativa.\n\nCrie uma meta dizendo:\n_"quero guardar 5000 para viagem em dezembro"_`;
  }

  let msg = `🎯 *Suas Metas*\n\n`;

  for (const m of metas) {
    const barra = gerarBarra(m.progresso);
    const emoji = m.progresso >= 100 ? '✅' : m.progresso >= 50 ? '🔶' : '🔴';
    msg += `${emoji} *${m.nome}*\n`;
    msg += `   ${barra} ${m.progresso}%\n`;
    msg += `   ${formatCurrency(m.valorAtual)} / ${formatCurrency(m.valorTotal)}\n`;
    if (m.prazo) msg += `   📅 Prazo: ${m.prazo}\n`;
    msg += `\n`;
  }

  return msg;
}

export async function criarMeta(dados) {
  await saveMeta(dados);
  return `✅ Meta *${dados.nome}* criada!\n💰 Valor: ${formatCurrency(dados.valorTotal)}\n📅 Prazo: ${dados.prazo || 'Sem prazo'}\n📊 Aporte mensal necessário: ${formatCurrency(dados.valorMensal || 0)}`;
}

function gerarBarra(percentual) {
  const total = 10;
  const preenchido = Math.round((percentual / 100) * total);
  return '█'.repeat(preenchido) + '░'.repeat(total - preenchido);
}