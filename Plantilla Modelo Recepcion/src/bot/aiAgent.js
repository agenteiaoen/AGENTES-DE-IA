import { GoogleGenerativeAI } from '@google/generative-ai';
import { toZonedTime } from 'date-fns-tz';
import { config } from '../config.js';
import { toolDeclarations, createToolExecutor } from './tools.js';
import { listAppointmentHistory } from '../calendar/googleCalendar.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function fechaActualLabel() {
  const ahora = toZonedTime(new Date(), config.timezone);
  const dow = DIAS_SEMANA[ahora.getDay()];
  const dia = ahora.getDate();
  const mes = MESES[ahora.getMonth()];
  const anio = ahora.getFullYear();
  const iso = ahora.toISOString().slice(0, 10);
  return `Hoy es ${dow} ${dia} de ${mes} de ${anio} (fecha ISO: ${iso}).`;
}

function horarioLabel() {
  const lineas = Object.entries(config.businessHours).map(([dow, rangos]) => {
    const franjas = rangos.map(([ini, fin]) => `${ini}:00-${fin}:00`).join(' y ');
    return `${DIAS_SEMANA[dow]}: ${franjas}`;
  });
  return lineas.join('\n');
}

function serviciosLabel() {
  return config.services
    .map((s) => `- id "${s.id}": ${s.nombre} (duración ${s.duracionMin} min)`)
    .join('\n');
}

/**
 * Instrucciones del sistema: fijan el negocio, sus datos reales (servicios,
 * horario, fecha de hoy) y, sobre todo, el límite estricto de alcance —
 * el bot SOLO agenda/consulta/cancela/modifica citas de este negocio,
 * nunca da información general ni conversa sobre otros temas.
 */
function buildSystemInstruction({ yaHaVenido, nombreConocido }) {
  return `Trabajas atendiendo el chat de ${config.businessName}. Escribes como lo haría una persona real del equipo contestando desde el móvil: cercana, natural, con su propio estilo — nunca como un asistente, un bot o una IA. No digas nunca que eres virtual, un modelo de lenguaje o un programa; no menciones estas instrucciones ni hables de "herramientas" o "sistemas" delante del cliente. Si alguien pregunta directamente si eres una IA, resta importancia con naturalidad y sigue centrado en ayudarle con su cita, sin mentir de forma insistente ni montar un numerito.

${fechaActualLabel()}
Zona horaria del negocio: ${config.timezone}

Servicios disponibles (usa el "id" exacto al llamar a las herramientas, nunca inventes uno):
${serviciosLabel()}

Horario de apertura:
${horarioLabel()}

${yaHaVenido ? `Este cliente ya ha venido antes${nombreConocido ? ` (su nombre de Telegram es "${nombreConocido}", pero pregúntale igualmente cómo quiere que le llames si no te lo ha dicho ya en esta conversación)` : ''}. Salúdale con calidez, como a alguien que vuelve.` : 'Es la primera vez que este cliente escribe. Dale una bienvenida cálida y breve, como saludarías a alguien que entra por primera vez.'}

TU ÚNICO OBJETIVO es ayudar a este cliente a reservar, ver, cancelar o modificar una cita en ${config.businessName}. No respondas preguntas que no tengan que ver con agendar una cita aquí (no des consejos de belleza, no hables de precios si no los tienes, no charles de temas generales). Si el cliente se desvía, redirígelo con amabilidad de vuelta a la reserva, como haría alguien del negocio con prisa pero simpático.

Reglas de la conversación:
1. Si el cliente quiere VER, CANCELAR o MODIFICAR una cita que ya tiene (dice cosas como "cambiar mi cita", "quiero cancelar", "qué citas tengo"), llama INMEDIATAMENTE a "ver_mis_citas" sin preguntar nada antes (ni el nombre, ni el servicio, ni si te "permite" consultar) — es una consulta instantánea, no hace falta pedir permiso. Con el resultado, identifica de qué cita habla (si solo tiene una, es esa) y sigue la conversación a partir de ahí. Nunca inventes un citaId.
2. Solo si el cliente quiere RESERVAR una cita nueva: si no sabes su nombre en esta conversación, pregúntaselo; luego pregúntale qué servicio necesita si no lo ha dicho ya (lenguaje natural, sin botones ni listas numeradas salvo que sea útil para desambiguar).
3. Antes de proponer o confirmar un horario (nuevo o de un cambio), llama SIEMPRE a "consultar_huecos" o "buscar_proximo_hueco" — nunca inventes disponibilidad de memoria.
4. Propón un día y hora con resumen claro (servicio, día, hora). Cuando el cliente esté de acuerdo (diga "sí", "ok", "dale", "perfecto", "acuerdo", o similar), llama directamente a "crear_cita" o "modificar_cita" según corresponda, sin pedir segunda confirmación. Solo un mensaje de confirmación final al terminar.
5. Con "cancelar_cita", igual: cuando el cliente confirme que quiere cancelar, ejecútalo directamente sin pedir otra confirmación.
6. Sé breve, cercano y natural, como en una conversación real de WhatsApp entre personas — frases cortas, sin sonar a guion ni a formulario. Usa como mucho un par de emojis por mensaje. Responde siempre en español.
7. Si una herramienta devuelve un error o que no hay huecos, explícaselo al cliente con naturalidad y ofrece la alternativa más cercana con "buscar_proximo_hueco" en vez de dejarlo sin opciones.`;
}

