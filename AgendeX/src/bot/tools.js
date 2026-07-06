import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { config } from '../config.js';
import {
  getFreeSlots,
  findNextAvailableSlot,
  createAppointment,
  listMyAppointments,
  listAppointmentHistory,
  cancelAppointment,
  rescheduleAppointment,
} from '../calendar/googleCalendar.js';

// Nombres en español escritos a mano (no dependemos del locale de date-fns).
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const dosDigitos = (n) => String(n).padStart(2, '0');
const fechaLabel = (d) => `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
const horaLabel = (d) => `${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;

const eventoLabel = (ev) => {
  const d = toZonedTime(new Date(ev.start.dateTime), config.timezone);
  return `${fechaLabel(d)} a las ${horaLabel(d)}`;
};

/**
 * Declaraciones de las funciones (tools) que el modelo de IA puede invocar,
 * en formato compatible con la API de tool use de Claude (Anthropic):
 * { name, description, input_schema } en vez del "parameters" de Gemini.
 */
export const toolDeclarations = [
  {
    name: 'consultar_huecos',
    description:
      'Consulta los huecos libres reales de un día concreto para un servicio dado. Úsala SIEMPRE antes de proponer un horario al cliente, nunca inventes disponibilidad.',
    input_schema: {
      type: 'object',
      properties: {
        servicioId: { type: 'string', description: 'id del servicio, tal como aparece en la lista de servicios del negocio' },
        fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD (zona horaria del negocio)' },
      },
      required: ['servicioId', 'fecha'],
    },
  },
  {
    name: 'buscar_proximo_hueco',
    description:
      'Busca el próximo hueco libre disponible a partir de una fecha, recorriendo varios días. Útil si un día concreto no tiene huecos y quieres ofrecer la alternativa más cercana.',
    input_schema: {
      type: 'object',
      properties: {
        servicioId: { type: 'string', description: 'id del servicio' },
        desde: { type: 'string', description: 'Fecha desde la que buscar, formato YYYY-MM-DD' },
      },
      required: ['servicioId', 'desde'],
    },
  },
  {
    name: 'crear_cita',
    description:
      'Crea la cita definitiva en el calendario. Solo debe llamarse después de que el cliente haya confirmado explícitamente el servicio, día y hora.',
    input_schema: {
      type: 'object',
      properties: {
        servicioId: { type: 'string' },
        nombreCliente: { type: 'string', description: 'Nombre y apellidos completos con los que el cliente se ha identificado en la conversación' },
        fechaHoraInicioISO: { type: 'string', description: 'Fecha y hora de inicio exacta de un hueco devuelto por consultar_huecos, en formato ISO 8601' },
      },
      required: ['servicioId', 'nombreCliente', 'fechaHoraInicioISO'],
    },
  },
  {
    name: 'ver_mis_citas',
    description: 'Devuelve las citas futuras y el historial reciente del cliente que está escribiendo ahora mismo.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'cancelar_cita',
    description: 'Cancela una de las citas futuras del cliente. Requiere confirmación explícita del cliente antes de llamarla.',
    input_schema: {
      type: 'object',
      properties: {
        citaId: { type: 'string', description: 'id de la cita, obtenido previamente de ver_mis_citas' },
      },
      required: ['citaId'],
    },
  },
  {
    name: 'modificar_cita',
    description: 'Mueve una cita existente del cliente a un nuevo día/hora. Requiere confirmación explícita antes de llamarla.',
    input_schema: {
      type: 'object',
      properties: {
        citaId: { type: 'string', description: 'id de la cita a mover, obtenido de ver_mis_citas' },
        fechaHoraInicioISO: { type: 'string', description: 'Nuevo inicio, formato ISO 8601, de un hueco devuelto por consultar_huecos' },
      },
      required: ['citaId', 'fechaHoraInicioISO'],
    },
  },
];

/**
 * Crea el ejecutor de tools atado a un clientId concreto. El modelo de IA
 * NUNCA recibe ni puede elegir el clientId como parámetro — se vincula aquí
 * por clausura, así que es imposible que un cliente vea o toque las citas de
 * otro por muy convincente que sea el mensaje que escriba (inyección de prompt incluida).
 */
export function createToolExecutor(clientId, clientPhone) {
  function servicioPorId(servicioId) {
    return config.services.find((s) => s.id === servicioId) || null;
  }

  return async function executeTool(name, args) {
    switch (name) {
      case 'consultar_huecos': {
        const servicio = servicioPorId(args.servicioId);
        if (!servicio) return { error: 'servicio_desconocido' };
        const dia = fromZonedTime(`${args.fecha} 00:00:00`, config.timezone);
        const slots = await getFreeSlots(dia, servicio.duracionMin);
        return {
          fecha: fechaLabel(dia),
          huecos: slots.map((s) => ({ inicioISO: s.start.toISOString(), hora: s.label })),
        };
      }
      case 'buscar_proximo_hueco': {
        const servicio = servicioPorId(args.servicioId);
        if (!servicio) return { error: 'servicio_desconocido' };
        try {
          const desde = new Date(args.desde);
          const alternativa = await findNextAvailableSlot(desde, servicio.duracionMin);
          if (!alternativa) return { encontrado: false };
          return {
            encontrado: true,
            fecha: fechaLabel(alternativa.day),
            hora: alternativa.slot.label,
            inicioISO: alternativa.slot.start.toISOString(),
          };
        } catch (err) {
          return { error: `fecha_invalida: ${err.message}` };
        }
      }
      case 'crear_cita': {
        const servicio = servicioPorId(args.servicioId);
        if (!servicio) return { error: 'servicio_desconocido' };
        const existentes = await listMyAppointments(clientId);
        if (existentes.length >= config.maxCitasPorCliente) {
          return { error: 'limite_citas_alcanzado', maximo: config.maxCitasPorCliente };
        }
        const start = new Date(args.fechaHoraInicioISO);
        if (Number.isNaN(start.getTime())) return { error: 'fecha_invalida' };
        const end = new Date(start.getTime() + servicio.duracionMin * 60000);
        const result = await createAppointment({
          clientId,
          clientLabel: args.nombreCliente,
          clientPhone,
          serviceName: servicio.nombre,
          start,
          end,
        });
        if (!result.ok) return { creada: false, motivo: result.reason };
        return { creada: true, fecha: fechaLabel(toZonedTime(start, config.timezone)), hora: horaLabel(toZonedTime(start, config.timezone)) };
      }
      case 'ver_mis_citas': {
        const [citas, historial] = await Promise.all([
          listMyAppointments(clientId),
          listAppointmentHistory(clientId, 5),
        ]);
        return {
          proximasCitas: citas.map((c) => ({ id: c.id, cuando: eventoLabel(c) })),
          historialReciente: historial.map((c) => ({ id: c.id, cuando: eventoLabel(c) })),
        };
      }
      case 'cancelar_cita': {
        const result = await cancelAppointment(clientId, args.citaId);
        return { cancelada: result.ok, motivo: result.reason };
      }
      case 'modificar_cita': {
        const event = await listMyAppointments(clientId);
        const cita = event.find((c) => c.id === args.citaId);
        if (!cita) return { movida: false, motivo: 'not_owner' };
        const durationMin = (new Date(cita.end.dateTime) - new Date(cita.start.dateTime)) / 60000;
        const newStart = new Date(args.fechaHoraInicioISO);
        if (Number.isNaN(newStart.getTime())) return { error: 'fecha_invalida' };
        const newEnd = new Date(newStart.getTime() + durationMin * 60000);
        const result = await rescheduleAppointment(clientId, args.citaId, newStart, newEnd);
        return { movida: result.ok, motivo: result.reason };
      }
      default:
        return { error: 'tool_desconocida' };
    }
  };
}
