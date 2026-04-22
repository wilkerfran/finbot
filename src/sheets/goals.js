import { readSheet, appendRow, updateCell } from './client.js';

export async function getMetas() {
  const rows = await readSheet('Metas!A2:I100');
  return rows.map(r => ({
    id: r[0], nome: r[1], tipo: r[2],
    valorTotal: parseFloat(r[3]) || 0,
    valorAtual: parseFloat(r[4]) || 0,
    prazo: r[5], valorMensal: parseFloat(r[6]) || 0,
    status: r[7] || 'ativa',
    progresso: parseFloat(r[8]) || 0
  })).filter(m => m.status === 'ativa');
}

export async function saveMeta(meta) {
  const progresso = meta.valorTotal > 0
    ? ((meta.valorAtual / meta.valorTotal) * 100).toFixed(1)
    : 0;

  await appendRow('Metas', [
    `meta_${Date.now()}`,
    meta.nome, meta.tipo,
    meta.valorTotal, meta.valorAtual || 0,
    meta.prazo || '',
    meta.valorMensal || 0,
    'ativa', progresso
  ]);
}