import { appendRow, readSheet } from './client.js';
import { formatDate, formatTime, getCurrentMonth, getCurrentYear } from '../utils/formatter.js';


function generateId() {
  const now = new Date();
  return `txn_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${Date.now()}`;
}

export async function saveTransaction(data) {
  const now = new Date();
  const id = generateId();

  const row = [
    id,
    formatDate(now),
    formatTime(now),
    data.tipo,
    data.descricao,
    data.valor,
    data.categoria,
    data.subcategoria || '',
    data.quem || 'Usuário',
    getCurrentMonth(),
    getCurrentYear(),
    data.essencial ? 'SIM' : 'NÃO',
    data.observacao || '',
    data.modoAtivo || 'Moderado'
  ];

  await appendRow('Transacoes', row);
  return id;
}

export async function getTransacoesMes(mes, ano) {
  const rows = await readSheet('Transacoes!A2:N1000');
  return rows
    .filter(r => parseInt(r[9]) === mes && parseInt(r[10]) === ano)
    .map(r => ({
      id: r[0], data: r[1], hora: r[2], tipo: r[3],
      descricao: r[4], valor: parseFloat(r[5]) || 0,
      categoria: r[6], subcategoria: r[7], quem: r[8],
      mes: parseInt(r[9]), ano: parseInt(r[10]),
      essencial: r[11] === 'SIM', observacao: r[12]
    }));
}

export async function getGastosPorCategoria(mes, ano) {
  const transacoes = await getTransacoesMes(mes, ano);
  const gastos = transacoes.filter(t => t.tipo === 'gasto');
  const resultado = {};
  for (const t of gastos) {
    resultado[t.categoria] = (resultado[t.categoria] || 0) + t.valor;
  }
  return resultado;
}