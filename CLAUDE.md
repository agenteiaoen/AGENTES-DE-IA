# Agente IA - Recepcionista

## Quién soy y qué construyo

Soy un creador de agentes de IA con la finalidad de **vender este servicio a terceras empresas**. Este repositorio no es un proyecto de un solo negocio: es la base de un producto replicable de recepcionistas virtuales por Telegram, con Google Calendar como fuente de disponibilidad.

## Estructura del repositorio

```
Agente IA - Recepcionista/
├── zubal-recepcionista/       # Cliente real EN PRODUCCIÓN (peluquería ZubAL Estilistas)
├── Agente Modelo Recepcion/   # Plantilla base genérica para replicar a otros negocios
└── SKILL Recepcionista.skill  # Skill original de referencia
```

### zubal-recepcionista (producción)
- Nombre oficial del asistente: **AgendeX** (así se presenta el bot y así aparece en Telegram)
- Bot de Telegram: `@AgenteIA_Recepcionista_bot`
- Desplegado en Render (plan gratuito): `https://zubal-bot.onrender.com`, modo **webhook**
- Repo GitHub: `github.com/agenteiaoen/AGENTES-DE-IA` (rama `master`), subcarpeta `zubal-recepcionista`
- Google Calendar: "ZubAL Estilistas - Citas", cuenta de servicio `zubal-bot@agentes-ia-oen.iam.gserviceaccount.com`
- El bot local (PM2) está **desactivado** para no chocar con el webhook de Render (Telegram solo permite un modo activo a la vez)

### Agente Modelo Recepcion (plantilla)
- Copia genérica de zubal-recepcionista sin nada específico de peluquería
- Para un negocio nuevo: **solo se edita `src/config.js`** (nombre, servicios, horario, zona horaria)
- Guía completa de replicación en `Agente Modelo Recepcion/COMO-REPLICAR.md`

## Principios de diseño (no romper)

1. **Google Calendar es la única fuente de verdad.** Cada cita guarda `extendedProperties.private.clientId` (el chat_id de Telegram) — es lo que impide que un cliente vea/cancele la cita de otro. Nunca quitar ese filtro.
2. **Verificación de disponibilidad justo antes de crear/mover una cita** (`isSlotStillFree`), para evitar que dos clientes reserven el mismo hueco a la vez.
3. **Webhook en producción, long polling en local** — ya resuelto en `telegramProvider.js` vía la variable de entorno `PUBLIC_URL`. No reimplementar.
4. **Sesión de conversación en memoria (no persistente)** — se resetea si el proceso reinicia. El historial de citas SÍ persiste, porque vive en Google Calendar (memoria "gratis", sin base de datos).
5. **Botones, no texto libre, para fechas/horas** — evita errores de interpretación de lenguaje natural.
6. **Todo en español (España)**, tono cercano y con emojis, sin saturar.

## Cómo trabajar conmigo (preferencias del usuario)

- **Prefiero que ejecutes tú los pasos técnicos** (instalar dependencias, crear archivos, hacer commits/push, configurar servicios) en vez de que me des instrucciones para hacerlas yo. No doy por hecho conocimiento de terminal, git, APIs, etc.
- Reserva las instrucciones "hazlo tú" solo para lo que de verdad no se puede delegar: crear cuentas, autenticarse en servicios externos (GitHub, Render, Google Cloud, Claude), o clics en dashboards de terceros. En esos casos, dame el paso exacto y literal.
- Nunca guardes tokens, claves privadas o contraseñas en archivos de este repo (ya están en `.gitignore`) — solo en `.env` local o en las variables de entorno de la plataforma de despliegue.

## Sistemas externos usados

- **GitHub**: `agenteiaoen/AGENTES-DE-IA`
- **Render**: cuenta vinculada a la misma cuenta de GitHub
- **Telegram**: bot creado vía @BotFather
- **Google Cloud**: proyecto `agentes-ia-oen`, cuenta de servicio con Google Calendar API habilitada
- **Email personal**: `agentesiaoen@gmail.com` (dueño de los calendarios usados por los bots)
