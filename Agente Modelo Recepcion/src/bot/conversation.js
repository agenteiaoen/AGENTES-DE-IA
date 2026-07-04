import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { config } from '../config.js';
import {
  getUpcomingBusinessDays,
  getFreeSlots,
  findNextAvailableSlot,
  createAppointment,
  listMyAppointments,
  listAppointmentHistory,
  cancelAppointment,
  rescheduleAppointment,
} from '../calendar/googleCalendar.js';

// Estado de conversación en memoria por cliente
const sessions = new Map();

function getSession(clientId) {
  if (!sessions.has(clientId)) {
    sessions.set(clientId, { step: 'menu', data: {} });
  }
  return sessions.get(clientId);
}

function resetSession(clientId) {
  sessions.set(clientId, { step: 'menu', data: {} });
}

const diaLabel = (d) => format(d, "EEEE d 'de' MMMM", { locale: es });
const horaLabel = (c) => format(new Date(c.start.dateTime), "d MMM 'a las' HH:mm", { locale: es });
const primerNombre = (nombreCompleto) => (nombreCompleto || '').split(' ')[0] || '';

/**
 * Punto de entrada único del bot. Procesa mensajes de texto y clics de botones.
 */
export async function handleIncoming({ clientId, clientLabel, text, buttonPayload }, provider) {
  const session = getSession(clientId);
  const input = buttonPayload || (text || '').trim();

  if (input === '/start' || input === 'menu') {
    resetSession(clientId);
    return showMenu(clientId, provider, clientLabel);
  }

  switch (session.step) {
    case 'menu':
      return handleMenu(clientId, clientLabel, input, provider, session);
    case 'reservar_servicio':
      return handleElegirServicio(clientId, input, provider, session);
    case 'reservar_dia':
      return handleElegirDia(clientId, input, provider, session);
    case 'reservar_hora':
      return handleElegirHora(clientId, input, provider, session);
    case 'reservar_confirmar':
      return handleConfirmarReserva(clientId, clientLabel, input, provider, session);
    case 'esperando_alternativa':
      return handleAlternativa(clientId, clientLabel, input, provider, session);
    case 'cancelar_elegir':
      return handleCancelarElegir(clientId, input, provider, session);
    case 'modificar_elegir_cita':
      return handleModificarElegirCita(clientId, input, provider, session);
    case 'modificar_dia':
      return handleModificarDia(clientId, input, provider, session);
    case 'modificar_hora':
      return handleModificarHora(clientId, input, provider, session);
    default:
      resetSession(clientId);
      return showMenu(clientId, provider, clientLabel);
  }
}

async function showMenu(clientId, provider, clientLabel) {
  const nombre = primerNombre(clientLabel);
  const yaHaVenido = (await listAppointmentHistory(clientId, 1)).length > 0;
  const saludo = yaHaVenido
    ? (nombre ? `¡Qué alegría verte de nuevo, ${nombre}! 😊` : '¡Qué alegría verte de nuevo! 😊')
    : (nombre ? `¡Hola, ${nombre}! 👋` : '¡Hola! 👋');
  await provider.sendButtons(
    clientId,
    `${saludo}\nBienvenido/a a ${config.businessName}\n\n¿En qué te ayudo hoy? 😊`,
    [
      { id: 'menu_reservar', label: '📅 Reservar cita' },
      { id: 'menu_ver', label: '🔎 Ver mis citas' },
      { id: 'menu_cancelar', label: '❌ Cancelar cita' },
      { id: 'menu_modificar', label: '✏️ Modificar cita' },
    ]
  );
}

async function handleMenu(clientId, clientLabel, input, provider, session) {
  if (input === 'menu_reservar') return iniciarReserva(clientId, provider, session);
  if (input === 'menu_ver') return verMisCitas(clientId, provider);
  if (input === 'menu_cancelar') return iniciarCancelacion(clientId, provider, session);
  if (input === 'menu_modificar') return iniciarModificacion(clientId, provider, session);
  return showMenu(clientId, provider, clientLabel);
}

// ========== SUGERIR HUECO ALTERNATIVO (compartido reserva/modificar) ==========

