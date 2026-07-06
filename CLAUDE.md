# Agente IA - Recepcionista

## Quién soy y qué construyo

Soy un creador de agentes de IA con la finalidad de **vender este servicio a terceras empresas**. Este repositorio no es un proyecto de un solo negocio: es la base de un producto replicable de recepcionistas virtuales por chat (Telegram ahora, WhatsApp más adelante), con Google Calendar como fuente de disponibilidad.

## Estructura del repositorio

```
Agente IA - Recepcionista/
├── Prueba Agente IA/     # Bot de pruebas EN PRODUCCIÓN en Telegram (cliente real: ZubAL Estilistas)
│                         # Sirve para probar el motor y para enseñárselo a empresas antes de venderlo.
│                         # A futuro migrará de Telegram a WhatsApp (mismo motor, otro proveedor).
├── Modelo Agente IA/     # Plantilla base genérica para replicar el agente a cualquier negocio nuevo
└── Landing Page/         # Página estática de presentación del producto, para vender el servicio
```

### Prueba Agente IA (producción, Telegram)
- Nombre oficial del asistente: **AgendeX** (así se presenta el bot y así aparece en Telegram)
- Bot de Telegram: `@AgenteIA_Recepcionista_bot`
- Desplegado en Render (plan gratuito): `https://zubal-bot.onrender.com`, modo **webhook**
- Repo GitHub: `github.com/agenteiaoen/AGENTES-DE-IA` (rama `master`), subcarpeta `Prueba Agente IA`
- Motor conversacional: **Groq** (`llama-3.3-70b-versatile`), gratis, 14.400 peticiones/día
- Google Calendar: "ZubAL Estilistas - Citas", cuenta de servicio `zubal-bot@agentes-ia-oen.iam.gserviceaccount.com`
- El bot local (PM2) está **desactivado** para no chocar con el webhook de Render (Telegram solo permite un modo activo a la vez)
- Es el proyecto que se usa para probar cambios antes de aplicarlos a la plantilla, y para migrar de Telegram a WhatsApp cuando toque

### Modelo Agente IA (plantilla)
- Copia genérica de Prueba Agente IA sin nada específico de peluquería (motor todavía con Gemini, no Groq)
- Para un negocio nuevo: **solo se edita `src/config.js`** (nombre, servicios, horario, zona horaria)
- Guía completa de replicación en `Modelo Agente IA/COMO-REPLICAR.md`

### Landing Page
- Página estática (HTML/CSS/JS) para presentar y vender el producto a terceras empresas

## Principios de diseño (no romper)

1. **Google Calendar es la única fuente de verdad.** Cada cita guarda `extendedProperties.private.clientId` (el chat_id de Telegram) — es lo que impide que un cliente vea/cancele la cita de otro. Nunca quitar ese filtro.
2. **Verificación de disponibilidad justo antes de crear/mover una cita** (`isSlotStillFree`), para evitar que dos clientes reserven el mismo hueco a la vez.
3. **Webhook en producción, long polling en local** — ya resuelto en `telegramProvider.js` vía la variable de entorno `PUBLIC_URL`. No reimplementar.
4. **Sesión de conversación en memoria (no persistente)** — se resetea si el proceso reinicia. El historial de citas SÍ persiste, porque vive en Google Calendar (memoria "gratis", sin base de datos).
5. **Conversación 100% en lenguaje natural, sin botones ni menús** — nombre, servicio, día y hora se piden por texto libre; el agente de IA decide qué herramientas de calendario llamar. Así se comportará también en WhatsApp.
6. **El clientId nunca se pasa al modelo de IA como parámetro** — va vinculado por clausura en `tools.js`, así ni un mensaje manipulador puede hacer que el bot toque la cita de otro cliente.
7. **Todo en español (España)**, tono cercano y natural, como una persona real del negocio (no como un bot/asistente genérico), con emojis sin saturar.

## Cómo trabajar conmigo (preferencias del usuario)

- **Prefiero que ejecutes tú los pasos técnicos** (instalar dependencias, crear archivos, hacer commits/push, configurar servicios) en vez de que me des instrucciones para hacerlas yo. No doy por hecho conocimiento de terminal, git, APIs, etc.
- Reserva las instrucciones "hazlo tú" solo para lo que de verdad no se puede delegar: crear cuentas, autenticarse en servicios externos (GitHub, Render, Google Cloud, Claude, Groq), o clics en dashboards de terceros. En esos casos, dame el paso exacto y literal.
- Nunca guardes tokens, claves privadas o contraseñas en archivos de este repo (ya están en `.gitignore`) — solo en `.env` local o en las variables de entorno de la plataforma de despliegue.

## Sistemas externos usados

- **GitHub**: `agenteiaoen/AGENTES-DE-IA`
- **Render**: cuenta vinculada a la misma cuenta de GitHub
- **Telegram**: bot creado vía @BotFather
- **Groq**: motor conversacional del bot de producción (console.groq.com)
- **Google Cloud**: proyecto `agentes-ia-oen`, cuenta de servicio con Google Calendar API habilitada
- **Email personal**: `agentesiaoen@gmail.com` (dueño de los calendarios usados por los bots)
