import { Telegraf, Markup } from 'telegraf';
import { config } from '../config.js';

/**
 * Nombre real de Telegram (nombre + apellido si lo tiene), no el @username.
 * Es lo que se guarda en la cita de Google Calendar para identificar al cliente.
 */
function nombreReal(from) {
  const nombre = [from.first_name, from.last_name].filter(Boolean).join(' ').trim();
  return nombre || from.username || 'Cliente';
}

/**
 * Única capa que sabe de Telegram. Expone interfaz compatible con WhatsApp.
 * NO metes aquí lógica de citas — eso vive en conversation.js.
 */
export function createTelegramProvider(onMessage) {
  const bot = new Telegraf(config.telegram.token);

  const provider = {
    async sendMessage(clientId, text) {
      await bot.telegram.sendMessage(clientId, text);
    },
    async sendButtons(clientId, text, buttons) {
      const keyboard = Markup.inlineKeyboard(
        buttons.map((b) => [Markup.button.callback(b.label, b.id)])
      );
      await bot.telegram.sendMessage(clientId, text, keyboard);
    },
    async launch(app) {
      bot.on('text', async (ctx) => {
        try {
          await onMessage(
            {
              clientId: String(ctx.from.id),
              clientLabel: nombreReal(ctx.from),
              text: ctx.message.text,
            },
            provider
          );
        } catch (err) {
          console.error('Error procesando mensaje:', err);
          await ctx.reply('😅 Ha ocurrido un error inesperado. Escribe /start para volver a intentarlo.').catch(() => {});
        }
      });

      bot.on('callback_query', async (ctx) => {
        await ctx.answerCbQuery().catch(() => {});
        try {
          await onMessage(
            {
              clientId: String(ctx.from.id),
              clientLabel: nombreReal(ctx.from),
              buttonPayload: ctx.callbackQuery.data,
            },
            provider
          );
        } catch (err) {
          console.error('Error procesando botón:', err);
          await ctx.reply('😅 Ha ocurrido un error inesperado. Escribe /start para volver a intentarlo.').catch(() => {});
        }
      });

      bot.catch((err, ctx) => {
        console.error('Error no controlado en Telegraf:', err);
        ctx.reply('😅 Ha ocurrido un error inesperado. Escribe /start para volver a intentarlo.').catch(() => {});
      });

      // En producción (con URL pública, ej. Render) usamos webhook: Telegram
      // nos "despierta" con cada mensaje, ideal para planes gratuitos que
      // duermen el servidor tras inactividad. En local usamos long polling.
      if (config.publicUrl && app) {
        const webhookPath = `/telegraf/${config.telegram.token}`;
        await bot.telegram.setWebhook(`${config.publicUrl}${webhookPath}`);
        app.use(bot.webhookCallback(webhookPath));
        console.log(`🤖 Bot de Telegram en marcha (webhook: ${config.publicUrl}${webhookPath})`);
      } else {
        await bot.telegram.deleteWebhook().catch(() => {});
        bot.launch();
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
        console.log('🤖 Bot de Telegram en marcha (long polling)');
      }
    },
  };

  return provider;
}
