# 💬 Flujo de Conversación

Este documento explica cómo fluye una conversación típica con el bot. Los ejemplos usan un negocio genérico con dos servicios ("Servicio de ejemplo 1" y "2") — sustitúyelos por los reales al adaptar la plantilla.

## 📌 Menú principal

Cuando un cliente envía `/start`, ve un saludo distinto según si ya tiene historial de citas pasadas (memoria vía Google Calendar) o es la primera vez:

```
¡Hola, María! 👋                    ¡Qué alegría verte de nuevo, María! 😊
Bienvenido/a a Mi Negocio            Bienvenido/a a Mi Negocio

¿En qué te ayudo hoy? 😊             ¿En qué te ayudo hoy? 😊

[📅 Reservar cita] [🔎 Ver mis citas] [❌ Cancelar cita] [✏️ Modificar cita]
```

## 📅 Flujo: Reservar cita

```
Cliente: /start → [📅 Reservar cita]

Bot: ¡Genial! ✨
     ¿Cómo te llamas?

Cliente: María

Bot: Encantada de conocerte, María 😊
     ¿Qué necesitas hoy? (por ejemplo: Servicio de ejemplo 1)

Cliente: quiero uñas

Bot: 📆 ¿Qué día te viene mejor?

     [lunes 6 de julio] [martes 7 de julio] ...

Cliente: [elige un día]

Bot: ⏰ Estos son los huecos libres el lunes 6 de julio:

     [10:00h] [10:30h] [11:00h] ...

Cliente: [elige una hora]

Bot: ¿Confirmamos tu cita? 📝

     Servicio de ejemplo 1
     📅 lunes 6 de julio
     ⏰ 10:30h

     [✅ Sí, reservar] [↩️ Cancelar]

Cliente: [✅ Sí, reservar]

Bot: ¡Cita reservada! 🎉

     Servicio de ejemplo 1
     📅 lunes 6 de julio
     ⏰ 10:30h

     ¡Te esperamos! 😊
```

### Si no hay hueco disponible (sugerencia automática)

En vez de dejar al cliente sin opciones, el bot busca el hueco libre más cercano (mismo día más tarde, u otro día) y lo ofrece directamente:

```
Bot: Vaya, no queda ningún hueco el lunes 6 de julio 😕

     El hueco libre más cercano es:
     📅 martes 7 de julio
     ⏰ 09:00h

     ¿Te viene bien? 😊

     [✅ Sí, perfecto] [📆 Prefiero otro día]
```

Si el cliente acepta, la cita se crea directamente sin pasos adicionales. Lo mismo ocurre si, justo al confirmar, el hueco se acaba de ocupar (condición de carrera) — el bot reacciona ofreciendo la siguiente alternativa en vez de dejar al cliente sin respuesta.

## 🔎 Flujo: Ver mis citas

```
Cliente: /start → [🔎 Ver mis citas]

Bot: 📋 Tus próximas citas:

     📌 martes 7 de julio a las 09:00

     🕐 Tu historial reciente:

     ✅ 3 de julio
     ✅ 20 de junio

     ¡Nos vemos pronto! 😊
```

El historial (citas pasadas) se guarda en el propio Google Calendar del negocio — no hace falta base de datos aparte, y sobrevive a reinicios del bot.

## ❌ Flujo: Cancelar cita

```
Cliente: /start → [❌ Cancelar cita]

Bot: ¿Cuál quieres cancelar? 🗓️

     [7 jul a las 09:00]

Cliente: [elige la cita]

Bot: Cita cancelada ✅

     Si cambias de opinión, escribe /start
     y reservamos otra cuando quieras. 😊
```

## ✏️ Flujo: Modificar cita

Igual que reservar, pero partiendo de una cita ya existente: el cliente elige cuál mover, luego día y hora nuevos. Si no hay hueco, también se le ofrece automáticamente la alternativa más cercana.

## 🔒 Reglas de seguridad (no tocar)

- **Un cliente solo ve/toca sus propias citas** — cada evento de Google Calendar guarda el `clientId` de Telegram en propiedades privadas, y toda consulta de "mis citas" filtra por ese campo.
- **No hay citas duplicadas** — se verifica disponibilidad real justo antes de crear/mover la cita (evita condiciones de carrera).
- **Si un hueco se ocupa mientras el cliente decide** — se le ofrece automáticamente la alternativa más cercana en vez de un callejón sin salida.

## 🛠️ Personalización

Para un negocio nuevo, **solo hace falta editar `src/config.js`** (nombre, servicios, horario). Los mensajes en sí viven en `src/bot/conversation.js` si quieres afinar el tono, pero no deberían necesitar cambios funcionales.

## 🗣️ Sobre el lenguaje natural

El nombre del cliente y el servicio que necesita se piden como **texto libre**, no con botones: el bot pregunta "¿Cómo te llamas?" y "¿Qué necesitas hoy?", y hace matching contra el nombre y los `aliases` de cada servicio en `config.js` (ver `matchServicio` en `conversation.js`). Si el cliente escribe algo que no reconoce, se lo dice y le muestra la lista de servicios disponibles para que lo intente de nuevo.

Día y hora, en cambio, se siguen ofreciendo con **botones**: pedir al cliente que escriba "el jueves a las 5" obligaría a parsear fechas en lenguaje natural, lo cual falla más de lo que acierta en un MVP. Si en el futuro se quiere añadir comprensión de lenguaje natural también para fechas, se puede extender `conversation.js` apoyándose en la API de Claude, pero no es necesario para que el bot funcione bien.