/**
 * Cuando no hay hueco en el día/hora pedido, buscamos el más cercano y lo
 * ofrecemos directamente en vez de dejar al cliente sin opciones.
 * flow = 'reservar' | 'modificar' indica qué hacer si el cliente dice que sí.
 */
async function ofrecerAlternativa(clientId, provider, session, { flow, desde, duracionMin, mensajePrevio }) {
  const alternativa = await findNextAvailableSlot(desde, duracionMin);
  session.data.altFlow = flow;

  if (!alternativa) {
    resetSession(clientId);
    return provider.sendMessage(
      clientId,
      `${mensajePrevio}\n\nTampoco veo huecos en los próximos días 😔\nEscribe /start y probamos más adelante.`
    );
  }

  session.data.altDia = alternativa.day;
  session.data.altSlot = alternativa.slot;
  session.step = 'esperando_alternativa';

  await provider.sendButtons(
    clientId,
    `${mensajePrevio}\n\nEl hueco libre más cercano es:\n📅 ${diaLabel(alternativa.day)}\n⏰ ${alternativa.slot.label}h\n\n¿Te viene bien? 😊`,
    [
      { id: 'alt_si', label: '✅ Sí, perfecto' },
      { id: 'alt_no', label: '📆 Prefiero otro día' },
    ]
  );
}

async function handleAlternativa(clientId, clientLabel, input, provider, session) {
  if (input === 'alt_no') {
    if (session.data.altFlow === 'modificar') {
      return mostrarDias(clientId, provider, session, 'modificar_dia');
    }
    return mostrarDias(clientId, provider, session, 'reservar_dia');
  }

  if (input !== 'alt_si') {
    return provider.sendMessage(clientId, 'Elige una de las opciones, porfa 😊');
  }

  session.data.diaElegido = session.data.altDia;
  session.data.slotElegido = session.data.altSlot;

  if (session.data.altFlow === 'modificar') {
    return moverCitaFinal(clientId, provider, session);
  }
  return crearCitaFinal(clientId, clientLabel, provider, session);
}

// ========== RESERVAR CITA ==========

async function iniciarReserva(clientId, provider, session) {
  const existentes = await listMyAppointments(clientId);
  if (existentes.length >= config.maxCitasPorCliente) {
    resetSession(clientId);
    return provider.sendMessage(
      clientId,
      `Ya tienes ${existentes.length} cita(s) reservada(s) 📋\n\nSi quieres otra, primero cancela o modifica alguna. 😊`
    );
  }

  if (config.services.length === 1) {
    session.data.service = config.services[0];
    return mostrarDias(clientId, provider, session, 'reservar_dia');
  }

  session.step = 'reservar_servicio';
  await provider.sendButtons(
    clientId,
    `¡Genial! ✨\n¿Qué servicio te gustaría?`,
    config.services.map((s) => ({ id: `srv_${s.id}`, label: s.nombre }))
  );
}

async function handleElegirServicio(clientId, input, provider, session) {
  const id = input.replace('srv_', '');
  const service = config.services.find((s) => s.id === id);
  if (!service) {
    return provider.sendMessage(clientId, 'Elige un servicio de la lista, porfa 😊');
  }
  session.data.service = service;
  return mostrarDias(clientId, provider, session, 'reservar_dia');
}

async function mostrarDias(clientId, provider, session, nextStep) {
  const dias = getUpcomingBusinessDays();
  session.step = nextStep;
  session.data.diasOfrecidos = dias;
  await provider.sendButtons(
    clientId,
    `📆 ¿Qué día te viene mejor?`,
    dias.map((d, i) => ({ id: `dia_${i}`, label: diaLabel(d) }))
  );
}

