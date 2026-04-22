import { readSheet, updateCell } from './client.js';

export async function getConfig() {
  const rows = await readSheet('Configuracoes!A2:B20');
  const config = {};
  for (const row of rows) {
    if (row[0]) config[row[0]] = row[1] || '';
  }
  return config;
}

export async function setConfig(key, value) {
  const rows = await readSheet('Configuracoes!A2:A20');
  const rowIndex = rows.findIndex(r => r[0] === key);
  if (rowIndex >= 0) {
    await updateCell(`Configuracoes!B${rowIndex + 2}`, value);
  }
}

export async function getModoRigor() {
  const config = await getConfig();
  return config.modo_rigor || 'Moderado';
}