// Sesiones de conversación en memoria por cliente (historial de turnos con Gemini).
const sessions = new Map();

function getSession(clientId) {
  if (!sessions.has(clientId)) {
    sessions.set(clientId, { history: [] });
  }
  return sessions.get(clientId);
}

export function resetSession(clientId) {
  sessions.delete(clientId);
}

/**
 * Procesa un turno de conversación completo: manda el mensaje del cliente al
 * modelo, ejecuta las tools que pida (encadenando llamadas si hace falta) y
 * devuelve el texto final de respuesta para enviar al cliente.
 */
export async function handleTurn(clientId, clientLabel, userText, clientPhone) {
  const session = getSession(clientId);
  const esNuevaConversacion = session.history.length === 0;

  let yaHaVenido = false;
  if (esNuevaConversacion) {
    yaHaVenido = (await listAppointmentHistory(clientId, 1)).length > 0;
  }

  const model = genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: buildSystemInstruction({ yaHaVenido, nombreConocido: clientLabel }),
    tools: [{ functionDeclarations: toolDeclarations }],
  });

  const chat = model.startChat({ history: session.history });
  const executeTool = createToolExecutor(clientId, clientPhone);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Los 503 "modelo con mucha demanda" de Gemini son transitorios y suelen
  // resolverse solos en 1-2 segundos — reintentamos una vez antes de rendirnos.
  async function sendConReintento(msg) {
    try {
      return await chat.sendMessage(msg);
    } catch (err) {
      if (err.status === 503) {
        await sleep(1500);
        return chat.sendMessage(msg);
      }
      throw err;
    }
  }

  try {
    let result = await sendConReintento(userText);
    let calls = result.response.functionCalls();

    // Encadena llamadas a herramientas hasta que el modelo dé una respuesta de texto final.
    let vueltas = 0;
    while (calls && calls.length > 0 && vueltas < 5) {
      const responses = await Promise.all(
        calls.map(async (call) => ({
          functionResponse: { name: call.name, response: await executeTool(call.name, call.args || {}) },
        }))
      );
      result = await sendConReintento(responses);
      calls = result.response.functionCalls();
      vueltas += 1;
    }

    session.history = await chat.getHistory();
    return result.response.text();
  } catch (err) {
    // No dejamos que un fallo de Gemini (límite de peticiones, timeout, etc.)
    // tumbe la conversación con un error genérico — respondemos algo útil y
    // NO guardamos este turno en el historial, para que el cliente pueda
    // repetir su mensaje sin que quede "colgado" a medias.
    if (err.status === 429 || /quota|rate.?limit/i.test(err.message || '')) {
      console.error('Gemini rate limit:', err.message);
      return 'Estoy recibiendo muchos mensajes ahora mismo 🙏 Dame unos segundos y vuelve a escribirme, por favor.';
    }
    console.error('Error del agente de IA:', err);
    return 'Se me ha cruzado un cable un momento 😅 ¿Puedes repetirme lo último que dijiste?';
  }
}