async function handleElegirDia(clientId, input, provider, session) {
  const idx = parseInt(input.replace('dia_', ''), 10);
  const dia = session.data.diasOfrecidos?.[idx];
  if (dia === undefined) {
    return provider.sendMessage(clientId, 'Elige uno de los días de la lista, porfa 😊');
  }
  session.data.diaElegido = dia;
  const slots = await getFreeSlots(dia, session.data.service.duracionMin);
  if (slots.length === 0) {
    return ofrecerAlternativa(clientId, provider, session, {
      flow: 'reservar',
      desde: addDays(dia, 1),
      duracionMin: session.data.service.duracionMin,
      mensajePrevio: `Vaya, no queda ningún hueco el ${diaLabel(dia)} 😕`,
    });
  }
  session.data.slotsOfrecidos = slots;
  session.step = 'reservar_hora';
  await provider.sendButtons(
    clientId,
    `⏰ Estos son los huecos libres\nel ${diaLabel(dia)}:`,
    slots.map((s, i) => ({ id: `hora_${i}`, label: `${s.label}h` }))
  );
}

async function handleElegirHora(clientId, input, provider, session) {
  const idx = parseInt(input.replace('hora_', ''), 10);
  const slot = session.data.slotsOfrecidos?.[idx];
  if (!slot) {
    return provider.sendMessage(clientId, 'Elige una hora de la lista, porfa 😊');
  }
  session.data.slotElegido = slot;
  session.step = 'reservar_confirmar';
  await provider.sendButtons(
    clientId,
    `¿Confirmamos tu cita? 📝\n\n${session.data.service.nombre}\n📅 ${diaLabel(session.data.diaElegido)}\n⏰ ${slot.label}h`,
    [
      { id: 'confirmar_si', label: '✅ Sí, reservar' },
      { id: 'confirmar_no', label: '↩️ Cancelar' },
    ]
  );
}

async function handleConfirmarReserva(clientId, clientLabel, input, provider, session) {
  if (input !== 'confirmar_si') {
    resetSession(clientId);
    return showMenu(clientId, provider, clientLabel);
  }
  return crearCitaFinal(clientId, clientLabel, provider, session);
}

async function crearCitaFinal(clientId, clientLabel, provider, session) {
  const { service, slotElegido, diaElegido } = session.data;
  const result = await createAppointment({
    clientId,
    clientLabel,
    serviceName: service.nombre,
    start: slotElegido.start,
    end: slotElegido.end,
  });

  if (!result.ok) {
    return ofrecerAlternativa(clientId, provider, session, {
      flow: 'reservar',
      desde: diaElegido,
      duracionMin: service.duracionMin,
      mensajePrevio: 'Vaya, justo se ha ocupado ese hueco 😅',
    });
  }

  resetSession(clientId);
  return provider.sendMessage(
    clientId,
    `¡Cita reservada! 🎉\n\n${service.nombre}\n📅 ${diaLabel(slotElegido.start)}\n⏰ ${slotElegido.label}h\n\n¡Te esperamos! 😊`
  );
}

// ========== VER MIS CITAS ==========

async function verMisCitas(clientId, provider) {
  const [citas, historial] = await Promise.all([
    listMyAppointments(clientId),
    listAppointmentHistory(clientId, 5),
  ]);
  resetSession(clientId);

  if (citas.length === 0 && historial.length === 0) {
    return provider.sendMessage(
      clientId,
      `Todavía no tienes ninguna cita 😊\nEscribe /start para reservar una.`
    );
  }

  let mensaje = '';
  if (citas.length > 0) {
    const lista = citas.map((c) => `\n📌 ${horaLabel(c)}`).join('');
    mensaje += `📋 Tus próximas citas:${lista}\n\n`;
  } else {
    mensaje += `📋 No tienes citas próximas 😊\n\n`;
  }

  if (historial.length > 0) {
    const lista = historial.map((c) => `\n✅ ${horaLabel(c)}`).join('');
    mensaje += `🕐 Tu historial reciente:${lista}\n\n`;
  }

  await provider.sendMessage(clientId, `${mensaje}¡Nos vemos pronto! 😊`);
}

// ========== CANCELAR CITA ==========

async function iniciarCancelacion(clientId, provider, session) {
  const citas = await listMyAppointments(clientId);
  if (citas.length === 0) {
    resetSession(clientId);
    return provider.sendMessage(clientId, `No tienes ninguna cita para cancelar 😊`);
  }
  session.step = 'cancelar_elegir';
  session.data.citas = citas;
  await provider.sendButtons(
    clientId,
    `¿Cuál quieres cancelar? 🗓️`,
    citas.map((c, i) => ({ id: `cancel_${i}`, label: horaLabel(c) }))
  );
}

