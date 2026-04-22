import { interpretarMensagem } from '../ai/parser.js';
import { saveTransaction } from '../sheets/transactions.js';
import { handleCommand } from '../commands/index.js';
import { formatCurrency } from '../utils/formatter.js';
import { savePendingConfirmation, getPendingConfirmation, clearPendingConfirmation } from '../utils/db.js';
import { getConfig } from '../sheets/config.js';
import logger from '../utils/logger.js';

export async function handleMessage(sock, msg) {
  const jid = msg.key.remoteJid;
  const senderJid = msg.key.participant || msg.key.remoteJid;
  const texto = msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text || '';

  if (!texto || texto.length < 2) return;

  logger.info({ texto, sender: senderJid }, 'Mensagem recebida');

  const config = await getConfig();

const senderLid = senderJid.replace('@lid', '').replace('@s.whatsapp.net', '');

const lid1 = config.lid_usuario_1?.trim() || '';
const lid2 = config.lid_usuario_2?.trim() || '';

let nomeUsuario = 'Usuário';
if (lid1 && senderLid === lid1) {
  nomeUsuario = config.nome_usuario_1 || 'Usuário 1';
} else if (lid2 && senderLid === lid2) {
  nomeUsuario = config.nome_usuario_2 || 'Usuário 2';
} else {
  console.log('LID não reconhecido:', senderLid);
  nomeUsuario = 'Usuário';
}

  // Verifica se há confirmação pendente
  if (texto.toLowerCase() === 'sim') {
    const pendente = getPendingConfirmation(senderJid);
    if (pendente) {
      await saveTransaction({ ...pendente, quem: nomeUsuario });
      clearPendingConfirmation(senderJid);
      await sock.sendMessage(jid, {
        text: `✅ Registrado: *${formatCurrency(pendente.valor)}* em ${pendente.categoria}`
      });
      return;
    }
  }

  if (texto.toLowerCase() === 'não' || texto.toLowerCase() === 'nao') {
    clearPendingConfirmation(senderJid);
    await sock.sendMessage(jid, { text: `❌ Cancelado. Pode me mandar novamente.` });
    return;
  }

  // Comandos com /
  if (texto.startsWith('/')) {
    const partes = texto.split(' ');
    const cmd = partes[0];
    const args = partes.slice(1);
    const resposta = await handleCommand(cmd, args);
    if (resposta) {
      await sock.sendMessage(jid, { text: resposta });
    }
    return;
  }

  // Linguagem natural via Gemini
  try {
    const resultado = await interpretarMensagem(texto, nomeUsuario);

    if (resultado.tipo === 'irrelevante') return;

    if (resultado.tipo === 'gasto' || resultado.tipo === 'receita') {
      if (resultado.confianca >= 0.8) {
        await saveTransaction({ ...resultado, quem: nomeUsuario });
        let resposta = resultado.resposta || `✅ *${formatCurrency(resultado.valor)}* registrado em ${resultado.categoria}`;
        if (resultado.alerta) resposta += `\n\n${resultado.alerta}`;
        await sock.sendMessage(jid, { text: resposta });
      } else {
        savePendingConfirmation(senderJid, resultado);
        await sock.sendMessage(jid, {
          text: `🤔 Entendi:\n*${formatCurrency(resultado.valor)}* em *${resultado.categoria}* (${resultado.descricao})\n\nCorreto? Responda *SIM* para confirmar.`
        });
      }
      return;
    }

    if (resultado.tipo === 'consulta') {
      const { handleCommand } = await import('../commands/index.js');
      const intencaoParaComando = {
        ver_saldo: '/saldo',
        ver_resumo: '/resumo',
        ver_metas: '/meta',
        ajuda_geral: '/ajuda'
      };
      const cmd = intencaoParaComando[resultado.intencao];
      if (cmd) {
        const resposta = await handleCommand(cmd, []);
        if (resposta) await sock.sendMessage(jid, { text: resposta });
      }
    }

  } catch (err) {
    logger.error(err, 'Erro ao processar mensagem');
    await sock.sendMessage(jid, {
      text: `⚠️ Tive um problema ao processar. Tente novamente.`
    });
  }
}