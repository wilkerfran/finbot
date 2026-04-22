import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { handleMessage } from './messageHandler.js';
import logger from '../utils/logger.js';
import path from 'path';

dotenv.config();

export async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve('auth')
  );

  const { version } = await fetchLatestBaileysVersion();
  logger.info({ version }, 'Baileys version');

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger.child({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;

      logger.warn({ shouldReconnect }, 'Conexão encerrada');

      if (shouldReconnect) {
        logger.info('Reconectando...');
        setTimeout(startBot, 3000);
      } else {
        logger.error('Desconectado. Delete a pasta auth/ e reinicie.');
      }
    }

    if (connection === 'open') {
      logger.info('✅ Bot conectado ao WhatsApp!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        logger.error(err, 'Erro ao processar mensagem');
      }
    }
  });

  const { initScheduler } = await import('./scheduler.js');
  initScheduler(sock);

  return sock;
}