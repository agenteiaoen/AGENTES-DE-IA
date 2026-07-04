import { google } from 'googleapis';
import { addDays, addMinutes, setHours, setMinutes, isBefore, isAfter, startOfDay, endOfDay, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { config } from '../config.js';

const auth = new google.auth.JWT(
  config.google.clientEmail,
  null,
  config.google.privateKey,
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });

/**
 * Devuelve los próximos N días hábiles según el horario laboral.
 * Solo se incluyen días donde el negocio está abierto.
 */
export function getUpcomingBusinessDays() {
  const days = [];
  let cursor = new Date();
  while (days.length < config.daysAhead) {
    const dow = cursor.getDay();
    if (config.businessHours[dow]) {
      days.push(new Date(cursor));
    }
    cursor = addDays(cursor, 1);
  }
  return days;
}

/**
 * Genera todos los huecos libres de un día según horario y duración del servicio,
 * y los cruza con la disponibilidad real de Google Calendar (freebusy.query).
 */
export async function getFreeSlots(date, durationMin) {
  const dow = date.getDay();
  const ranges = config.businessHours[dow];
  if (!ranges) return [];

  const dayStr = format(date, 'yyyy-MM-dd');
  const candidates = [];
  for (const [startH, endH] of ranges) {
    let slotStart = fromZonedTime(`${dayStr} ${String(startH).padStart(2, '0')}:00:00`, config.timezone);
    const rangeEnd = fromZonedTime(`${dayStr} ${String(endH).padStart(2, '0')}:00:00`, config.timezone);
    while (isBefore(addMinutes(slotStart, durationMin), rangeEnd) || +addMinutes(slotStart, durationMin) === +rangeEnd) {
      candidates.push({ start: new Date(slotStart), end: addMinutes(slotStart, durationMin) });
      slotStart = addMinutes(slotStart, config.slotStepMin);
    }
  }

  if (candidates.length === 0) return [];

  // No ofrecer huecos ya pasados si el día es hoy
  const now = new Date();
  const futureCandidates = candidates.filter((c) => isAfter(c.start, now));
  if (futureCandidates.length === 0) return [];

  const dayStartUtc = fromZonedTime(`${dayStr} 00:00:00`, config.timezone);
  const dayEndUtc = fromZonedTime(`${dayStr} 23:59:59`, config.timezone);

  const fbRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: dayStartUtc.toISOString(),
      timeMax: dayEndUtc.toISOString(),
      items: [{ id: config.google.calendarId }],
    },
  });
  const busy = fbRes.data.calendars[config.google.calendarId].busy || [];

  const free = futureCandidates.filter((c) => {
    return !busy.some((b) => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return isBefore(c.start, bEnd) && isAfter(c.end, bStart);
    });
  });

  return free.map((slot) => ({
    ...slot,
    label: toZonedTime(slot.start, config.timezone).toTimeString().slice(0, 5),
  }));
}

/**
 * Busca el próximo hueco libre a partir de una fecha (inclusive), recorriendo
 * días hábiles hacia adelante hasta encontrar uno o agotar maxDays.
 * Se usa para sugerir automáticamente una alternativa cuando el día/hora
 * pedido por el cliente no tiene disponibilidad.
 */
export async function findNextAvailableSlot(fromDate, durationMin, maxDays = 30) {
  for (let i = 0; i < maxDays; i++) {
    const day = addDays(startOfDay(fromDate), i);
    const dow = day.getDay();
    if (!config.businessHours[dow]) continue;
    const slots = await getFreeSlots(day, durationMin);
    if (slots.length > 0) {
      return { day, slot: slots[0] };
    }
  }
  return null;
}

/**
 * Comprobación final justo antes de crear la cita para evitar condiciones de carrera.
 */
export async function isSlotStillFree(start, end) {
  const fbRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: config.google.calendarId }],
    },
  });
  const busy = fbRes.data.calendars[config.google.calendarId].busy || [];
  return busy.length === 0;
}

/**
 * Crea una cita en Google Calendar. El clientId se guarda oculto en
 * extendedProperties para seguridad (cliente solo puede cancelar/modificar su propia cita).
 */
export async function createAppointment({ clientId, clientLabel, serviceName, start, end }) {
  const stillFree = await isSlotStillFree(start, end);
  if (!stillFree) {
    return { ok: false, reason: 'slot_taken' };
  }
  const res = await calendar.events.insert({
    calendarId: config.google.calendarId,
    requestBody: {
      summary: `${serviceName} — ${clientLabel || clientId}`,
      description: `Cita reservada automáticamente por ${config.businessName}\nCliente: ${clientLabel || clientId}`,
      start: { dateTime: start.toISOString(), timeZone: config.timezone },
      end: { dateTime: end.toISOString(), timeZone: config.timezone },
      extendedProperties: {
        private: {
          clientId: String(clientId),
          clientLabel: clientLabel || '',
        },
      },
    },
  });
  return { ok: true, event: res.data };
}

/**
 * Lista SOLO las citas futuras del cliente. Esta es la función clave de seguridad.
 */
export async function listMyAppointments(clientId) {
  const res = await calendar.events.list({
    calendarId: config.google.calendarId,
    timeMin: new Date().toISOString(),
    privateExtendedProperty: `clientId=${clientId}`,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items || [];
}

/**
 * Historial de citas PASADAS del cliente (hasta 1 año atrás). Es la "memoria"
 * del bot: como vive en Google Calendar, sobrevive a reinicios del servidor
 * y permite reconocer a clientes recurrentes y hacer seguimiento de sus cortes.
 */
export async function listAppointmentHistory(clientId, maxResults = 5) {
  const unAnioAtras = new Date();
  unAnioAtras.setFullYear(unAnioAtras.getFullYear() - 1);

  const res = await calendar.events.list({
    calendarId: config.google.calendarId,
    timeMin: unAnioAtras.toISOString(),
    timeMax: new Date().toISOString(),
    privateExtendedProperty: `clientId=${clientId}`,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const items = res.data.items || [];
  return items.slice(-maxResults).reverse();
}

/**
 * Cancela una cita, pero SOLO si el clientId coincide. Seguridad crítica.
 */
export async function cancelAppointment(clientId, eventId) {
  const event = await calendar.events.get({ calendarId: config.google.calendarId, eventId });
  if (event.data.extendedProperties?.private?.clientId !== String(clientId)) {
    return { ok: false, reason: 'not_owner' };
  }
  await calendar.events.delete({ calendarId: config.google.calendarId, eventId });
  return { ok: true };
}

/**
 * Modifica (mueve) una cita a un nuevo horario, verificando propiedad y disponibilidad.
 */
export async function rescheduleAppointment(clientId, eventId, newStart, newEnd) {
  const event = await calendar.events.get({ calendarId: config.google.calendarId, eventId });
  if (event.data.extendedProperties?.private?.clientId !== String(clientId)) {
    return { ok: false, reason: 'not_owner' };
  }
  const stillFree = await isSlotStillFree(newStart, newEnd);
  if (!stillFree) {
    return { ok: false, reason: 'slot_taken' };
  }
  const res = await calendar.events.patch({
    calendarId: config.google.calendarId,
    eventId,
    requestBody: {
      start: { dateTime: newStart.toISOString(), timeZone: config.timezone },
      end: { dateTime: newEnd.toISOString(), timeZone: config.timezone },
    },
  });
  return { ok: true, event: res.data };
}
