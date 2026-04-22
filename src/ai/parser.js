import { parseMessage } from './gemini.js';
import { buildParsePrompt } from './prompts.js';
import { formatDate, getCurrentMonth, getCurrentYear } from '../utils/formatter.js';
import { getModoRigor } from '../sheets/config.js';

export async function interpretarMensagem(texto, nomeUsuario) {
  const modo = await getModoRigor();

  const contexto = {
    data: formatDate(),
    usuario: nomeUsuario,
    modo,
    mes: getCurrentMonth(),
    ano: getCurrentYear()
  };

  const prompt = buildParsePrompt(texto, contexto);
  const resultado = await parseMessage(prompt);
  resultado.modoAtivo = modo;

  return resultado;
}