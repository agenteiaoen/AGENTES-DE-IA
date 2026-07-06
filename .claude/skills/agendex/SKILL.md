---
name: agendex
description: Trabaja en el proyecto AgendeX (recepcionista virtual con IA para agendar citas por Telegram/WhatsApp con Google Calendar). Úsalo cuando el usuario pida cambios, features, fixes o dudas sobre el bot AgendeX, su prompt, sus herramientas de calendario, o su despliegue.
---

# AgendeX — Recepcionista virtual con IA

Skill de referencia para trabajar en `AgendeX/`, el asistente virtual de agendamiento de citas del usuario. Lee esto en vez de pedir que se re-explique el proyecto cada vez.

## Qué es

Bot conversacional que agenda, consulta, modifica y cancela citas/eventos en lenguaje 100% natural (sin botones ni menús), usando **Google Calendar como única fuente de verdad** (no hay base de datos). Fase actual: Telegram (pruebas). Lanzamiento planeado: WhatsApp (mismo motor, otro proveedor de mensajería).

- Nombre del asistente: **AgendeX**
- Motor conversacional: **Claude Haiku** (Anthropic), elegido por ser el modelo más barato/rápido — de sobra para seguir un guion de reserva con function calling, sin gastar de más
- Calendario: Google Calendar API vía cuenta de servicio

## Estructura del proyecto

```
AgendeX/
├── .env.example          # Variables de entorno necesarias (ver ahí la lista completa)
├── package.json
├── render.yaml           # Despliegue en Render (plan gratuito, rootDir: AgendeX)
└── src/
    ├── config.js         # ÚNICO archivo a tocar para personalizar negocio/servicios/horario
    ├── index.js          # Entry point (servidor Express + arranque del provider)
    ├── bot/
    │   ├── aiAgent.js      # Llama a Claude (Anthropic SDK), maneja tool use y sesiones en memoria
    │   ├── conversation.js # Entry point de cada mensaje entrante, delega a aiAgent
    │   └── tools.js        # Declaración de tools (function calling) + ejecutor atado a clientId
    ├── calendar/
    │   └── googleCalendar.js  # Toda la lógica de disponibilidad/citas contra Google Calendar API
    └── providers/
        └── telegramProvider.js  # Única capa que sabe de Telegram; interfaz compatible con WhatsApp
```

## Principios de diseño (no romper)

1. **Google Calendar es la única fuente de verdad.** Cada cita guarda `extendedProperties.private.clientId` — es lo que impide que un cliente vea/cancele la cita de otro. Nunca quitar ese filtro (ver `cancelAppointment`, `listMyAppointments` en `googleCalendar.js`).
2. **Verificación de disponibilidad justo antes de crear/mover una cita** (`isSlotStillFree`), para evitar que dos clientes reserven el mismo hueco a la vez.
3. **El clientId nunca se pasa al modelo de IA como parámetro** — va vinculado por clausura en `tools.js` (`createToolExecutor(clientId, clientPhone)`), así ni un mensaje manipulador puede hacer que el bot toque la cita de otro cliente.
4. **Dos capas de seguridad ante prompt injection**: regex anti-manipulación en `aiAgent.js` (corta antes de llamar a Claude, sin gastar cuota) + alcance cerrado explícito en el system prompt.
5. **Webhook en producción, long polling en local** — resuelto vía `PUBLIC_URL`. No reimplementar.
6. **Sesión de conversación en memoria (no persistente)** — se resetea si el proceso reinicia. El historial de citas SÍ persiste porque vive en Google Calendar.
7. **Conversación 100% en lenguaje natural**, tono cercano, como una persona real (nunca se presenta como IA/bot), con emojis sin saturar. Así se comportará también en WhatsApp.
8. **Modelo Claude Haiku por defecto** — no subir a Sonnet/Opus salvo que el usuario lo pida explícitamente o Haiku demuestre no ser suficiente para una tarea concreta (mantener costes bajos es un requisito, no un detalle).

## Cómo trabajar en este proyecto

- El usuario prefiere que **yo ejecute** los cambios técnicos directamente (editar código, instalar dependencias, probar) en vez de darle instrucciones a él.
- Tras cualquier cambio relevante (nueva feature, cambio de comportamiento, fix de bug), **actualiza la memoria del proyecto** (`proyecto_recepcionistas_ia.md` en el sistema de memoria) reflejando el nuevo estado — el usuario no quiere tener que volver a explicar el contexto en la próxima conversación.
- Si el cambio afecta al prompt del bot (`buildSystemPrompt` en `aiAgent.js`), ten cuidado de no romper las reglas de alcance cerrado ni las capas anti-manipulación.
- Si toca desplegar, el flujo ya validado es GitHub + Render (plan gratuito) + `render.yaml` con `rootDir: AgendeX` + modo webhook. No proponer alternativas de pago salvo que se pida.
- Las credenciales reales (tokens, API keys, clave privada de Google) viven solo en `.env` local o en las variables de entorno de Render — nunca en el repo.
