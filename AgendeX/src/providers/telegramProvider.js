import { createHash } from 'crypto';
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
 * Normaliza un teléfono a un formato consistente (solo dígitos, con el "+"
 * inicial si lo tenía) — evita que el mismo número quede guardado de formas
 * distintas según cómo lo comparta cada cliente.
 */
function normalizarTelefono(telefono) {
  if (!telefono) return telefono;
  const limpio = String(telefono).trim().replace(/[^\d+]/g, '');
  return limpio.startsWith('+') ? limpio : `+${limpio}`;
}

/**
 * Secreto que Telegram debe mandar en la cabecera
 * "X-Telegram-Bot-Api-Secret-Token" en cada petición al webhook — así
 * comprobamos que las peticiones vienen realmente de Telegram y no de
 * alguien que haya adivinado o filtrado la URL del webhook (que ya incluye
 * el token, pero esto añade una capa extra sin coste). Se puede fijar uno
 * propio con TELEGRAM_WEBHOOK_SECRET; si no, se deriva del propio token del
 * bot (ya es un secreto, así que sigue siendo seguro).
 */
function obtenerSecretoWebhook() {
  if (process.env.TELEGRAM_WEBHOOK_SECRET) return process.env.TELEGRAM_WEBHOOK_SECRET;
  return createHash('sha256').update(config.telegram.token).digest('hex').slice(0, 32);
}

/**
 * Única capa que sabe de Telegram. Expone interfaz compatible con WhatsApp.
 * NO metes aquí lógica de citas — eso vive en conversation.js.
 *
 * En WhatsApp el clientId ya es el número de teléfono real, así que el
 * teléfono llega siempre. En Telegram no hay forma de conocerlo salvo que el
 * cliente lo comparta explícitamente, así que se lo pedimos una vez (teclado
 * nativo "compartir contacto" de Telegram, no un botón de menú de conversación)
 * y lo guardamos en memoria por clientId para las citas que reserve después.
 */
export function createTelegramProvider(onMessage) {
  const bot = new Telegraf(config.telegram.token);
  const telefonoPorCliente = new Map();
  const yaSePidioContacto = new Set();

  const provider = {
    async sendMessage(clientId, text) {
      await bot.telegram.sendMessage(clientId, text);
    },
    async launch(app) {
      bot.on('text', async (ctx) => {
        try {
          const clientId = String(ctx.from.id);

          if (!telefonoPorCliente.has(clientId) && !yaSePidioContacto.has(clientId)) {
            yaSePidioContacto.add(clientId);
            await ctx.reply(
              '📱 Si quieres, comparte tu teléfono para que quede guardado en tu cita (opcional, puedes ignorar esto y seguir escribiendo).',
              Markup.keyboard([Markup.button.contactRequest('📱 Compartir mi teléfono')])
                .resize()
                .oneTime()
            ).catch(() => {});
          }

          await onMessage(
            {
              clientId,
              clientLabel: nombreReal(ctx.from),
              text: ctx.message.text,
              clientPhone: telefonoPorCliente.get(clientId) || null,
            },
            provider
          );
        } catch (err) {
          console.error('Error procesando mensaje:', err);
          await ctx.reply('😅 Ha ocurrido un error inesperado. Escribe /start para volver a intentarlo.').catch(() => {});
        }
      });

      bot.on('contact', async (ctx) => {
        try {
          const clientId = String(ctx.from.id);
          // Solo aceptamos el contacto si lo comparte el propio remitente,
          // nunca un contacto de otra persona reenviado.
          if (ctx.message.contact.user_id === ctx.from.id) {
            telefonoPorCliente.set(clientId, normalizarTelefono(ctx.message.contact.phone_number));
            await ctx.reply('¡Gracias! 📱 Ya lo tengo guardado.', Markup.removeKeyboard()).catch(() => {});
          }
        } catch (err) {
          console.error('Error procesando contacto:', err);
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
        const secretoWebhook = obtenerSecretoWebhook();
        await bot.telegram.setWebhook(`${config.publicUrl}${webhookPath}`, { secret_token: secretoWebhook });
        app.use(bot.webhookCallback(webhookPath, { secretToken: secretoWebhook }));
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