async function handleCancelarElegir(clientId, input, provider, session) {
  const idx = parseInt(input.replace('cancel_', ''), 10);
  const cita = session.data.citas?.[idx];
  resetSession(clientId);
  if (!cita) {
    return provider.sendMessage(clientId, 'No he encontrado esa cita 😕');
  }
  const result = await cancelAppointment(clientId, cita.id);
  if (!result.ok) {
    return provider.sendMessage(clientId, 'No he podido cancelarla, algo ha ido mal 😅');
  }
  return provider.sendMessage(
    clientId,
    `Cita cancelada ✅\n\nSi cambias de opinión, escribe /start\ny reservamos otra cuando quieras. 😊`
  );
}

// ========== MODIFICAR CITA ==========

async function iniciarModificacion(clientId, provider, session) {
  const citas = await listMyAppointments(clientId);
  if (citas.length === 0) {
    resetSession(clientId);
    return provider.sendMessage(clientId, `No tienes ninguna cita para modificar 😊`);
  }
  session.step = 'modificar_elegir_cita';
  session.data.citas = citas;
  await provider.sendButtons(
    clientId,
    `¿Cuál quieres mover a otro horario? ✏️`,
    citas.map((c, i) => ({ id: `mod_${i}`, label: horaLabel(c) }))
  );
}

async function handleModificarElegirCita(clientId, input, provider, session) {
  const idx = parseInt(input.replace('mod_', ''), 10);
  const cita = session.data.citas?.[idx];
  if (!cita) {
    return provider.sendMessage(clientId, 'No he encontrado esa cita 😕');
  }
  session.data.citaAModificar = cita;
  const durationMin = (new Date(cita.end.dateTime) - new Date(cita.start.dateTime)) / 60000;
  session.data.duracionMin = durationMin;
  return mostrarDias(clientId, provider, session, 'modificar_dia');
}

async function handleModificarDia(clientId, input, provider, session) {
  const idx = parseInt(input.replace('dia_', ''), 10);
  const dia = session.data.diasOfrecidos?.[idx];
  if (dia === undefined) {
    return provider.sendMessage(clientId, 'Elige uno de los días de la lista, porfa 😊');
  }
  const slots = await getFreeSlots(dia, session.data.duracionMin);
  if (slots.length === 0) {
    return ofrecerAlternativa(clientId, provider, session, {
      flow: 'modificar',
      desde: addDays(dia, 1),
      duracionMin: session.data.duracionMin,
      mensajePrevio: `Vaya, no queda ningún hueco el ${diaLabel(dia)} 😕`,
    });
  }
  session.data.diaElegido = dia;
  session.data.slotsOfrecidos = slots;
  session.step = 'modificar_hora';
  await provider.sendButtons(
    clientId,
    `⏰ Huecos disponibles\nel ${diaLabel(dia)}:`,
    slots.map((s, i) => ({ id: `hora_${i}`, label: `${s.label}h` }))
  );
}

async function handleModificarHora(clientId, input, provider, session) {
  const idx = parseInt(input.replace('hora_', ''), 10);
  const slot = session.data.slotsOfrecidos?.[idx];
  if (!slot) {
    return provider.sendMessage(clientId, 'Elige una hora de la lista, porfa 😊');
  }
  session.data.slotElegido = slot;
  return moverCitaFinal(clientId, provider, session);
}

async function moverCitaFinal(clientId, provider, session) {
  const { citaAModificar, slotElegido, diaElegido, duracionMin } = session.data;
  const result = await rescheduleAppointment(clientId, citaAModificar.id, slotElegido.start, slotElegido.end);

  if (!result.ok) {
    return ofrecerAlternativa(clientId, provider, session, {
      flow: 'modificar',
      desde: diaElegido,
      duracionMin,
      mensajePrevio: 'Vaya, justo se ha ocupado ese hueco 😅',
    });
  }

  resetSession(clientId);
  return provider.sendMessage(
    clientId,
    `¡Cita movida! ✅\n\n📅 ${diaLabel(slotElegido.start)}\n⏰ ${slotElegido.label}h\n\n¡Te esperamos! 😊`
  );
}
