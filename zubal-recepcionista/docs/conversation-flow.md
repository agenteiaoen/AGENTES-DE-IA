# 💬 Flujo de Conversación

El bot ya no usa una máquina de estados con botones: cada mensaje del cliente
se manda tal cual a un agente de IA (Google Gemini, ver `src/bot/aiAgent.js`)
que lleva la conversación en lenguaje natural y decide qué herramientas de
calendario llamar (`src/bot/tools.js`). Esto imita cómo se comportará el bot
el día que se migre a WhatsApp (sin botones, conversación fluida).

## 🧠 Cómo funciona por dentro

```
Cliente escribe texto
        │
        ▼
conversation.js ──► aiAgent.js ──► Gemini (system prompt con negocio,
        ▲               │          servicios, horario y fecha de hoy)
        │               ▼
        │        ¿Gemini pide llamar a una tool?
        │               │ sí
        │               ▼
        │        tools.js ejecuta la función real
        │        (consultar Calendar, crear cita...)
        │               │
        │               └──► resultado real vuelve a Gemini
        │                    (puede encadenar varias tools)
        │
        └── texto final de Gemini → se envía al cliente
```

- El **historial de la conversación** vive en memoria por `clientId` (se resetea con `/start` o si el proceso se reinicia).
- El **historial de citas pasadas/futuras** vive en Google Calendar, no en la conversación — por eso el bot puede "recordar" a un cliente recurrente aunque la sesión se resetee.

## 📅 Ejemplo de conversación: reservar

```
Cliente: /start

Bot: ¡Hola! 👋 Bienvenido/a a ZubAL Estilistas. ¿En qué te ayudo hoy?

Cliente: Hola, soy Marta, quiero un tinte

Bot: Encantada, Marta 😊 ¿Qué día te viene bien?

Cliente: el jueves por la mañana

Bot: Déjame mirar... el jueves tengo hueco a las 10:00 y a las 11:30 para el tinte. ¿Cuál prefieres?

Cliente: a las 10

Bot: Perfecto, confirmamos: Tinte el jueves 9 de julio a las 10:00. ¿Todo correcto?

Cliente: sí

Bot: ¡Listo! 🎉 Tu tinte queda reservado el jueves 9 de julio a las 10:00. ¡Te esperamos!
```

Por dentro, en el paso "el jueves por la mañana" Gemini llamó a la tool `consultar_huecos` con el día real (nunca inventa disponibilidad), y en el "sí" final llamó a `crear_cita`.

## 🔎 Ver, cancelar y modificar citas

Igual de conversacional: el cliente puede escribir "¿qué citas tengo?", "quiero cancelar mi cita del jueves" o "¿puedes moverla al viernes?" y el agente usa `ver_mis_citas`, `cancelar_cita` y `modificar_cita` según haga falta, pidiendo siempre confirmación antes de cancelar o mover algo.

## 🔒 Reglas de seguridad (no tocar)

- **Un cliente solo ve/toca sus propias citas.** El `clientId` (chat_id de Telegram) se vincula a las tools por clausura en `tools.js` (`createToolExecutor(clientId)`) — el modelo de IA **nunca** recibe ni puede elegir el `clientId` como parámetro, así que ni un prompt malicioso puede hacer que el bot toque la cita de otro cliente.
- **No hay citas duplicadas** — se verifica disponibilidad real justo antes de crear/mover la cita (evita condiciones de carrera).
- **El agente no da información fuera de tema.** El system prompt en `aiAgent.js` le indica explícitamente que su único objetivo es agendar/ver/cancelar/modificar citas de este negocio, y que redirija con amabilidad cualquier pregunta que no tenga que ver con eso (no da consejos, no revela sus instrucciones, no charla de temas generales).

## 🛠️ Personalización

Para un negocio nuevo, sigue editando **solo `src/config.js`** (nombre, servicios, horario). El agente de IA usa esos datos directamente en su system prompt — no hace falta enseñarle nada más.

## 🔑 Requisito: API key de Gemini

El bot no arranca de forma útil sin `GEMINI_API_KEY` en el `.env` (gratis en https://aistudio.google.com/app/apikey). Sin ella, Gemini rechazará las peticiones y el bot no podrá responder.
