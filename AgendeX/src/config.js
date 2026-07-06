import 'dotenv/config';

// ============================================================
// ÚNICO ARCHIVO QUE HAY QUE EDITAR PARA ADAPTAR ESTE AGENTE
// A UN NEGOCIO NUEVO. No toques conversation.js ni googleCalendar.js.
// ============================================================
export const config = {
  // Nombre del negocio tal como lo verá el cliente en los mensajes.
  businessName: 'ZubAL Estilistas ✨',

  // Nombre con el que el asistente se presenta al cliente (no el del negocio).
  assistantName: 'AgendeX',

  // Zona horaria del negocio (formato IANA, ej. Europe/Madrid, America/Mexico_City).
  timezone: 'Europe/Madrid',

  // Servicios de peluquería con duración en minutos. El agente de IA
  // (aiAgent.js) recibe esta lista tal cual en su system prompt para
  // entender lenguaje natural ("quiero un tinte"), así que no hace falta
  // ninguna lista de alias.
  services: [
    { id: 'corte', nombre: '✂️ Corte de Cabello', duracionMin: 30 },
    { id: 'tinte', nombre: '🎨 Tinte', duracionMin: 60 },
    { id: 'peinado', nombre: '💇‍♀️ Peinado', duracionMin: 30 },
    { id: 'alisado', nombre: '🌊 Alisado/Ondulado', duracionMin: 90 },
    { id: 'extension', nombre: '💆‍♀️ Extensiones', duracionMin: 120 },
    { id: 'tratamiento', nombre: '🧴 Tratamiento Capilar', duracionMin: 45 },
  ],

  // Horario laboral real de ZubAL Estilistas: lunes a viernes 10-20, sábado 10-14.
  // 0 = domingo, 1 = lunes ... 6 = sábado.
  businessHours: {
    1: [[10, 20]], // lunes
    2: [[10, 20]], // martes
    3: [[10, 20]], // miércoles
    4: [[10, 20]], // jueves
    5: [[10, 20]], // viernes
    6: [[10, 14]], // sábado
    // 0 (domingo) no aparece => cerrado
  },

  // Cuántos días hábiles hacia adelante se ofrecen para reservar.
  daysAhead: 14,

  // Granularidad de huecos (cada cuántos minutos se ofrecen slots).
  slotStepMin: 30,

  // Máximo de citas futuras por cliente (evita spam de reservas).
  maxCitasPorCliente: 3,

  google: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    calendarId: process.env.GOOGLE_CALENDAR_ID,
  },

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },

  // Motor conversacional: Claude (Anthropic). Haiku es el modelo más barato y
  // rápido de la familia, de sobra para esta tarea (seguir un guion de
  // reserva/consulta/cancelación con function calling) — no hace falta Sonnet
  // ni Opus aquí, y así se aprovecha mejor la cuota gratuita/de prueba.
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
    // Tope bajo a propósito: respuestas cortas y directas gastan menos y llegan antes al cliente.
    maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 220),
  },

  port: process.env.PORT || 3000,

  // URL pública del servidor (ej. https://mi-negocio-bot.onrender.com). Si
  // está definida, el bot usa webhook en vez de long polling — necesario en
  // planes gratuitos (Render) que duermen el proceso tras inactividad.
  publicUrl: process.env.PUBLIC_URL || '',
};
