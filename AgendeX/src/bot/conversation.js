import { handleTurn, resetSession } from './aiAgent.js';

/**
 * Punto de entrada único del bot. Cada mensaje de texto se manda tal cual al
 * agente de IA (aiAgent.js), que decide qué decir y qué herramientas de
 * calendario llamar. No hay máquina de estados ni botones.
 */
export async function handleIncoming({ clientId, clientLabel, text, clientPhone }, provider) {
  const input = (text || '').trim();

  if (input === '/start') {
    resetSession(clientId);
    const saludo = await handleTurn(
      clientId,
      clientLabel,
      'El cliente acaba de abrir la conversación. Salúdalo con calidez y pregúntale en qué le puedes ayudar.',
      clientPhone
    );
    return provider.sendMessage(clientId, saludo);
  }

  const respuesta = await handleTurn(clientId, clientLabel, input, clientPhone);
  return provider.sendMessage(clientId, respuesta);
}
