import 'dotenv/config';

// ============================================================
// ÚNICO ARCHIVO QUE HAY QUE EDITAR PARA ADAPTAR ESTE AGENTE
// A UN NEGOCIO NUEVO. No toques conversation.js ni googleCalendar.js.
// ============================================================
export const config = {
  // Nombre del negocio/asistente tal como lo verá el cliente en los mensajes.
  businessName: 'AgendeX',

  // Zona horaria del negocio (formato IANA, ej. Europe/Madrid, America/Mexico_City).
  timezone: 'Europe/Madrid',

  // Servicios que ofrece el negocio, con duración en minutos cada uno.
  // El agente de IA (aiAgent.js) recibe esta lista tal cual en su system
  // prompt para entender lenguaje natural ("quiero un corte de pelo"),
  // así que no hace falta ninguna lista de alias.
  services: [
    { id: 'servicio1', nombre: 'Servicio de ejemplo 1', duracionMin: 30 },
    { id: 'servicio2', nombre: 'Servicio de ejemplo 2', duracionMin: 60 },
  ],

  // Horario laboral: 0 = domingo, 1 = lunes ... 6 = sábado.
  // Formato: [[horaInicio, horaFin], [horaInicio, horaFin]] para huecos partidos.
  businessHours: {
    1: [[9, 14], [16, 20]], // lunes
    2: [[9, 14], [16, 20]], // martes
    3: [[9, 14], [16, 20]], // miércoles
    4: [[9, 14], [16, 20]], // jueves
    5: [[9, 14], [16, 20]], // viernes
    6: [[10, 14]],          // sábado
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
    maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 512),
  },

  port: process.env.PORT || 3000,

  // URL pública del servidor (ej. https://mi-negocio-bot.onrender.com). Si
  // está definida, el bot usa webhook en vez de long polling — necesario en
  // planes gratuitos (Render) que duermen el proceso tras inactividad.
  publicUrl: process.env.PUBLIC_URL || '',
};
