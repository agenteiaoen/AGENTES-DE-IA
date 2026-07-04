import 'dotenv/config';

// Configuración específica para ZubAL Estilistas
// Editar este archivo para cambiar servicios, horarios o información del negocio
export const config = {
  businessName: 'ZubAL Estilistas ✨',
  timezone: 'Europe/Madrid',

  // Servicios de peluquería con duración en minutos
  services: [
    { id: 'corte', nombre: '✂️ Corte de Cabello', duracionMin: 30 },
    { id: 'tinte', nombre: '🎨 Tinte', duracionMin: 60 },
    { id: 'peinado', nombre: '💇‍♀️ Peinado', duracionMin: 30 },
    { id: 'alisado', nombre: '🌊 Alisado/Ondulado', duracionMin: 90 },
    { id: 'extension', nombre: '💆‍♀️ Extensiones', duracionMin: 120 },
    { id: 'tratamiento', nombre: '🧴 Tratamiento Capilar', duracionMin: 45 },
  ],

  // Horario laboral: 0 = domingo, 1 = lunes, 6 = sábado
  // Formato: { día: [[hora_inicio, hora_fin], [hora_inicio, hora_fin]] }
  businessHours: {
    1: [[10, 20]], // lunes
    2: [[10, 20]], // martes
    3: [[10, 20]], // miércoles
    4: [[10, 20]], // jueves
    5: [[10, 20]], // viernes
    6: [[10, 14]], // sábado
    // 0 (domingo) no aparece => cerrado
  },

  // Cuántos días hábiles hacia adelante se ofrecen para reservar
  daysAhead: 14,

  // Granularidad de huecos (cada cuántos minutos se ofrecen slots)
  slotStepMin: 30,

  // Máximo de citas futuras por cliente (evita spam de reservas)
  maxCitasPorCliente: 3,

  google: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    calendarId: process.env.GOOGLE_CALENDAR_ID,
  },

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
  },

  port: process.env.PORT || 3000,

  // URL pública del servidor (ej. https://zubal-bot.onrender.com). Si está
  // definida, el bot usa webhook en vez de long polling — necesario en
  // planes gratuitos (Render) que duermen el proceso tras inactividad.
  publicUrl: process.env.PUBLIC_URL || '',
};
