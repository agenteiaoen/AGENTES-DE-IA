# 🤖 Modelo Agente IA

Plantilla base para crear recepcionistas virtuales por Telegram (con Google Calendar) para **cualquier negocio que funcione con citas**: peluquerías, clínicas, talleres, consultorías, academias, etc.

No es un bot para un negocio concreto — es el **punto de partida** que se copia y adapta cada vez que hay que montar uno nuevo para un cliente. El de ZubAL Estilistas (`../Prueba Agente IA`) nació de esta misma plantilla.

## ✨ Qué hace (sin tocar nada)

- 💬 Conversación 100% en lenguaje natural (sin botones ni menús) — un agente de IA (Google Gemini) entiende lo que el cliente escribe, tal cual funcionará en WhatsApp
- 📅 Reserva citas comprobando disponibilidad real en Google Calendar
- 🔍 Sugiere automáticamente el hueco más cercano si el pedido no está libre
- ✏️ Permite modificar y ❌ cancelar citas — cada cliente solo ve/toca las suyas
- 🧠 Reconoce clientes recurrentes y guarda historial (memoria vía Google Calendar, sin base de datos aparte)
- 🌐 Preparado para desplegarse gratis 24/7 (Render, modo webhook)
- 🗣️ Todo en español, con un tono cercano y cálido

## 🚀 Cómo replicarlo para un negocio nuevo

Ver **[COMO-REPLICAR.md](COMO-REPLICAR.md)** — la guía paso a paso completa.

Resumen rápido:
1. Copia esta carpeta entera y ponle el nombre del negocio (sin espacios, ej. `clinica-dental-bot`)
2. Edita **solo** `src/config.js`: nombre del negocio, servicios, horario, zona horaria
3. Crea el bot de Telegram, la API key de Gemini y las credenciales de Google Calendar (ver `docs/`)
4. `npm install` y `npm start` para probar en local
5. Despliega en Render con el `render.yaml` incluido (ver `docs/deployment.md`)

## 📁 Estructura

```
Agente Modelo Recepcion/
├── package.json
├── .env.example
├── .gitignore
├── render.yaml            # Plantilla de despliegue (editar name y rootDir)
├── README.md              # Este archivo
├── COMO-REPLICAR.md       # Guía paso a paso para adaptar a un negocio nuevo
├── docs/
│   ├── telegram-setup.md
│   ├── google-calendar-setup.md
│   ├── conversation-flow.md
│   └── deployment.md
└── src/
    ├── index.js                     # Arranque (no tocar)
    ├── config.js                    # ⭐ ÚNICO archivo a editar por negocio
    ├── providers/telegramProvider.js # Capa de Telegram (no tocar)
    ├── calendar/googleCalendar.js    # Lógica de Google Calendar (no tocar)
    └── bot/
        ├── conversation.js           # Punto de entrada de cada mensaje (no tocar)
        ├── aiAgent.js                # Motor conversacional Gemini + system prompt (no tocar salvo tono)
        └── tools.js                  # Funciones que la IA puede llamar (no tocar)
```

## 🔒 Principios de diseño (no romper al adaptar)

1. **Google Calendar es la única fuente de verdad.** No hace falta base de datos: cada cita guarda el `clientId` de Telegram oculto en el evento, y ese campo es lo que impide que un cliente vea o cancele la cita de otro.
2. **Todo negocio nuevo solo requiere tocar `config.js`.** Si te encuentras editando `conversation.js`, `aiAgent.js`, `tools.js` o `googleCalendar.js` para algo que no sea el tono de los mensajes, probablemente el cambio debería ir en `config.js` en su lugar.
3. **Conversación 100% en lenguaje natural, sin botones.** El agente de IA (Gemini) entiende nombre, servicio, día y hora tal como los escriba el cliente — nada de menús ni listas de alias que mantener. El `clientId` real nunca se le pasa al modelo como parámetro (va vinculado por clausura en `tools.js`), así que no puede tocar la cita de otro cliente aunque el mensaje intente engañarlo.
4. **Memoria simple y sin sobre-ingeniería.** La sesión de conversación vive en memoria (se resetea si el proceso reinicia) y el historial de citas vive en Google Calendar. No añadas Redis ni base de datos salvo que el negocio realmente lo necesite (alto volumen, varias instancias).
5. **Webhook en producción, polling en local.** Esto ya está resuelto en `telegramProvider.js` vía la variable `PUBLIC_URL` — no hace falta reimplementarlo.

## 🆘 Ayuda

Cada `docs/*.md` cubre un paso concreto de la configuración. Si algo falla, la sección de "Problemas comunes" al final de cada guía suele tener la respuesta.
